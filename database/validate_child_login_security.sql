-- ============================================================
-- MINHA ROTINA - Validacao de seguranca do login infantil
-- Read-only. Execute no Supabase SQL Editor.
-- ============================================================

-- 1) SECURITY DEFINER esperado em todas as funcoes abaixo.
select
  p.proname as function_name,
  p.prosecdef as is_security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_parent_for_child_login',
    'authenticate_child_login',
    'authenticate_child_pin',
    'hash_pin_secure',
    'is_sibling_pin_in_use'
  )
order by p.proname;

-- 2) Grants de EXECUTE via information_schema (mais facil de conferir manualmente)
select
  routine_name,
  grantee,
  privilege_type
from information_schema.role_routine_grants
where routine_schema = 'public'
  and routine_name in (
    'get_parent_for_child_login',
    'authenticate_child_login',
    'authenticate_child_pin',
    'hash_pin_secure',
    'is_sibling_pin_in_use'
  )
order by routine_name, grantee;

-- 3) Checks objetivos (deve retornar true)
select
  exists (
    select 1
    from pg_extension e
    where e.extname = 'pgcrypto'
  ) as has_pgcrypto_extension,
  exists (
    select 1
    from information_schema.role_routine_grants g
    where g.routine_schema = 'public'
      and g.routine_name = 'authenticate_child_login'
      and g.grantee = 'anon'
      and g.privilege_type = 'EXECUTE'
  ) as anon_can_execute_authenticate_child_login,
  exists (
    select 1
    from information_schema.routines r
    where r.routine_schema = 'public'
      and r.routine_name = 'authenticate_child_login'
      and r.security_type = 'DEFINER'
  ) as authenticate_child_login_is_security_definer;
