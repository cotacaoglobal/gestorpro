-- =====================================================
-- MÓDULO TEF - TRANSFERÊNCIA ELETRÔNICA DE FUNDOS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Tabela de Configuração TEF
CREATE TABLE IF NOT EXISTS tef_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Provider ativo
    provider VARCHAR(20) NOT NULL DEFAULT 'NONE'
        CHECK (provider IN ('STONE', 'CIELO', 'REDE', 'PAGSEGURO', 'GETNET', 'SAFRAPAY', 'SUMUP', 'MERCADOPAGO', 'NONE')),
    is_active BOOLEAN DEFAULT false,
    
    -- Credenciais (criptografar em produção!)
    credentials_encrypted JSONB DEFAULT '{}',
    
    -- Configurações gerais
    environment VARCHAR(20) DEFAULT 'SANDBOX'
        CHECK (environment IN ('PRODUCTION', 'SANDBOX')),
    auto_capture BOOLEAN DEFAULT true,
    max_installments INTEGER DEFAULT 12,
    min_installment_value DECIMAL(10,2) DEFAULT 5.00,
    
    -- Taxas por bandeira (para exibição)
    fees JSONB DEFAULT '{}',
    
    -- Pix
    pix_enabled BOOLEAN DEFAULT false,
    pix_key VARCHAR(100),
    pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM')),
    pix_expiration_minutes INTEGER DEFAULT 30,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id)
);

-- 2. Tabela de Transações TEF
CREATE TABLE IF NOT EXISTS tef_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    
    -- Tipo e status
    type VARCHAR(20) NOT NULL 
        CHECK (type IN ('CREDIT', 'CREDIT_INST', 'DEBIT', 'PIX', 'VOUCHER')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PROCESSING', 'APPROVED', 'DECLINED', 'CANCELLED', 'ERROR', 'TIMEOUT')),
    
    -- Valores
    amount DECIMAL(12,2) NOT NULL,
    installments INTEGER DEFAULT 1,
    installment_value DECIMAL(12,2),
    
    -- Dados do cartão (mascarados)
    card_brand VARCHAR(20),
    card_last_digits VARCHAR(4),
    card_holder_name VARCHAR(100),
    
    -- Dados Pix
    pix_key VARCHAR(100),
    pix_qr_code TEXT,
    pix_qr_code_base64 TEXT,
    pix_expiration TIMESTAMPTZ,
    
    -- Resposta TEF
    authorization_code VARCHAR(50),
    nsu VARCHAR(50),
    acquirer_nsu VARCHAR(50),
    receipt_customer TEXT,
    receipt_merchant TEXT,
    
    -- Provider
    provider VARCHAR(20) NOT NULL,
    provider_transaction_id VARCHAR(100),
    
    -- Datas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Erros
    error_code VARCHAR(20),
    error_message TEXT
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_tef_configs_tenant ON tef_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tef_transactions_tenant ON tef_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tef_transactions_status ON tef_transactions(status);
CREATE INDEX IF NOT EXISTS idx_tef_transactions_sale ON tef_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_tef_transactions_created ON tef_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tef_transactions_date ON tef_transactions(DATE(created_at));

-- 4. RLS Policies
ALTER TABLE tef_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tef_transactions ENABLE ROW LEVEL SECURITY;

-- Policies para tef_configs
CREATE POLICY "tef_configs_tenant_isolation" ON tef_configs
    FOR ALL USING (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Policies para tef_transactions
CREATE POLICY "tef_transactions_tenant_isolation" ON tef_transactions
    FOR ALL USING (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- 5. View de resumo diário TEF
CREATE OR REPLACE VIEW tef_daily_summary AS
SELECT 
    tenant_id,
    DATE(created_at) as transaction_date,
    COUNT(*) FILTER (WHERE status = 'APPROVED') as total_approved,
    COALESCE(SUM(amount) FILTER (WHERE status = 'APPROVED'), 0) as total_amount,
    
    -- Por tipo
    COUNT(*) FILTER (WHERE type = 'CREDIT' AND status = 'APPROVED') as credit_count,
    COALESCE(SUM(amount) FILTER (WHERE type = 'CREDIT' AND status = 'APPROVED'), 0) as credit_amount,
    
    COUNT(*) FILTER (WHERE type = 'CREDIT_INST' AND status = 'APPROVED') as credit_inst_count,
    COALESCE(SUM(amount) FILTER (WHERE type = 'CREDIT_INST' AND status = 'APPROVED'), 0) as credit_inst_amount,
    
    COUNT(*) FILTER (WHERE type = 'DEBIT' AND status = 'APPROVED') as debit_count,
    COALESCE(SUM(amount) FILTER (WHERE type = 'DEBIT' AND status = 'APPROVED'), 0) as debit_amount,
    
    COUNT(*) FILTER (WHERE type = 'PIX' AND status = 'APPROVED') as pix_count,
    COALESCE(SUM(amount) FILTER (WHERE type = 'PIX' AND status = 'APPROVED'), 0) as pix_amount,
    
    -- Canceladas
    COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'CANCELLED'), 0) as cancelled_amount
FROM tef_transactions
GROUP BY tenant_id, DATE(created_at);

-- 6. Função para obter resumo do dia
CREATE OR REPLACE FUNCTION get_tef_daily_summary(p_tenant_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'date', p_date,
        'totalTransactions', COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END), 0),
        'totalAmount', COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END), 0),
        'byType', jsonb_build_object(
            'credit', jsonb_build_object(
                'count', COALESCE(SUM(CASE WHEN type = 'CREDIT' AND status = 'APPROVED' THEN 1 ELSE 0 END), 0),
                'amount', COALESCE(SUM(CASE WHEN type = 'CREDIT' AND status = 'APPROVED' THEN amount ELSE 0 END), 0)
            ),
            'creditInstallment', jsonb_build_object(
                'count', COALESCE(SUM(CASE WHEN type = 'CREDIT_INST' AND status = 'APPROVED' THEN 1 ELSE 0 END), 0),
                'amount', COALESCE(SUM(CASE WHEN type = 'CREDIT_INST' AND status = 'APPROVED' THEN amount ELSE 0 END), 0)
            ),
            'debit', jsonb_build_object(
                'count', COALESCE(SUM(CASE WHEN type = 'DEBIT' AND status = 'APPROVED' THEN 1 ELSE 0 END), 0),
                'amount', COALESCE(SUM(CASE WHEN type = 'DEBIT' AND status = 'APPROVED' THEN amount ELSE 0 END), 0)
            ),
            'pix', jsonb_build_object(
                'count', COALESCE(SUM(CASE WHEN type = 'PIX' AND status = 'APPROVED' THEN 1 ELSE 0 END), 0),
                'amount', COALESCE(SUM(CASE WHEN type = 'PIX' AND status = 'APPROVED' THEN amount ELSE 0 END), 0)
            )
        ),
        'cancelled', jsonb_build_object(
            'count', COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END), 0),
            'amount', COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN amount ELSE 0 END), 0)
        )
    ) INTO result
    FROM tef_transactions
    WHERE tenant_id = p_tenant_id
      AND DATE(created_at) = p_date;
    
    RETURN COALESCE(result, jsonb_build_object(
        'date', p_date,
        'totalTransactions', 0,
        'totalAmount', 0
    ));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE tef_configs IS 'Configurações TEF dos estabelecimentos';
COMMENT ON TABLE tef_transactions IS 'Transações TEF (cartão, Pix, etc)';
COMMENT ON VIEW tef_daily_summary IS 'Resumo diário de transações TEF por tenant';
