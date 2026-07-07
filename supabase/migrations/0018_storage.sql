-- Private bucket for scans/acknowledgments/decision-stamp records. Objects
-- live at "<document_id>/<filename>"; access mirrors document chain access.
insert into storage.buckets (id, name, public)
values ('document-attachments', 'document-attachments', false)
on conflict (id) do nothing;

create policy document_attachments_storage_select on storage.objects for select to authenticated using (
  bucket_id = 'document-attachments'
  and exists (
    select 1 from documents d
    where d.id::text = (storage.foldername(name))[1]
    and has_document_chain_access(d.id)
  )
);

create policy document_attachments_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'document-attachments'
  and exists (
    select 1 from documents d
    where d.id::text = (storage.foldername(name))[1]
    and has_document_chain_access(d.id)
  )
);
