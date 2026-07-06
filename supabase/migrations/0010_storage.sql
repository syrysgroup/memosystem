-- Private bucket for scanned acknowledgments / attachments. Objects are
-- stored at "<document_id>/<filename>"; access mirrors the parent document's
-- read/write access via the folder name.
insert into storage.buckets (id, name, public)
values ('document-attachments', 'document-attachments', false)
on conflict (id) do nothing;

create policy document_attachments_storage_select on storage.objects for select to authenticated using (
  bucket_id = 'document-attachments'
  and exists (
    select 1 from documents d
    where d.id::text = (storage.foldername(name))[1]
    and has_read_access(d.origin_org_unit_id, d.current_org_unit_id)
  )
);

create policy document_attachments_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'document-attachments'
  and exists (
    select 1 from documents d
    where d.id::text = (storage.foldername(name))[1]
    and has_write_access(d.current_org_unit_id)
  )
);
