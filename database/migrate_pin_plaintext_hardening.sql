-- ============================================================
-- MINHA ROTINA - Hardening de PIN (remove dependencia de access_pin)
-- Execute no Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1) Permite access_pin nulo para nao persistir PIN em texto puro.
alter table if exists public.child_accounts
  alter column access_pin drop not null;

-- 2) Limpa PINs antigos armazenados em texto puro.
update public.child_accounts
set access_pin = null
where access_pin is not null;

-- Validacao rapida:
-- select count(*) as plain_pins_restantes
-- from public.child_accounts
-- where access_pin is not null;
