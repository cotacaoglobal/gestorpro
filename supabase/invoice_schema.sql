-- =====================================================
-- MÓDULO DE NOTAS FISCAIS - GESTOR PRO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Tabela de Configuração Fiscal da Empresa
CREATE TABLE IF NOT EXISTS fiscal_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Dados da empresa
    cnpj VARCHAR(18) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    inscricao_estadual VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    
    -- Regime tributário
    tax_regime VARCHAR(20) NOT NULL DEFAULT 'SIMPLES' 
        CHECK (tax_regime IN ('SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI')),
    
    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip_code VARCHAR(10),
    address_ibge_code VARCHAR(10),
    
    -- Contato
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Certificado Digital
    certificate_status VARCHAR(20) DEFAULT 'NOT_CONFIGURED'
        CHECK (certificate_status IN ('NOT_CONFIGURED', 'VALID', 'EXPIRED', 'INVALID')),
    certificate_expiry TIMESTAMPTZ,
    
    -- Configurações de emissão
    default_series VARCHAR(10) DEFAULT '1',
    environment VARCHAR(20) DEFAULT 'HOMOLOGATION'
        CHECK (environment IN ('PRODUCTION', 'HOMOLOGATION')),
    
    -- API de integração (futuro)
    api_provider VARCHAR(20) DEFAULT 'NONE'
        CHECK (api_provider IN ('NFEIO', 'FOCUS', 'WEBMANIA', 'ENOTAS', 'NONE')),
    api_key_encrypted TEXT,
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id)
);

-- 2. Tabela de Notas Fiscais
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    
    -- Tipo e status
    type VARCHAR(10) NOT NULL CHECK (type IN ('NFE', 'NFCE', 'NFSE', 'NFPE', 'MDFE')),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'PENDING', 'AUTHORIZED', 'CANCELLED', 'DENIED', 'CORRECTED')),
    
    -- Números da nota
    number VARCHAR(20),
    series VARCHAR(10),
    access_key VARCHAR(50),
    protocol_number VARCHAR(30),
    
    -- Emitente
    issuer_cnpj VARCHAR(18) NOT NULL,
    issuer_name VARCHAR(255) NOT NULL,
    
    -- Destinatário
    recipient_type VARCHAR(10) NOT NULL CHECK (recipient_type IN ('CPF', 'CNPJ')),
    recipient_document VARCHAR(18) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    recipient_address JSONB,
    
    -- Valores
    total_products DECIMAL(12,2) NOT NULL,
    total_discount DECIMAL(12,2) DEFAULT 0,
    shipping_cost DECIMAL(12,2) DEFAULT 0,
    total_invoice DECIMAL(12,2) NOT NULL,
    
    -- Pagamento
    payment_method VARCHAR(20) DEFAULT 'OTHER'
        CHECK (payment_method IN ('CASH', 'CREDIT', 'DEBIT', 'PIX', 'OTHER')),
    
    -- Observações
    notes TEXT,
    internal_notes TEXT,
    
    -- Datas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    issued_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Arquivos
    xml_url TEXT,
    pdf_url TEXT,
    
    -- Erros
    error_code VARCHAR(20),
    error_message TEXT
);

-- 3. Tabela de Itens da Nota
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    product_name VARCHAR(255) NOT NULL,
    ncm VARCHAR(10),
    cfop VARCHAR(10),
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    
    -- Tributos (para futuro)
    icms DECIMAL(5,2),
    ipi DECIMAL(5,2),
    pis DECIMAL(5,2),
    cofins DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Uso de Notas (controle de limite por plano)
CREATE TABLE IF NOT EXISTS invoice_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    month INTEGER NOT NULL, -- Formato YYYYMM
    invoices_issued INTEGER DEFAULT 0,
    invoices_limit INTEGER NOT NULL,
    overage_invoices INTEGER DEFAULT 0,
    overage_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, month)
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_sale ON invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_usage_tenant_month ON invoice_usage(tenant_id, month);

-- 6. RLS Policies
ALTER TABLE fiscal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_usage ENABLE ROW LEVEL SECURITY;

-- Policies para fiscal_configs
CREATE POLICY "fiscal_configs_tenant_isolation" ON fiscal_configs
    FOR ALL USING (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Policies para invoices
CREATE POLICY "invoices_tenant_isolation" ON invoices
    FOR ALL USING (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Policies para invoice_items
CREATE POLICY "invoice_items_tenant_isolation" ON invoice_items
    FOR ALL USING (invoice_id IN (
        SELECT id FROM invoices WHERE tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

-- Policies para invoice_usage
CREATE POLICY "invoice_usage_tenant_isolation" ON invoice_usage
    FOR ALL USING (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- 7. Função para atualizar uso de notas
CREATE OR REPLACE FUNCTION update_invoice_usage()
RETURNS TRIGGER AS $$
DECLARE
    current_month INTEGER;
    tenant_limit INTEGER;
BEGIN
    IF NEW.status = 'AUTHORIZED' AND (OLD.status IS NULL OR OLD.status != 'AUTHORIZED') THEN
        current_month := EXTRACT(YEAR FROM NOW())::INTEGER * 100 + EXTRACT(MONTH FROM NOW())::INTEGER;
        
        -- Buscar limite do plano (default 50 para demonstração)
        SELECT COALESCE(s.invoice_limit, 50) INTO tenant_limit
        FROM subscriptions s
        WHERE s.tenant_id = NEW.tenant_id AND s.status = 'active'
        LIMIT 1;
        
        -- Inserir ou atualizar uso
        INSERT INTO invoice_usage (tenant_id, month, invoices_issued, invoices_limit)
        VALUES (NEW.tenant_id, current_month, 1, tenant_limit)
        ON CONFLICT (tenant_id, month)
        DO UPDATE SET 
            invoices_issued = invoice_usage.invoices_issued + 1,
            overage_invoices = GREATEST(0, invoice_usage.invoices_issued + 1 - invoice_usage.invoices_limit),
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar uso
DROP TRIGGER IF EXISTS trigger_update_invoice_usage ON invoices;
CREATE TRIGGER trigger_update_invoice_usage
    AFTER INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_usage();

-- 8. Adicionar coluna invoice_limit na tabela subscriptions (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'invoice_limit'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN invoice_limit INTEGER DEFAULT 0;
    END IF;
END $$;

-- 9. Função para verificar se pode emitir nota
CREATE OR REPLACE FUNCTION can_issue_invoice(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
    current_month INTEGER;
    usage_record RECORD;
    tenant_limit INTEGER;
    result JSONB;
BEGIN
    current_month := EXTRACT(YEAR FROM NOW())::INTEGER * 100 + EXTRACT(MONTH FROM NOW())::INTEGER;
    
    -- Buscar limite do plano
    SELECT COALESCE(s.invoice_limit, 0) INTO tenant_limit
    FROM subscriptions s
    WHERE s.tenant_id = p_tenant_id AND s.status = 'active'
    LIMIT 1;
    
    -- -1 significa ilimitado
    IF tenant_limit = -1 THEN
        RETURN jsonb_build_object(
            'can_issue', true,
            'is_unlimited', true,
            'issued', 0,
            'limit', -1,
            'remaining', -1
        );
    END IF;
    
    -- Buscar uso atual
    SELECT * INTO usage_record
    FROM invoice_usage
    WHERE tenant_id = p_tenant_id AND month = current_month;
    
    IF usage_record IS NULL THEN
        RETURN jsonb_build_object(
            'can_issue', tenant_limit > 0,
            'is_unlimited', false,
            'issued', 0,
            'limit', tenant_limit,
            'remaining', tenant_limit,
            'overage_count', 0
        );
    END IF;
    
    RETURN jsonb_build_object(
        'can_issue', true, -- Sempre pode, mas cobra excedente
        'is_unlimited', false,
        'issued', usage_record.invoices_issued,
        'limit', usage_record.invoices_limit,
        'remaining', GREATEST(0, usage_record.invoices_limit - usage_record.invoices_issued),
        'overage_count', usage_record.overage_invoices
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

COMMENT ON TABLE fiscal_configs IS 'Configurações fiscais das empresas para emissão de NF-e';
COMMENT ON TABLE invoices IS 'Notas fiscais emitidas (NF-e, NFC-e, NFS-e, etc)';
COMMENT ON TABLE invoice_items IS 'Itens das notas fiscais';
COMMENT ON TABLE invoice_usage IS 'Controle de uso de notas por mês para cobrança de excedente';
