-- ============================================================
-- MINHA ROTINA - Storage bucket + RLS para foto de perfil
-- Execute no Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1) Garante o bucket de fotos de perfil.
-- Public = false porque o aapp usa signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'parent-photos',
  'parent-photos',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Remove policies antigas (se existirem) para evitar conflito de regras.
drop policy if exists "Parent photos public read" on storage.objects;
drop policy if exists "Parent photos select own object" on storage.objects;
drop policy if exists "Parent photos insert own object" on storage.objects;
drop policy if exists "Parent photos update own object" on storage.objects;
drop policy if exists "Parent photos delete own object" on storage.objects;

-- 3) SELECT: necessario para criar signed URL do proprio arquivo.
create policy "Parent photos select own object"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'parent-photos'
    and storage.objects.name = (auth.uid()::text || '.jpg')
  );

-- 4) INSERT: usuario autenticado so pode criar seu proprio arquivo.
-- Nome esperado no app: {auth.uid()}.jpg
create policy "Parent photos insert own object"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'parent-photos'
    and storage.objects.name = (auth.uid()::text || '.jpg')
  );

-- 5) UPDATE (necessario para upsert=true): somente no proprio arquivo.
create policy "Parent photos update own object"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'parent-photos'
    and storage.objects.name = (auth.uid()::text || '.jpg')
  )
  with check (
    bucket_id = 'parent-photos'
    and storage.objects.name = (auth.uid()::text || '.jpg')
  );

-- 6) DELETE opcional, mas seguro para limpeza do proprio arquivo.
create policy "Parent photos delete own object"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'parent-photos'
    and storage.objects.name = (auth.uid()::text || '.jpg')
  );

-- 7) Validacao rapida apos aplicar:
-- select id, name, public from storage.buckets where id = 'parent-photos';
-- select policyname, cmd, roles from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
-- and policyname ilike 'Parent photos%';
