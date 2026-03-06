-- ============================================================
-- MINHA ROTINA - Alinhamento de schema com funcionalidades atuais
-- Seguro para reexecucao (usa IF NOT EXISTS / DROP IF EXISTS)
-- Execute no Supabase Dashboard -> SQL Editor
-- ============================================================

-- 0) Extensao UUID (necessaria para defaults em novas tabelas)
create extension if not exists "uuid-ossp";

-- 1) child_accounts: suporte visual usado no app
alter table if exists public.child_accounts
  add column if not exists visual_support_type varchar(20);

-- Restricao de valores validos (recriada para manter idempotencia)
alter table if exists public.child_accounts
  drop constraint if exists child_accounts_visual_support_type_check;

alter table if exists public.child_accounts
  add constraint child_accounts_visual_support_type_check
  check (
    visual_support_type in ('images_text', 'reduced_text', 'images_only')
    or visual_support_type is null
  );

-- 2) tasks: colunas que o app usa em criacao/edicao/execucao
alter table if exists public.tasks
  add column if not exists photo_url varchar(500);

alter table if exists public.tasks
  add column if not exists description text;

alter table if exists public.tasks
  add column if not exists video_url varchar(500);

alter table if exists public.tasks
  add column if not exists steps jsonb;

alter table if exists public.tasks
  add column if not exists routines_config jsonb;

-- O app usa a categoria "food" alem das ja existentes
alter table if exists public.tasks
  drop constraint if exists tasks_sensory_category_check;

alter table if exists public.tasks
  add constraint tasks_sensory_category_check
  check (
    sensory_category in ('teeth', 'bath', 'bathroom', 'clothes', 'hair', 'food')
    or sensory_category is null
  );

-- 3) task_progress: notas editaveis no Diario
alter table if exists public.task_progress
  add column if not exists note text;

-- 4) task_skips: eventos de pulo de tarefa (skip_now / try_later)
create table if not exists public.task_skips (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references public.child_accounts(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  reason varchar(20) not null check (reason in ('skip_now', 'try_later')),
  skipped_at timestamp with time zone default now(),
  note text
);

create index if not exists idx_task_skips_child on public.task_skips(child_id);
create index if not exists idx_task_skips_date on public.task_skips(skipped_at);

-- 5) RLS + policy para task_skips (escopo: apenas filhos do parent autenticado)
alter table if exists public.task_skips enable row level security;

drop policy if exists "Acesso aos skips das tarefas" on public.task_skips;
create policy "Acesso aos skips das tarefas"
  on public.task_skips
  for all
  using (
    exists (
      select 1
      from public.child_accounts c
      where c.id = task_skips.child_id
        and c.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.child_accounts c
      where c.id = task_skips.child_id
        and c.created_by = auth.uid()
    )
  );

-- 6) Validacao rapida
-- select column_name from information_schema.columns
-- where table_schema='public' and table_name='tasks'
--   and column_name in ('photo_url','description','video_url','steps','routines_config');
--
-- select column_name from information_schema.columns
-- where table_schema='public' and table_name='task_progress' and column_name='note';
--
-- select table_name from information_schema.tables
-- where table_schema='public' and table_name='task_skips';

