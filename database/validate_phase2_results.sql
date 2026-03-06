-- ============================================================
-- MINHA ROTINA - Validacao de resultados da bateria Fase 2
-- Read-only. Ajuste o email no CTE "params" antes de executar.
-- ============================================================

-- Pre-check de schema (deve retornar "true" em todos os itens)
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'child_accounts' and column_name = 'visual_support_type'
  ) as has_child_visual_support_type,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'photo_url'
  ) as has_tasks_photo_url,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'description'
  ) as has_tasks_description,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'video_url'
  ) as has_tasks_video_url,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'steps'
  ) as has_tasks_steps,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'routines_config'
  ) as has_tasks_routines_config,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'task_progress' and column_name = 'note'
  ) as has_task_progress_note,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'task_skips'
  ) as has_task_skips_table;

with params as (
  select
    'SEU_EMAIL_AQUI'::text as parent_email,
    current_date::date as ref_date
),
parent_ctx as (
  select p.id as parent_id
  from public.parent_accounts p
  join params x on x.parent_email = p.email
),
children_ctx as (
  select c.*
  from public.child_accounts c
  join parent_ctx p on p.parent_id = c.created_by
)
select
  c.id as child_id,
  c.name as child_name,
  c.last_login_at,
  c.updated_at
from children_ctx c
order by c.created_at desc;

-- Rotinas por filho
with params as (
  select 'SEU_EMAIL_AQUI'::text as parent_email
),
parent_ctx as (
  select id as parent_id
  from public.parent_accounts
  where email = (select parent_email from params)
),
children_ctx as (
  select c.id as child_id, c.name as child_name
  from public.child_accounts c
  join parent_ctx p on p.parent_id = c.created_by
)
select
  cc.child_name,
  r.id as routine_id,
  r.name as routine_name,
  r.type,
  r.is_active,
  r.updated_at
from children_ctx cc
left join public.routines r on r.child_id = cc.child_id
order by cc.child_name, r.created_at;

-- Tarefas por rotina (com flags de midia e conteudo)
with params as (
  select 'SEU_EMAIL_AQUI'::text as parent_email
),
parent_ctx as (
  select id as parent_id
  from public.parent_accounts
  where email = (select parent_email from params)
)
select
  c.name as child_name,
  r.name as routine_name,
  t.id as task_id,
  t.name as task_name,
  t.order_index,
  (
    (j.task_json ? 'photo_url')
    and nullif(j.task_json->>'photo_url', '') is not null
  ) as has_photo,
  (
    (j.task_json ? 'video_url')
    and nullif(j.task_json->>'video_url', '') is not null
  ) as has_video,
  (
    (j.task_json ? 'description')
    and nullif(j.task_json->>'description', '') is not null
  ) as has_description,
  (
    (j.task_json ? 'steps')
    and j.task_json->'steps' <> 'null'::jsonb
  ) as has_steps
from public.tasks t
join public.routines r on r.id = t.routine_id
join public.child_accounts c on c.id = r.child_id
join parent_ctx p on p.parent_id = c.created_by
cross join lateral (select to_jsonb(t) as task_json) j
order by c.name, r.name, t.order_index;

-- Eventos de hoje (progress + skips)
with params as (
  select
    'SEU_EMAIL_AQUI'::text as parent_email,
    current_date::date as ref_date
),
parent_ctx as (
  select id as parent_id
  from public.parent_accounts
  where email = (select parent_email from params)
)
select
  'progress' as event_type,
  c.name as child_name,
  r.name as routine_name,
  t.name as task_name,
  p.completed_at as event_at,
  p.note
from public.task_progress p
join public.child_accounts c on c.id = p.child_id
left join public.routines r on r.id = p.routine_id
left join public.tasks t on t.id = p.task_id
join parent_ctx x on x.parent_id = c.created_by
join params q on true
where p.completed_at::date = q.ref_date

union all

select
  'skip' as event_type,
  c.name as child_name,
  r.name as routine_name,
  t.name as task_name,
  s.skipped_at as event_at,
  s.note
from public.task_skips s
join public.child_accounts c on c.id = s.child_id
left join public.routines r on r.id = s.routine_id
left join public.tasks t on t.id = s.task_id
join parent_ctx x on x.parent_id = c.created_by
join params q on true
where s.skipped_at::date = q.ref_date
order by event_at desc;

-- Sanidade: eventos orfaos (nao deveria retornar linhas)
select
  p.id,
  p.child_id,
  p.routine_id,
  p.task_id,
  p.completed_at
from public.task_progress p
left join public.child_accounts c on c.id = p.child_id
left join public.routines r on r.id = p.routine_id
left join public.tasks t on t.id = p.task_id
where c.id is null
   or r.id is null
   or (p.task_id is not null and t.id is null)
order by p.completed_at desc
limit 50;
