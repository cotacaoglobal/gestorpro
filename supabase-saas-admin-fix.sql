-- ==============================================================================
-- SCRIPT DE CORREÇÃO E INSTALAÇÃO COMPLETA (SUPER ADMIN + MULTI-TENANCY)
-- Execute este script inteiro para garantir que todas as tabelas existam.
-- ==============================================================================

-- 1. GARANTIR QUE A TABELA DE TENANTS EXISTA (Base do sistema)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Identificador amigável (ex: padaria-joao)
  plan TEXT DEFAULT 'free', -- free, pro, enterprise
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir tenant padrão se não existir (Evita erros em dados legados)
INSERT INTO tenants (name, slug, plan, status) 
VALUES ('Empresa Padrão', 'default', 'pro', 'active')
ON CONFLICT (slug) DO NOTHING;


-- 2. TABELA DE PLANOS (SAAS PLANS)
CREATE TABLE IF NOT EXISTS saas_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  limits JSONB NOT NULL DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE ASSINATURAS (Vincula Tenant ao Plano)
CREATE TABLE IF NOT EXISTS saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  plan_id UUID REFERENCES saas_plans(id) NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE FATURAS (Histórico Financeiro)
CREATE TABLE IF NOT EXISTS saas_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  subscription_id UUID REFERENCES saas_subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  invoice_url TEXT,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. POPULAR PLANOS PADRÃO
INSERT INTO saas_plans (name, slug, description, price, limits, features) VALUES
(
  'Grátis', 
  'free', 
  'Para pequenos negócios iniciantes',
  0.00, 
  '{"users": 1, "products": 50, "storage_mb": 100}', 
  '{"basic_pos", "simple_reports"}'
),
(
  'Pro', 
  'pro', 
  'Para negócios em crescimento',
  49.90, 
  '{"users": 5, "products": 2000, "storage_mb": 1000}', 
  '{"basic_pos", "thermal_printer", "advanced_reports", "inventory_control"}'
),
(
  'Enterprise', 
  'enterprise', 
  'Para grandes redes e franquias',
  149.90, 
  '{"users": 100, "products": 100000, "storage_mb": 10000}', 
  '{"all_features", "priority_support", "api_access", "multi_branch"}'
)
ON CONFLICT (slug) DO NOTHING;

-- 6. HABILITAR SEGURANÇA BÁSICA (RLS)
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read plans" ON saas_plans;
CREATE POLICY "Public read plans" ON saas_plans FOR SELECT USING (true);

ALTER TABLE saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. ATUALIZAÇÃO DE FUNCIONALIDADE: GARANTIR QUE USERS TENHA TENANT_ID
-- (Caso sua tabela users já exista sem essa coluna)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tenant_id') THEN
            ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        END IF;
    END IF;
END $$;
