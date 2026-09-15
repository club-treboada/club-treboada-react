-- =============================================================================
-- Club Treboada - Storage bucket for Open event posters
-- =============================================================================
-- Run after 021_events.sql. Creates public bucket `event-images` and RLS on
-- storage.objects so anyone can read; only admin/coach can write.

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do update set public = excluded.public;

-- Policies on storage.objects
drop policy if exists "event_images_select_public" on storage.objects;
create policy "event_images_select_public"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'event-images');

drop policy if exists "event_images_insert_staff" on storage.objects;
create policy "event_images_insert_staff"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and public.user_role() in ('admin', 'coach')
  );

drop policy if exists "event_images_update_staff" on storage.objects;
create policy "event_images_update_staff"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'event-images'
    and public.user_role() in ('admin', 'coach')
  )
  with check (
    bucket_id = 'event-images'
    and public.user_role() in ('admin', 'coach')
  );

drop policy if exists "event_images_delete_staff" on storage.objects;
create policy "event_images_delete_staff"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and public.user_role() in ('admin', 'coach')
  );
