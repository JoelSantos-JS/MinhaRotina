-- ============================================================
-- MINHA ROTINA - Sugestoes de pais (ideias e melhorias)
-- Execute no Supabase Dashboard -> SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.parent_suggestions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parent_accounts(id) on delete cascade,
  category text not null check (char_length(category) between 3 and 80),
  title text not null check (char_length(title) between 4 and 120),
  message text not null check (char_length(message) between 20 and 2000),
  status text not null default 'new' check (status in ('new', 'reviewed', 'planned', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists parent_suggestions_parent_id_idx
  on public.parent_suggestions(parent_id);

create index if not exists parent_suggestions_created_at_idx
  on public.parent_suggestions(created_at desc);

alter table public.parent_suggestions enable row level security;

drop policy if exists "Parent suggestions insert own" on public.parent_suggestions;
drop policy if exists "Parent suggestions select own" on public.parent_suggestions;

create policy "Parent suggestions insert own"
  on public.parent_suggestions
  for insert
  to authenticated
  with check (parent_id = auth.uid());

create policy "Parent suggestions select own"
  on public.parent_suggestions
  for select
  to authenticated
  using (parent_id = auth.uid());

-- Validacao rapida:
-- select count(*) from public.parent_suggestions;
-- select policyname, cmd, roles
-- from pg_policies
-- where schemaname='public' and tablename='parent_suggestions';

