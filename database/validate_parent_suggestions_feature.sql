-- ============================================================
-- MINHA ROTINA - Validacao feature de sugestoes de pais (read-only)
-- ============================================================

select
  exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'parent_suggestions'
  ) as has_parent_suggestions_table,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'parent_suggestions'
      and column_name = 'message'
  ) as has_message_column,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_suggestions'
      and policyname = 'Parent suggestions insert own'
  ) as has_insert_policy;

select
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename = 'parent_suggestions'
order by policyname, cmd;

