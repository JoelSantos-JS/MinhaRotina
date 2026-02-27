-- ============================================================
-- MINHA ROTINA - Schema do Banco de Dados (Supabase PostgreSQL)
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: parent_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    photo_url VARCHAR(500),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    max_children INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_parent_email ON parent_accounts(email);

-- ============================================================
-- TABELA: child_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS child_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 1 AND age <= 18),
    photo_url VARCHAR(500),
    access_pin VARCHAR(4) NOT NULL CHECK (access_pin ~ '^[0-9]{4}$'),
    pin_hash VARCHAR(255) NOT NULL,
    qr_code_hash VARCHAR(255) UNIQUE,
    color_theme VARCHAR(7) DEFAULT '#88CAFC',
    icon_emoji VARCHAR(10) DEFAULT '🌸',
    sensory_profile JSONB,
    notes TEXT,
    created_by UUID REFERENCES parent_accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_child_created_by ON child_accounts(created_by);
CREATE INDEX IF NOT EXISTS idx_child_pin_hash ON child_accounts(pin_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_child_parent_pin_hash_unique
    ON child_accounts(created_by, pin_hash)
    WHERE created_by IS NOT NULL;

-- ============================================================
-- TABELA: routines
-- ============================================================
CREATE TABLE IF NOT EXISTS routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID REFERENCES child_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('morning', 'afternoon', 'night', 'custom')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routine_child ON routines(child_id);

-- ============================================================
-- TABELA: tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon_emoji VARCHAR(10) NOT NULL,
    order_index INTEGER NOT NULL,
    estimated_minutes INTEGER DEFAULT 5,
    has_sensory_issues BOOLEAN DEFAULT FALSE,
    sensory_category VARCHAR(50) CHECK (
        sensory_category IN ('teeth', 'bath', 'bathroom', 'clothes', 'hair') OR
        sensory_category IS NULL
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_routine ON tasks(routine_id);
CREATE INDEX IF NOT EXISTS idx_task_order ON tasks(routine_id, order_index);

-- ============================================================
-- TABELA: task_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS task_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID REFERENCES child_accounts(id) ON DELETE CASCADE,
    routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date DATE DEFAULT CURRENT_DATE,
    took_minutes INTEGER,
    mood VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_progress_child ON task_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_progress_date ON task_progress(completion_date);

-- ============================================================
-- TABELA: educational_strategies
-- ============================================================
CREATE TABLE IF NOT EXISTS educational_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    problem_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    tips JSONB,
    video_url VARCHAR(500),
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_category ON educational_strategies(category);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE parent_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_strategies ENABLE ROW LEVEL SECURITY;

-- Políticas para parent_accounts
CREATE POLICY "Pais veem apenas sua conta"
    ON parent_accounts FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Pais atualizam apenas sua conta"
    ON parent_accounts FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Pais inserem sua conta"
    ON parent_accounts FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Políticas para child_accounts
CREATE POLICY "Pais veem filhos que criaram"
    ON child_accounts FOR SELECT
    USING (created_by = auth.uid());

CREATE POLICY "Pais inserem filhos"
    ON child_accounts FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Pais atualizam seus filhos"
    ON child_accounts FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Pais deletam seus filhos"
    ON child_accounts FOR DELETE
    USING (created_by = auth.uid());

-- IMPORTANTE: Política para login de filhos por PIN
-- (precisa ler todos para verificar o hash)
CREATE POLICY "Leitura publica para login por PIN"
    ON child_accounts FOR SELECT
    USING (true);

-- Políticas para routines
CREATE POLICY "Pais veem rotinas de seus filhos"
    ON routines FOR SELECT
    USING (
        child_id IN (
            SELECT id FROM child_accounts WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Pais gerenciam rotinas de seus filhos"
    ON routines FOR ALL
    USING (
        child_id IN (
            SELECT id FROM child_accounts WHERE created_by = auth.uid()
        )
    );

-- Políticas para tasks
CREATE POLICY "Pais veem tarefas de seus filhos"
    ON tasks FOR SELECT
    USING (
        routine_id IN (
            SELECT r.id FROM routines r
            JOIN child_accounts c ON r.child_id = c.id
            WHERE c.created_by = auth.uid()
        )
    );

CREATE POLICY "Pais gerenciam tarefas de seus filhos"
    ON tasks FOR ALL
    USING (
        routine_id IN (
            SELECT r.id FROM routines r
            JOIN child_accounts c ON r.child_id = c.id
            WHERE c.created_by = auth.uid()
        )
    );

-- Políticas para task_progress
CREATE POLICY "Acesso ao progresso das tarefas"
    ON task_progress FOR ALL
    USING (true);

-- Políticas para educational_strategies (leitura pública)
CREATE POLICY "Estratégias são públicas"
    ON educational_strategies FOR SELECT
    USING (true);

-- ============================================================
-- TRIGGER: atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parent_accounts_updated_at
    BEFORE UPDATE ON parent_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_child_accounts_updated_at
    BEFORE UPDATE ON child_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routines_updated_at
    BEFORE UPDATE ON routines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
