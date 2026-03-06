-- ============================================================
-- MINHA ROTINA - Exclusao de conta pelo proprio usuario
-- Execute no Supabase SQL Editor
-- ============================================================

-- Esta funcao remove dados da conta autenticada (parent + dados dependentes)
-- e tenta remover tambem o usuario em auth.users.
-- Requer criacao com owner privilegiado (padrao no SQL Editor do Supabase).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Remove dados de negocio; FKs com ON DELETE CASCADE fazem limpeza de rotinas/tarefas/progresso.
  delete from public.parent_accounts
  where id = v_uid;

  -- Remove credencial de autenticacao.
  delete from auth.users
  where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- Validacao rapida:
-- select proname, prosecdef
-- from pg_proc
-- where proname = 'delete_my_account';
