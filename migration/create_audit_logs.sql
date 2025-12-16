-- SISTEMA DE LOGS E AUDITORIA
-- Rastreia ações importantes no sistema SaaS

-- 1. Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Ação executada
    action TEXT NOT NULL, -- Ex: 'tenant_created', 'plan_changed', 'subscription_activated', 'payment_received', etc
    entity_type TEXT, -- Ex: 'tenant', 'subscription', 'payment', 'user'
    entity_id UUID, -- ID da entidade afetada
    
    -- Detalhes
    details JSONB DEFAULT '{}', -- Informações adicionais sobre a ação
    ip_address TEXT, -- IP de onde veio a ação (se aplicável)
    user_agent TEXT, -- User agent do navegador (se aplicável)
    
    -- Status
    status TEXT CHECK (status IN ('success', 'failed', 'pending')), -- Status da ação
    error_message TEXT, -- Mensagem de erro se falhou
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_tenant_action ON public.audit_logs(tenant_id, action); -- Índice composto

-- 3. RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Super Admin vê todos os logs
CREATE POLICY "Super admins can view all logs"
ON public.audit_logs FOR SELECT
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Admins podem ver logs do próprio tenant
CREATE POLICY "Admins can view own tenant logs"
ON public.audit_logs FOR SELECT
USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'operator')
);

-- Sistema pode inserir logs (usando service role)
CREATE POLICY "Service role can insert logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- 4. Função helper para criar log de auditoria
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_tenant_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_status TEXT DEFAULT 'success'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        tenant_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        status
    ) VALUES (
        p_tenant_id,
        p_user_id,
        p_action,
        p_entity_type,
        p_entity_id,
        p_details,
        p_status
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para logar criação de novos tenants
CREATE OR REPLACE FUNCTION public.log_tenant_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.create_audit_log(
        p_tenant_id := NEW.id,
        p_user_id := NULL,
        p_action := 'tenant_created',
        p_entity_type := 'tenant',
        p_entity_id := NEW.id,
        p_details := jsonb_build_object(
            'tenant_name', NEW.name,
            'slug', NEW.slug,
            'plan', NEW.plan,
            'status', NEW.status
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenant_creation_log ON public.tenants;
CREATE TRIGGER tenant_creation_log
    AFTER INSERT ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.log_tenant_creation();

-- 6. Trigger para logar mudanças de plano
CREATE OR REPLACE FUNCTION public.log_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Se mudou o plano
    IF (TG_OP = 'UPDATE' AND OLD.plan_id IS DISTINCT FROM NEW.plan_id) THEN
        PERFORM public.create_audit_log(
            p_tenant_id := NEW.tenant_id,
            p_user_id := NULL,
            p_action := 'plan_changed',
            p_entity_type := 'subscription',
            p_entity_id := NEW.id,
            p_details := jsonb_build_object(
                'old_plan_id', OLD.plan_id,
                'new_plan_id', NEW.plan_id
            )
        );
    END IF;
    
    -- Se mudou o status
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        PERFORM public.create_audit_log(
            p_tenant_id := NEW.tenant_id,
            p_user_id := NULL,
            p_action := 'subscription_status_changed',
            p_entity_type := 'subscription',
            p_entity_id := NEW.id,
            p_details := jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    
    -- Se foi criada uma nova assinatura
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.create_audit_log(
            p_tenant_id := NEW.tenant_id,
            p_user_id := NULL,
            p_action := 'subscription_created',
            p_entity_type := 'subscription',
            p_entity_id := NEW.id,
            p_details := jsonb_build_object(
                'plan_id', NEW.plan_id,
                'status', NEW.status,
                'trial_ends_at', NEW.trial_ends_at
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscription_changes_log ON public.subscriptions;
CREATE TRIGGER subscription_changes_log
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_subscription_changes();

-- 7. Trigger para logar suspensões de tenant
CREATE OR REPLACE FUNCTION public.log_tenant_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        PERFORM public.create_audit_log(
            p_tenant_id := NEW.id,
            p_user_id := NULL,
            p_action := CASE 
                WHEN NEW.status = 'suspended' THEN 'tenant_suspended'
                WHEN NEW.status = 'active' AND OLD.status = 'suspended' THEN 'tenant_reactivated'
                ELSE 'tenant_status_changed'
            END,
            p_entity_type := 'tenant',
            p_entity_id := NEW.id,
            p_details := jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenant_status_changes_log ON public.tenants;
CREATE TRIGGER tenant_status_changes_log
    AFTER UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.log_tenant_status_changes();

-- 8. Atualizar trigger de pagamento para logar
CREATE OR REPLACE FUNCTION public.handle_payment_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o pagamento foi aprovado e tinha subscription_id
    IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.subscription_id IS NOT NULL THEN
        -- Ativar assinatura por 30 dias (ou período configurado)
        UPDATE public.subscriptions
        SET 
            status = 'active',
            expires_at = CASE 
                WHEN expires_at IS NULL OR expires_at < NOW() 
                THEN NOW() + INTERVAL '30 days'
                ELSE expires_at + INTERVAL '30 days'
            END,
            updated_at = NOW()
        WHERE id = NEW.subscription_id;
        
        -- Logar pagamento recebido
        PERFORM public.create_audit_log(
            p_tenant_id := NEW.tenant_id,
            p_user_id := NULL,
            p_action := 'payment_received',
            p_entity_type := 'payment',
            p_entity_id := NEW.id,
            p_details := jsonb_build_object(
                'amount', NEW.amount,
                'currency', NEW.currency,
                'subscription_id', NEW.subscription_id,
                'mp_payment_id', NEW.mp_payment_id,
                'mp_payment_type', NEW.mp_payment_type
            )
        );
        
        RAISE LOG 'Subscription % activated after payment %', NEW.subscription_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.audit_logs IS 'Registro de auditoria de todas as ações importantes do sistema SaaS';
