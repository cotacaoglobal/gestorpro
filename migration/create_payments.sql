-- SISTEMA DE PAGAMENTOS - Mercado Pago
-- Tabela para armazenar transações e faturas

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    plan_id UUID REFERENCES public.saas_plans(id),
    
    -- Dados da transação
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    
    -- Status do pagamento
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process')),
    
    -- Informações do Mercado Pago
    mp_preference_id TEXT, -- ID da preferência criada
    mp_payment_id TEXT, -- ID do pagamento após conclusão
    mp_payment_type TEXT, -- credit_card, debit_card, ticket, pix, etc
    mp_payment_method TEXT, -- visa, mastercard, bolbradesco, etc
    
    -- Metadados
    description TEXT,
    payment_link TEXT, -- Link de checkout do MP
    
    -- Dados de pagamento (para PIX)
    pix_qr_code TEXT,
    pix_qr_code_base64 TEXT,
    pix_expiration TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Para boleto/PIX
    
    -- Webhook/Notification data
    webhook_data JSONB, -- Dados brutos do webhook para auditoria
    
    -- Chaves únicas
    UNIQUE(mp_preference_id),
    UNIQUE(mp_payment_id)
);

-- Índices
CREATE INDEX idx_payment_transactions_tenant_id ON public.payment_transactions(tenant_id);
CREATE INDEX idx_payment_transactions_subscription_id ON public.payment_transactions(subscription_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_mp_payment_id ON public.payment_transactions(mp_payment_id);
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- RLS Policies
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Super Admin vê tudo
CREATE POLICY "Super admins can view all transactions"
ON public.payment_transactions FOR SELECT
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Super Admin pode gerenciar tudo
CREATE POLICY "Super admins can manage all transactions"
ON public.payment_transactions FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Admins/Users podem ver transações do próprio tenant
CREATE POLICY "Users can view own tenant transactions"
ON public.payment_transactions FOR SELECT
USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

-- Sistema pode criar transações (para webhook)
CREATE POLICY "Service role can insert transactions"
ON public.payment_transactions FOR INSERT
WITH CHECK (true); -- Webhook usa service role

-- Sistema pode atualizar transações (para webhook)
CREATE POLICY "Service role can update transactions"
ON public.payment_transactions FOR UPDATE
USING (true); -- Webhook usa service role

-- View para facilitar consultas
CREATE OR REPLACE VIEW public.tenant_payments_view AS
SELECT 
    pt.id as transaction_id,
    pt.tenant_id,
    pt.subscription_id,
    pt.amount,
    pt.currency,
    pt.status,
    pt.mp_payment_type,
    pt.mp_payment_method,
    pt.description,
    pt.created_at,
    pt.paid_at,
    pt.expires_at,
    t.name as tenant_name,
    p.name as plan_name,
    p.price as plan_price
FROM public.payment_transactions pt
LEFT JOIN public.tenants t ON pt.tenant_id = t.id
LEFT JOIN public.saas_plans p ON pt.plan_id = p.id
ORDER BY pt.created_at DESC;

-- Trigger para atualizar assinatura após pagamento aprovado
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
        
        RAISE LOG 'Subscription % activated after payment %', NEW.subscription_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER payment_approved_trigger
    AFTER UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_payment_approved();

COMMENT ON TABLE public.payment_transactions IS 'Histórico de transações de pagamento via Mercado Pago';
