-- CRIAR TABELA DE PLANOS SAAS (SE NÃO EXISTIR)
-- Execute este script ANTES do create_subscriptions.sql

CREATE TABLE IF NOT EXISTS public.saas_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    limits JSONB DEFAULT '{}', -- Ex: {"users": 2, "products": 100}
    features TEXT[] DEFAULT '{}', -- Array de strings com features
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_saas_plans_slug ON public.saas_plans(slug);
CREATE INDEX IF NOT EXISTS idx_saas_plans_active ON public.saas_plans(active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_saas_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS saas_plans_updated_at ON public.saas_plans;
CREATE TRIGGER saas_plans_updated_at
    BEFORE UPDATE ON public.saas_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_saas_plans_updated_at();

-- RLS Policies
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;

-- Super Admin pode tudo
DROP POLICY IF EXISTS "Super admins can manage plans" ON public.saas_plans;
CREATE POLICY "Super admins can manage plans"
ON public.saas_plans FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Todos podem visualizar planos ativos
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.saas_plans;
CREATE POLICY "Anyone can view active plans"
ON public.saas_plans FOR SELECT
USING (active = true);

-- Inserir planos padrão (se a tabela estiver vazia)
INSERT INTO public.saas_plans (name, slug, description, price, limits, features)
SELECT * FROM (VALUES
    ('Grátis', 'free', 'Plano gratuito para teste', 0, 
     '{"users": 2, "products": 15, "sales_per_month": 100}'::jsonb,
     ARRAY['2 usuários', '15 produtos', '100 vendas/mês', 'Suporte por email']),
    
    ('Básico', 'basic', 'Ideal para pequenos negócios', 59.90,
     '{"users": 5, "products": 500, "sales_per_month": 1000}'::jsonb,
     ARRAY['5 usuários', '500 produtos', '1000 vendas/mês', 'Relatórios básicos', 'Suporte prioritário']),
    
    ('Profissional', 'pro', 'Para empresas em crescimento', 99.90,
     '{"users": 15, "products": 2500, "sales_per_month": -1}'::jsonb,
     ARRAY['15 usuários', '2500 produtos', 'Vendas ilimitadas', 'Relatórios avançados', 'Integrações', 'Suporte 24/7']),
    
    ('Enterprise', 'enterprise', 'Solução completa para grandes empresas', 199.90,
     '{"users": -1, "products": -1, "sales_per_month": -1}'::jsonb,
     ARRAY['Usuários ilimitados', 'Produtos ilimitados', 'Vendas ilimitadas', 'API dedicada', 'Customizações', 'Gerente de conta', 'Suporte VIP'])
) AS v(name, slug, description, price, limits, features)
WHERE NOT EXISTS (SELECT 1 FROM public.saas_plans LIMIT 1);

COMMENT ON TABLE public.saas_plans IS 'Planos SaaS disponíveis para assinatura';
