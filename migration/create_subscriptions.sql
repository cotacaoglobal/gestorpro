-- SISTEMA DE ASSINATURAS - Estrutura do Banco de Dados

-- 1. Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.saas_plans(id),
    
    -- Status da assinatura
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
    
    -- Datas
    started_at TIMESTAMPTZ DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ, -- Se NULL, não tem trial
    expires_at TIMESTAMPTZ, -- Data de expiração (para assinaturas mensais/anuais)
    cancelled_at TIMESTAMPTZ, -- Quando foi cancelada
    
    -- Metadata
    auto_renew BOOLEAN DEFAULT true, -- Se deve renovar automaticamente
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Um tenant pode ter apenas uma assinatura ativa por vez
    UNIQUE(tenant_id)
);

-- 2. Criar índices para performance
CREATE INDEX idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);

-- 3. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- 4. RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Super Admin vê tudo
CREATE POLICY "Super admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Super Admin pode fazer tudo
CREATE POLICY "Super admins can manage all subscriptions"
ON public.subscriptions FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Admins podem ver sua própria assinatura
CREATE POLICY "Admins can view own subscription"
ON public.subscriptions FOR SELECT
USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- 5. View helper para facilitar consultas (join de subscription + plan info)
CREATE OR REPLACE VIEW public.tenant_subscriptions_view AS
SELECT 
    s.id as subscription_id,
    s.tenant_id,
    s.status as subscription_status,
    s.started_at,
    s.trial_ends_at,
    s.expires_at,
    s.cancelled_at,
    s.auto_renew,
    p.id as plan_id,
    p.name as plan_name,
    p.slug as plan_slug,
    p.price as plan_price,
    p.limits as plan_limits,
    p.features as plan_features
FROM public.subscriptions s
LEFT JOIN public.saas_plans p ON s.plan_id = p.id;

-- 6. Função helper para verificar se assinatura está válida
CREATE OR REPLACE FUNCTION public.is_subscription_active(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_status TEXT;
    v_expires_at TIMESTAMPTZ;
    v_trial_ends_at TIMESTAMPTZ;
BEGIN
    SELECT status, expires_at, trial_ends_at 
    INTO v_status, v_expires_at, v_trial_ends_at
    FROM public.subscriptions
    WHERE tenant_id = p_tenant_id;
    
    -- Se não tem assinatura, retorna false
    IF v_status IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Se cancelada ou expirada, retorna false
    IF v_status IN ('cancelled', 'expired') THEN
        RETURN FALSE;
    END IF;
    
    -- Se em trial, verifica se trial ainda é válido
    IF v_status = 'trial' AND v_trial_ends_at IS NOT NULL THEN
        IF v_trial_ends_at < NOW() THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Se ativa, verifica se não expirou
    IF v_status = 'active' AND v_expires_at IS NOT NULL THEN
        IF v_expires_at < NOW() THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.subscriptions IS 'Assinaturas dos tenants vinculadas aos planos SaaS';
