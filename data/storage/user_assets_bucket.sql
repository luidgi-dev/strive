-- user-assets bucket
-- holds user-uploaded media (avatars, future: ritual covers, etc.)
-- public read, scoped writes
--
-- path convention: avatars/{user.id}/{filename}
-- the user.id folder layer is enforced by rls so users can only write inside their own folder

insert into storage.buckets (id, name, public)
values ('user-assets', 'user-assets', true)
on conflict (id) do nothing;

-- rls is already enabled on storage.objects by supabase

drop policy if exists "user-assets: avatars are publicly readable" on storage.objects;
create policy "user-assets: avatars are publicly readable"
    on storage.objects for select
    to public
    using (bucket_id = 'user-assets');

drop policy if exists "user-assets: users can upload to own avatar folder" on storage.objects;
create policy "user-assets: users can upload to own avatar folder"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'user-assets'
        and (storage.foldername(name))[1] = 'avatars'
        and (storage.foldername(name))[2] = auth.uid()::text
    );

drop policy if exists "user-assets: users can update own avatar files" on storage.objects;
create policy "user-assets: users can update own avatar files"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'user-assets'
        and (storage.foldername(name))[1] = 'avatars'
        and (storage.foldername(name))[2] = auth.uid()::text
    )
    with check (
        bucket_id = 'user-assets'
        and (storage.foldername(name))[1] = 'avatars'
        and (storage.foldername(name))[2] = auth.uid()::text
    );

drop policy if exists "user-assets: users can delete own avatar files" on storage.objects;
create policy "user-assets: users can delete own avatar files"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'user-assets'
        and (storage.foldername(name))[1] = 'avatars'
        and (storage.foldername(name))[2] = auth.uid()::text
    );
