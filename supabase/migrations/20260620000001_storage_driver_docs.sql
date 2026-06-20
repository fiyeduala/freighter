-- Storage bucket for driver documents
insert into storage.buckets (id, name, public)
values ('driver-documents', 'driver-documents', false)
on conflict (id) do nothing;

create policy "drivers_upload_own_docs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'driver-documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "drivers_read_own_docs"
on storage.objects for select to authenticated
using (
  bucket_id = 'driver-documents'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
);

create policy "admins_delete_driver_docs"
on storage.objects for delete to authenticated
using (bucket_id = 'driver-documents' and public.is_admin());
