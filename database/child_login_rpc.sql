-- ============================================================
-- MINHA ROTINA - RPCs seguras para login infantil por email + PIN
-- Execute no Supabase Dashboard -> SQL Editor
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- 1) Lookup auxiliar de parent (uso interno/autenticado).
create or replace function public.get_parent_for_child_login(p_email text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select to_jsonb(p)
  from (
    select id, name
    from public.parent_accounts
    where lower(email) = lower(trim(p_email))
    limit 1
  ) p;
$$;

revoke all on function public.get_parent_for_child_login(text) from public;
grant execute on function public.get_parent_for_child_login(text) to authenticated;

-- 2) Login infantil direto por email + PIN (anti-enumeracao de email).
--    Retorna null para qualquer combinacao invalida.
create or replace function public.authenticate_child_login(
  p_email text,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_parent_id uuid;
  v_child_id uuid;
  v_matches integer;
  v_child jsonb;
begin
  if coalesce(trim(p_email), '') = '' or p_pin is null or p_pin !~ '^[0-9]{4}$' then
    return null;
  end if;

  select p.id
    into v_parent_id
  from public.parent_accounts p
  where lower(p.email) = lower(trim(p_email))
  limit 1;

  if v_parent_id is null then
    return null;
  end if;

  select count(*), min(c.id::text)::uuid
    into v_matches, v_child_id
  from public.child_accounts c
  where c.created_by = v_parent_id
    and (
      (
        c.pin_hash like '$2%'
        and crypt(p_pin, c.pin_hash) = c.pin_hash
      )
      or
      (
        c.pin_hash ~ '^[0-9a-f]{64}$'
        and encode(digest(p_pin || 'minharotina_salt_2024', 'sha256'), 'hex') = c.pin_hash
      )
    );

  if v_matches <> 1 then
    return null;
  end if;

  -- Auto-upgrade transparente do hash legado para bcrypt no primeiro login valido.
  update public.child_accounts
  set pin_hash = crypt(p_pin, gen_salt('bf', 10))
  where id = v_child_id
    and pin_hash ~ '^[0-9a-f]{64}$';

  update public.child_accounts
  set last_login_at = now()
  where id = v_child_id;

  select to_jsonb(c) - 'pin_hash' - 'access_pin'
    into v_child
  from public.child_accounts c
  where c.id = v_child_id;

  return v_child;
end;
$$;

revoke all on function public.authenticate_child_login(text, text) from public;
grant execute on function public.authenticate_child_login(text, text) to anon, authenticated;

-- 3) Hash forte no backend para novos PINs (bcrypt).
create or replace function public.hash_pin_secure(p_pin text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_pin is null or p_pin !~ '^[0-9]{4}$' then
    raise exception 'Invalid PIN format';
  end if;

  return crypt(p_pin, gen_salt('bf', 10));
end;
$$;

revoke all on function public.hash_pin_secure(text) from public;
grant execute on function public.hash_pin_secure(text) to authenticated;

-- 4) Verifica duplicidade de PIN entre irmaos sem expor hash para o app.
create or replace function public.is_sibling_pin_in_use(
  p_parent_id uuid,
  p_pin text,
  p_exclude_child_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_parent_id is null or p_pin is null or p_pin !~ '^[0-9]{4}$' then
    return false;
  end if;

  return exists (
    select 1
    from public.child_accounts c
    where c.created_by = p_parent_id
      and (p_exclude_child_id is null or c.id <> p_exclude_child_id)
      and (
        (
          c.pin_hash like '$2%'
          and crypt(p_pin, c.pin_hash) = c.pin_hash
        )
        or
        (
          c.pin_hash ~ '^[0-9a-f]{64}$'
          and encode(digest(p_pin || 'minharotina_salt_2024', 'sha256'), 'hex') = c.pin_hash
        )
      )
  );
end;
$$;

revoke all on function public.is_sibling_pin_in_use(uuid, text, uuid) from public;
grant execute on function public.is_sibling_pin_in_use(uuid, text, uuid) to authenticated;

-- 5) Valida PIN do filho por parent_id (usado no modo autenticado do responsavel).
create or replace function public.authenticate_child_pin(
  p_parent_id uuid,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_child_id uuid;
  v_matches integer;
  v_child jsonb;
begin
  if p_parent_id is null or p_pin is null or p_pin !~ '^[0-9]{4}$' then
    return null;
  end if;

  select count(*), min(c.id::text)::uuid
    into v_matches, v_child_id
  from public.child_accounts c
  where c.created_by = p_parent_id
    and (
      (
        c.pin_hash like '$2%'
        and crypt(p_pin, c.pin_hash) = c.pin_hash
      )
      or
      (
        c.pin_hash ~ '^[0-9a-f]{64}$'
        and encode(digest(p_pin || 'minharotina_salt_2024', 'sha256'), 'hex') = c.pin_hash
      )
    );

  if v_matches = 0 then
    return null;
  end if;

  if v_matches > 1 then
    raise exception 'Duplicate PIN for this family';
  end if;

  -- Auto-upgrade transparente do hash legado para bcrypt no primeiro login valido.
  update public.child_accounts
  set pin_hash = crypt(p_pin, gen_salt('bf', 10))
  where id = v_child_id
    and pin_hash ~ '^[0-9a-f]{64}$';

  update public.child_accounts
  set last_login_at = now()
  where id = v_child_id;

  select to_jsonb(c) - 'pin_hash' - 'access_pin'
    into v_child
  from public.child_accounts c
  where c.id = v_child_id;

  return v_child;
end;
$$;

revoke all on function public.authenticate_child_pin(uuid, text) from public;
grant execute on function public.authenticate_child_pin(uuid, text) to authenticated;

-- Validacao rapida:
-- select public.get_parent_for_child_login('email@exemplo.com');
-- select public.authenticate_child_login('email@exemplo.com', '1234');
-- select public.hash_pin_secure('1234');
-- select public.is_sibling_pin_in_use('00000000-0000-0000-0000-000000000000', '1234', null);
-- select public.authenticate_child_pin('00000000-0000-0000-0000-000000000000', '1234');
