-- ============================================================
-- MINHA ROTINA - Pin constraints (incremental migration)
-- Execute no Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1) Enforce 4-digit access PIN format
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'child_accounts_access_pin_4_digits'
    ) THEN
        ALTER TABLE child_accounts
        ADD CONSTRAINT child_accounts_access_pin_4_digits
        CHECK (access_pin ~ '^[0-9]{4}$');
    END IF;
END $$;

-- 2) Ensure PIN uniqueness only inside the same family (same parent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_child_parent_pin_hash_unique
    ON child_accounts(created_by, pin_hash)
    WHERE created_by IS NOT NULL;

