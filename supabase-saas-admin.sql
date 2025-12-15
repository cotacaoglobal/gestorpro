-- GESTOR PRO - SUPER ADMIN & SAAS MANAGEMENT MODULE
-- Execute este script no SQL Editor do Supabase para criar a infraestrutura do Super Admin

-- 1. TABELA DE PLANOS (SAAS PLANS)
-- Define os níveis de serviço oferecidos pelo SaaS
CREATE TABLE IF NOT EXISTS saas_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                -- Nome visível (Ex: Básico, Profissional)
  slug TEXT UNIQUE NOT NULL,         -- Identificador único (free, pro, enterprise)
  description TEXT,
  price DECIMAL(10,2) NOT NULL,      -- Preço mensal
  limits JSONB NOT NULL DEFAULT '{}',-- Limites técnicos {"users": 1, "products": 50}
  features TEXT[] DEFAULT '{}',      -- Features habilitadas ["thermal_printer", "reports"]
  active BOOLEAN DEFAULT true,       -- Se o plano está disponível para novas assinaturas
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE ASSINATURAS (SUBSCRIPTIONS)
-- Controla qual plano cada tenant possui e o status do pagamento
CREATE TABLE IF NOT EXISTS saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  plan_id UUID REFERENCES saas_plans(id) NOT NULL,
  stripe_subscription_id TEXT,       -- ID externo (Stripe/Asaas) para webhook
  status TEXT DEFAULT 'active',      -- active, past_due, canceled, incomplete, trialing
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,    -- Data de expiração/renovação
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE FATURAS/HISTÓRICO (INVOICES)
-- Registro simples de pagamentos para exibição no painel
CREATE TABLE IF NOT EXISTS saas_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  subscription_id UUID REFERENCES saas_subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,              -- paid, open, void, uncollectible
  invoice_url TEXT,                  -- Link externo para PDF
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INSERIR PLANOS PADRÃO (SEED DA)
-- Cria os 3 planos iniciais sugeridos
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

-- 5. RELAÇÕES E SEGURANÇA (RLS)
-- Liberar leitura de planos para todos (para a página de preços pública)
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read plans" ON saas_plans FOR SELECT USING (true);

-- Assinaturas só podem ser vistas pelo próprio tenant ou super_admin
ALTER TABLE saas_subscriptions ENABLE ROW LEVEL SECURITY;
-- (A lógica de RLS real depende de termos auth.uid() vinculado ao tenant_id, 
--  mas aqui fica o placeholder para update futuro)

-- ===============================================================
-- NOTA IMPORTANTE PARA O DESENVOLVEDOR:
-- Para promover um usuário a SUPER ADMIN, execute manualmente:
-- UPDATE users SET role = 'super_admin' WHERE email = 'seu@email.com';
-- ===============================================================
