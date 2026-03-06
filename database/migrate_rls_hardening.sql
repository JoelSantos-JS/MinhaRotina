-- ============================================================
-- MINHA ROTINA - Hardening de RLS (remove policies permissivas)
-- Execute no Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1) child_accounts: remove leitura publica antiga de login por PIN.
alter table if exists public.child_accounts enable row level security;
drop policy if exists "Leitura publica para login por PIN" on public.child_accounts;

-- 2) task_progress: restringe acesso aos filhos do parent autenticado.
alter table if exists public.task_progress enable row level security;
drop policy if exists "Acesso ao progresso das tarefas" on public.task_progress;
create policy "Acesso ao progresso das tarefas"
  on public.task_progress
  for all
  using (
    exists (
      select 1
      from public.child_accounts c
      where c.id = task_progress.child_id
        and c.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.child_accounts c
      where c.id = task_progress.child_id
        and c.created_by = auth.uid()
    )
  );

-- 3) task_skips: aplica o mesmo escopo (somente filhos do parent autenticado).
do $$
begin
  if to_regclass('public.task_skips') is not null then
    execute 'alter table public.task_skips enable row level security';
    execute 'drop policy if exists "Acesso aos skips das tarefas" on public.task_skips';
    execute $policy$
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
        )
    $policy$;
  end if;
end $$;

-- Validacao rapida:
-- select policyname, tablename, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('child_accounts', 'task_progress', 'task_skips')
-- order by tablename, policyname, cmd;
