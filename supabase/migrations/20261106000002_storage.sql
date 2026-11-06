-- Private bucket for slips, signed agreements and local orders.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-docs', 'private-docs', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;

-- Admins can do everything in the bucket.
create policy private_docs_admin on storage.objects for all to authenticated
  using (bucket_id = 'private-docs' and public.is_admin())
  with check (bucket_id = 'private-docs' and public.is_admin());

-- Guests holding a valid registration link may upload a slip into
-- slips/<form_token>/<file>. They can never read or list files.
create policy private_docs_guest_slip on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'private-docs'
    and (storage.foldername(name))[1] = 'slips'
    and public.token_is_open((storage.foldername(name))[2])
  );
