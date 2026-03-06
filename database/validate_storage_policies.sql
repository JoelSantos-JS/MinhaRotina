-- ============================================================
-- MINHA ROTINA - Validacao rapida de Storage + RLS (read-only)
-- Execute no Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1) Buckets esperados
-- Esperado: public = false em todos (uso via signed URL).
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('parent-photos', 'task-photos', 'task-videos')
order by id;

-- Buckets com configuracao incorreta de visibilidade (nao deveria retornar linhas)
select id, public
from storage.buckets
where id in ('parent-photos', 'task-photos', 'task-videos')
  and public is distinct from false;

-- 2) Policies esperadas em storage.objects
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    policyname ilike 'Parent photos%'
    or policyname ilike 'Task photos%'
    or policyname ilike 'Task videos%'
  )
order by policyname, cmd;

-- 3) Objetos fora do padrao esperado (diagnostico)
-- parent-photos deve usar: {auth.uid()}.jpg
select id, name, created_at, owner
from storage.objects
where bucket_id = 'parent-photos'
  and name !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$'
order by created_at desc;

-- task-photos/task-videos devem usar: {taskId}.jpg|mp4
select id, bucket_id, name, created_at, owner
from storage.objects
where bucket_id in ('task-photos', 'task-videos')
  and (
    (bucket_id = 'task-photos' and name !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$')
    or
    (bucket_id = 'task-videos' and name !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.mp4$')
  )
order by created_at desc;
