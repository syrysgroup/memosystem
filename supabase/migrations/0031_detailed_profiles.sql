-- Profiles were minimal (name, email, admin flags, leave status) -- no way
-- to see a staff member's contact details, background, or photo anywhere
-- in the app. Adds the descriptive fields a real institutional directory
-- needs. These are independent of is_admin/is_org_admin/is_security_admin/
-- is_active (locked to bootstrap-admin-only by the trigger in 0027) --
-- ordinary self-service or line-manager edits, governed by the existing
-- profiles_update policy (id = auth.uid() OR oversees_profile(id)), no
-- RLS changes needed for them.

alter table profiles add column phone_number text;
alter table profiles add column nationality text;
alter table profiles add column bio text;
alter table profiles add column date_of_appointment date;
alter table profiles add column avatar_path text;

-- Profile photos: readable by any authenticated user (matches
-- profiles_select = true, since the whole point is an institution-wide
-- directory), writable only by the profile's own owner or whoever
-- oversees them (matches profiles_update exactly). Storage path convention
-- mirrors document-attachments: "<profile_id>/<filename>".
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', false)
on conflict (id) do nothing;

create policy profile_photos_storage_select on storage.objects
  for select using (bucket_id = 'profile-photos');

create policy profile_photos_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or oversees_profile(((storage.foldername(name))[1])::uuid)
    )
  );

create policy profile_photos_storage_update on storage.objects
  for update using (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or oversees_profile(((storage.foldername(name))[1])::uuid)
    )
  );

create policy profile_photos_storage_delete on storage.objects
  for delete using (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or oversees_profile(((storage.foldername(name))[1])::uuid)
    )
  );
