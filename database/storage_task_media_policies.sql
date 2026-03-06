-- ============================================================
-- MINHA ROTINA - Storage buckets + RLS para midia de tarefas
-- Execute no Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1) Buckets usados pelas tarefas.
-- Public = false porque o app usa signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'task-photos',
    'task-photos',
    false,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'task-videos',
    'task-videos',
    false,
    52428800, -- 50 MB
    array['video/mp4', 'video/quicktime', 'video/webm']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Remove policies antigas (somente as deste script) para evitar conflito.
drop policy if exists "Task photos public read" on storage.objects;
drop policy if exists "Task photos select own family task" on storage.objects;
drop policy if exists "Task photos insert own family task" on storage.objects;
drop policy if exists "Task photos update own family task" on storage.objects;
drop policy if exists "Task photos delete own family task" on storage.objects;

drop policy if exists "Task videos public read" on storage.objects;
drop policy if exists "Task videos select own family task" on storage.objects;
drop policy if exists "Task videos insert own family task" on storage.objects;
drop policy if exists "Task videos update own family task" on storage.objects;
drop policy if exists "Task videos delete own family task" on storage.objects;

-- 3) SELECT necessario para criar signed URL dos arquivos da propria familia.
create policy "Task photos select own family task"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'task-photos'
    and split_part(storage.objects.name, '.', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.tasks t
      join public.routines r on r.id = t.routine_id
      join public.child_accounts c on c.id = r.child_id
      where t.id = split_part(storage.objects.name, '.', 1)::uuid
        and c.created_by = auth.uid()
    )
  );

create policy "Task videos select own family task"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'task-videos'
    and split_part(storage.objects.name, '.', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.tasks t
      join public.routines r on r.id = t.routine_id
      join public.child_accounts c on c.id = r.child_id
      where t.id = split_part(storage.objects.name, '.', 1)::uuid
        and c.created_by = auth.uid()
    )
  );

-- Regex UUID v1-v5 para evitar cast invalido em split_part(name, '.', 1)::uuid
-- (formato esperado no app: {taskId}.jpg / {taskId}.mp4)

-- 4) INSERT em task-photos: somente dono da familia da tarefa.
create policy "Task photos insert own family task"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'task-photos'
    and split_part(storage.objects.name, '.', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.tasks t
      join public.routines r on r.id = t.routine_id
      join public.child_accounts c on c.id = r.child_id
      where t.id = split_part(storage.objects.name, '.', 1)::uuid
        and c.created_by = auth.uid()
    )
  );

-- 5) UPDATE em task-photos (necessario para upsert=true).
create policy "Task photos update own family task"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'task-photos'
    and split_part(storage.objects.name, '.', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.tasks t
      join public.routines r on r.id = t.routine_id
      join public.child_accounts c on c.id = r.child_id
      where t.id = split_part(storage.objects.name, '.', 1)::uuid
        and c.created_by = auth.uid()
    )
  )
  with check (
    bucket_id = 'task-photos'
    and split_part(storage.objects.name, '.', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.tasks t
      join public.routines r on r.id = t.routine_id
      join public.child_accounts c on c.id = r.child_id
      where t.id = split_part(storage.objects.name, '.', 1)::uuid
        and c.created_by = auth.uid()
    )
  );

create policy "Task photos delete own family task"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'task-photos'
    and split_part(storage.objects.name, '.', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.tasks t
      join public.routines r on r.id = t.routine_id
      join public.child_accounts c on c.id = r.child_id
      where t.id = split_part(storage.objects.name, '.', 1)::uuid
        and c.created_by = auth.uid()
    )
  );

-- 6) Mesmo controle para task-videos.
create policy "Task videos insert own family task"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'task-videos'
    and split_part(storage.objects.name, '.', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.tasks t
      join public.routines r on r.id = t.routine_id
      join public.child_accounts c on c.id = r.child_id
      where t.id = split_part(storage.objects.name, '.', 1)::uuid
        and c.created_by = auth.uid()
    )
  );

create policy "Task videos update own family task"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'task-videos'
    and split_part(storage.objects.name, '.', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.tasks t
      join public.routines r on r.id = t.routine_id
      join public.child_accounts c on c.id = r.child_id
      where t.id = split_part(storage.objects.name, '.', 1)::uuid
        and c.created_by = auth.uid()
    )
  )
  with check (
    bucket_id = 'task-videos'
    and split_part(storage.objects.name, '.', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.tasks t
      join public.routines r on r.id = t.routine_id
      join public.child_accounts c on c.id = r.child_id
      where t.id = split_part(storage.objects.name, '.', 1)::uuid
        and c.created_by = auth.uid()
    )
  );

create policy "Task videos delete own family task"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'task-videos'
    and split_part(storage.objects.name, '.', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.tasks t
      join public.routines r on r.id = t.routine_id
      join public.child_accounts c on c.id = r.child_id
      where t.id = split_part(storage.objects.name, '.', 1)::uuid
        and c.created_by = auth.uid()
    )
  );

-- 7) Validacao rapida apos aplicar:
-- select id, name, public, file_size_limit
-- from storage.buckets
-- where id in ('task-photos', 'task-videos');
--
-- select policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'storage'
--   and tablename = 'objects'
--   and (
--     policyname ilike 'Task photos%'
--     or policyname ilike 'Task videos%'
--   )
-- order by policyname, cmd;
