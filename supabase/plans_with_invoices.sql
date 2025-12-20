-- =====================================================
-- PLANOS DE ASSINATURA COM NOTAS FISCAIS - GESTOR PRO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Atualizar planos existentes com limites de notas fiscais
-- Primeiro, vamos verificar quais planos existem
-- SELECT id, slug, name FROM saas_plans;

-- 2. Atualizar planos existentes para incluir invoice_limit nos limites
UPDATE saas_plans 
SET 
    limits = jsonb_set(COALESCE(limits, '{}'::jsonb), '{invoice_limit}', '0'),
    name = 'Starter',
    description = 'Ideal para quem está começando e não precisa emitir notas fiscais',
    price = 49.90,
    features = ARRAY['PDV Completo', 'Controle de Estoque', 'Relatórios Básicos', 'Suporte por Email']
WHERE slug = 'free' OR slug = 'starter';

UPDATE saas_plans 
SET 
    limits = jsonb_set(COALESCE(limits, '{}'::jsonb), '{invoice_limit}', '50'),
    name = 'Essencial',
    description = 'Para pequenos negócios que emitem poucas notas',
    price = 79.90,
    features = ARRAY['PDV Completo', 'Controle de Estoque', 'Relatórios Completos', 'Impressão Térmica', 'Gestão de Caixa', 'NF-e/NFC-e/NFS-e']
WHERE slug = 'basic' OR slug = 'essencial';

UPDATE saas_plans 
SET 
    limits = jsonb_set(COALESCE(limits, '{}'::jsonb), '{invoice_limit}', '200'),
    name = 'Profissional',
    description = 'Para negócios em crescimento com volume médio de vendas',
    price = 129.90,
    features = ARRAY['PDV Completo', 'Controle de Estoque', 'Relatórios Avançados', 'Impressão Térmica', 'Gestão de Caixa', 'NF-e/NFC-e/NFS-e', 'Multi-formas Pagamento', 'Suporte Prioritário']
WHERE slug = 'pro' OR slug = 'profissional';

UPDATE saas_plans 
SET 
    limits = jsonb_set(COALESCE(limits, '{}'::jsonb), '{invoice_limit}', '500'),
    name = 'Empresarial',
    description = 'Para empresas com alto volume de vendas',
    price = 199.90,
    features = ARRAY['PDV Completo', 'Controle de Estoque Avançado', 'Relatórios Personalizados', 'Impressão Térmica', 'NF-e/NFC-e/NFS-e/MDF-e', 'API de Integração', 'Backup Automático', 'Suporte 24/7']
WHERE slug = 'enterprise' OR slug = 'empresarial';

-- 3. Inserir plano Ilimitado se não existir
INSERT INTO saas_plans (name, slug, description, price, limits, features, active)
SELECT 
    'Ilimitado',
    'ilimitado',
    'Sem limites para quem precisa de máxima performance',
    299.90,
    '{"users": -1, "products": -1, "invoice_limit": -1}'::jsonb,
    ARRAY['Tudo do Empresarial', 'Usuários Ilimitados', 'Notas Ilimitadas', 'Produtos Ilimitados', 'Gerente de Conta Dedicado', 'Treinamento Personalizado', 'SLA 99.9%', 'Integração TEF'],
    true
WHERE NOT EXISTS (SELECT 1 FROM saas_plans WHERE slug = 'ilimitado');

-- 4. Criar tabela de preços excedentes (se não existir)
CREATE TABLE IF NOT EXISTS invoice_overage_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_slug TEXT NOT NULL UNIQUE,
    price_per_invoice DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inserir/Atualizar preços de notas excedentes por plano
INSERT INTO invoice_overage_pricing (plan_slug, price_per_invoice)
VALUES 
    ('free', 0),
    ('starter', 0),
    ('basic', 0.50),
    ('essencial', 0.50),
    ('pro', 0.40),
    ('profissional', 0.40),
    ('enterprise', 0.30),
    ('empresarial', 0.30),
    ('ilimitado', 0)
ON CONFLICT (plan_slug) DO UPDATE SET
    price_per_invoice = EXCLUDED.price_per_invoice;

-- 6. Adicionar coluna invoice_limit na tabela subscriptions (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'invoice_limit'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN invoice_limit INTEGER DEFAULT 0;
    END IF;
END $$;

-- 7. View para consulta de planos com detalhes de notas
CREATE OR REPLACE VIEW plans_with_invoice_details AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    p.description,
    p.features,
    (p.limits->>'users')::INTEGER as user_limit,
    (p.limits->>'products')::INTEGER as product_limit,
    COALESCE((p.limits->>'invoice_limit')::INTEGER, 0) as invoice_limit,
    COALESCE(iop.price_per_invoice, 0) as overage_price,
    CASE 
        WHEN COALESCE((p.limits->>'invoice_limit')::INTEGER, 0) = 0 THEN 'Sem emissão de notas'
        WHEN (p.limits->>'invoice_limit')::INTEGER = -1 THEN 'Notas ilimitadas'
        ELSE (p.limits->>'invoice_limit')::TEXT || ' notas/mês'
    END as invoice_display,
    p.active
FROM saas_plans p
LEFT JOIN invoice_overage_pricing iop ON p.slug = iop.plan_slug
WHERE p.active = true
ORDER BY p.price ASC;

-- 8. Verificar planos atualizados
SELECT 
    name,
    slug,
    price,
    COALESCE((limits->>'invoice_limit')::INTEGER, 0) as notas_mes,
    array_to_string(features, ', ') as recursos
FROM saas_plans
ORDER BY price;

-- =====================================================
-- RESUMO DOS PLANOS ATUALIZADOS
-- =====================================================
/*
+---------------+----------+---------+-------------+-------------------+
| Plano         | Preço    | Usuários| Notas/Mês   | Excedente         |
+---------------+----------+---------+-------------+-------------------+
| Starter       | R$ 49,90 | 1       | 0           | N/A               |
| Essencial     | R$ 79,90 | 2       | 50          | R$ 0,50/nota      |
| Profissional  | R$ 129,90| 5       | 200         | R$ 0,40/nota      |
| Empresarial   | R$ 199,90| 10      | 500         | R$ 0,30/nota      |
| Ilimitado     | R$ 299,90| ∞       | ∞           | N/A               |
+---------------+----------+---------+-------------+-------------------+

Obs: -1 significa ilimitado
*/
