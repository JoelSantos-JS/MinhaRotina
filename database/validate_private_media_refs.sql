-- ============================================================
-- MINHA ROTINA - Validacao de referencias privadas de midia
-- Read-only. Execute no Supabase SQL Editor.
-- ============================================================

-- 1) Perfil de parent: esperado null OU storage://parent-photos/{uid}.jpg
select
  id as parent_id,
  photo_url
from public.parent_accounts
where photo_url is not null
  and photo_url not like 'storage://parent-photos/%'
order by updated_at desc;

-- 2) Foto de task: esperado null OU storage://task-photos/{taskId}.jpg
select
  id as task_id,
  photo_url
from public.tasks
where photo_url is not null
  and photo_url not like 'storage://task-photos/%'
order by updated_at desc;

-- 3) Video de task: aceitamos:
--    - storage://task-videos/{taskId}.mp4 (upload interno)
--    - URL externa (http/https), ex: YouTube
select
  id as task_id,
  video_url
from public.tasks
where video_url is not null
  and video_url not like 'storage://task-videos/%'
  and video_url !~* '^https?://'
order by updated_at desc;

-- 4) Resumo rapido de distribuicao
select
  count(*) filter (where photo_url like 'storage://parent-photos/%') as parent_photo_storage_refs,
  count(*) filter (where photo_url is null) as parent_photo_nulls
from public.parent_accounts;

select
  count(*) filter (where photo_url like 'storage://task-photos/%') as task_photo_storage_refs,
  count(*) filter (where photo_url is null) as task_photo_nulls,
  count(*) filter (where video_url like 'storage://task-videos/%') as task_video_storage_refs,
  count(*) filter (where video_url ~* '^https?://') as task_video_external_urls,
  count(*) filter (where video_url is null) as task_video_nulls
from public.tasks;
