-- MÉTRICAS AVANÇADAS - Funções SQL para cálculos complexos

-- =====================================================
-- 1. FUNÇÃO: Calcular Churn Rate
-- =====================================================
-- Churn Rate = (Assinaturas Canceladas no Período / Total de Assinaturas no Início do Período) * 100

CREATE OR REPLACE FUNCTION public.calculate_churn_rate(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
    v_total_start INTEGER;
    v_churned INTEGER;
    v_churn_rate NUMERIC;
BEGIN
    -- Definir período padrão (último mês se não especificado)
    v_end_date := COALESCE(p_end_date, NOW());
    v_start_date := COALESCE(p_start_date, v_end_date - INTERVAL '30 days');
    
    -- Total de assinaturas ativas no início do período
    SELECT COUNT(*)
    INTO v_total_start
    FROM public.subscriptions
    WHERE started_at <= v_start_date
    AND (status IN ('active', 'trial') OR (cancelled_at IS NULL OR cancelled_at > v_start_date));
    
    -- Assinaturas que foram canceladas/expiradas durante o período
    SELECT COUNT(*)
    INTO v_churned
    FROM public.subscriptions
    WHERE (
        (status = 'cancelled' AND cancelled_at BETWEEN v_start_date AND v_end_date)
        OR (status = 'expired' AND expires_at BETWEEN v_start_date AND v_end_date)
    );
    
    -- Calcular churn rate
    IF v_total_start > 0 THEN
        v_churn_rate := (v_churned::NUMERIC / v_total_start::NUMERIC) * 100;
    ELSE
        v_churn_rate := 0;
    END IF;
    
    RETURN ROUND(v_churn_rate, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_churn_rate IS 'Calcula a taxa de cancelamento (churn rate) para um período específico';

-- =====================================================
-- 2. FUNÇÃO: Calcular LTV (Lifetime Value)
-- =====================================================
-- LTV = Receita Média por Cliente * Tempo Médio de Vida do Cliente

CREATE OR REPLACE FUNCTION public.calculate_ltv()
RETURNS NUMERIC AS $$
DECLARE
    v_avg_revenue NUMERIC;
    v_avg_lifetime_months NUMERIC;
    v_ltv NUMERIC;
BEGIN
    -- Receita média mensal por tenant (baseado no plano atual)
    SELECT AVG(sp.price)
    INTO v_avg_revenue
    FROM public.subscriptions s
    JOIN public.saas_plans sp ON s.plan_id = sp.id
    WHERE s.status IN ('active', 'trial');
    
    -- Tempo médio de vida (em meses) dos tenants
    -- Calculado como: (data atual - data de criação) para tenants ativos
    SELECT AVG(EXTRACT(epoch FROM (NOW() - t.created_at)) / (60 * 60 * 24 * 30))
    INTO v_avg_lifetime_months
    FROM public.tenants t
    WHERE t.status = 'active'
    AND t.created_at IS NOT NULL;
    
    -- Se não houver dados suficientes, assumir 12 meses (1 ano)
    v_avg_lifetime_months := COALESCE(v_avg_lifetime_months, 12);
    v_avg_revenue := COALESCE(v_avg_revenue, 0);
    
    -- LTV = Receita Média * Tempo de Vida
    v_ltv := v_avg_revenue * v_avg_lifetime_months;
    
    RETURN ROUND(v_ltv, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_ltv IS 'Calcula o Lifetime Value (valor do tempo de vida) médio dos clientes';

-- =====================================================
-- 3. FUNÇÃO: Crescimento de Tenants por Mês
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_tenant_growth(
    p_months INTEGER DEFAULT 6
)
RETURNS TABLE (
    month TEXT,
    new_tenants INTEGER,
    total_tenants INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT 
            date_trunc('month', NOW() - (n || ' months')::INTERVAL) as month_date,
            TO_CHAR(NOW() - (n || ' months')::INTERVAL, 'Mon/YY') as month_label
        FROM generate_series(p_months - 1, 0, -1) n
    )
    SELECT 
        m.month_label,
        COALESCE(COUNT(t.id) FILTER (WHERE date_trunc('month', t.created_at) = m.month_date), 0)::INTEGER as new_tenants,
        COALESCE(COUNT(t2.id), 0)::INTEGER as total_tenants
    FROM months m
    LEFT JOIN public.tenants t ON date_trunc('month', t.created_at) = m.month_date
    LEFT JOIN public.tenants t2 ON t2.created_at <= (m.month_date + INTERVAL '1 month' - INTERVAL '1 day')
    GROUP BY m.month_date, m.month_label
    ORDER BY m.month_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_tenant_growth IS 'Retorna crescimento de tenants nos últimos N meses';

-- =====================================================
-- 4. FUNÇÃO: Receita por Plano
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_revenue_by_plan()
RETURNS TABLE (
    plan_id UUID,
    plan_name TEXT,
    plan_price NUMERIC,
    active_subscriptions BIGINT,
    mrr NUMERIC,
    percentage NUMERIC
) AS $$
DECLARE
    v_total_mrr NUMERIC;
BEGIN
    -- Calcular MRR total primeiro
    SELECT SUM(sp.price)
    INTO v_total_mrr
    FROM public.subscriptions s
    JOIN public.saas_plans sp ON s.plan_id = sp.id
    WHERE s.status IN ('active', 'trial');
    
    v_total_mrr := COALESCE(v_total_mrr, 1); -- Evitar divisão por zero
    
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        sp.price,
        COUNT(s.id) as active_subscriptions,
        SUM(sp.price) as mrr,
        ROUND((SUM(sp.price) / v_total_mrr * 100), 2) as percentage
    FROM public.saas_plans sp
    LEFT JOIN public.subscriptions s ON s.plan_id = sp.id AND s.status IN ('active', 'trial')
    WHERE sp.active = true
    GROUP BY sp.id, sp.name, sp.price
    ORDER BY mrr DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_revenue_by_plan IS 'Retorna análise de receita por plano';

-- =====================================================
-- 5. FUNÇÃO: Métricas de Retenção
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_retention_metrics()
RETURNS TABLE (
    total_tenants INTEGER,
    active_tenants INTEGER,
    retention_rate NUMERIC,
    avg_subscription_days NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tenants,
        COUNT(*) FILTER (WHERE t.status = 'active')::INTEGER as active_tenants,
        ROUND((COUNT(*) FILTER (WHERE t.status = 'active')::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0) * 100), 2) as retention_rate,
        ROUND(AVG(
            CASE 
                WHEN s.status IN ('active', 'trial') 
                THEN EXTRACT(epoch FROM (NOW() - s.started_at)) / (60 * 60 * 24)
                ELSE EXTRACT(epoch FROM (COALESCE(s.cancelled_at, s.expires_at, NOW()) - s.started_at)) / (60 * 60 * 24)
            END
        ), 2) as avg_subscription_days
    FROM public.tenants t
    LEFT JOIN public.subscriptions s ON s.tenant_id = t.id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_retention_metrics IS 'Retorna métricas de retenção de clientes';

-- =====================================================
-- 6. FUNÇÃO: Receita Recorrente Mensal (MRR) Detalhado
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_mrr_breakdown()
RETURNS TABLE (
    mrr_total NUMERIC,
    mrr_new NUMERIC,
    mrr_expansion NUMERIC,
    mrr_contraction NUMERIC,
    mrr_churn NUMERIC,
    net_mrr_growth NUMERIC
) AS $$
DECLARE
    v_current_month_start TIMESTAMPTZ;
    v_last_month_start TIMESTAMPTZ;
BEGIN
    v_current_month_start := date_trunc('month', NOW());
    v_last_month_start := v_current_month_start - INTERVAL '1 month';
    
    RETURN QUERY
    WITH current_mrr AS (
        SELECT SUM(sp.price) as total
        FROM public.subscriptions s
        JOIN public.saas_plans sp ON s.plan_id = sp.id
        WHERE s.status IN ('active', 'trial')
    ),
    new_mrr AS (
        SELECT COALESCE(SUM(sp.price), 0) as total
        FROM public.subscriptions s
        JOIN public.saas_plans sp ON s.plan_id = sp.id
        WHERE s.started_at >= v_current_month_start
        AND s.status IN ('active', 'trial')
    ),
    churned_mrr AS (
        SELECT COALESCE(SUM(sp.price), 0) as total
        FROM public.subscriptions s
        JOIN public.saas_plans sp ON s.plan_id = sp.id
        WHERE (s.cancelled_at >= v_current_month_start OR s.expires_at >= v_current_month_start)
        AND s.status IN ('cancelled', 'expired')
    )
    SELECT 
        COALESCE((SELECT total FROM current_mrr), 0) as mrr_total,
        COALESCE((SELECT total FROM new_mrr), 0) as mrr_new,
        0::NUMERIC as mrr_expansion, -- TODO: implementar detecção de upgrade
        0::NUMERIC as mrr_contraction, -- TODO: implementar detecção de downgrade
        COALESCE((SELECT total FROM churned_mrr), 0) as mrr_churn,
        COALESCE((SELECT total FROM new_mrr), 0) - COALESCE((SELECT total FROM churned_mrr), 0) as net_mrr_growth;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_mrr_breakdown IS 'Retorna breakdown detalhado do MRR (novo, expansão, contração, churn)';

-- =====================================================
-- 7. VIEW: Dashboard Completo de Métricas
-- =====================================================
CREATE OR REPLACE VIEW public.saas_metrics_dashboard AS
SELECT 
    -- Métricas básicas
    (SELECT COUNT(*) FROM public.tenants) as total_tenants,
    (SELECT COUNT(*) FROM public.tenants WHERE status = 'active') as active_tenants,
    (SELECT COUNT(*) FROM public.subscriptions WHERE status IN ('active', 'trial')) as active_subscriptions,
    
    -- Receita
    (SELECT COALESCE(SUM(sp.price), 0) 
     FROM public.subscriptions s 
     JOIN public.saas_plans sp ON s.plan_id = sp.id 
     WHERE s.status IN ('active', 'trial')) as mrr,
    
    (SELECT COALESCE(SUM(sp.price), 0) * 12
     FROM public.subscriptions s 
     JOIN public.saas_plans sp ON s.plan_id = sp.id 
     WHERE s.status IN ('active', 'trial')) as arr,
    
    -- Métricas avançadas
    public.calculate_churn_rate() as churn_rate,
    public.calculate_ltv() as ltv,
    
    -- Novos tenants este mês
    (SELECT COUNT(*) 
     FROM public.tenants 
     WHERE created_at >= date_trunc('month', NOW())) as new_tenants_month;

COMMENT ON VIEW public.saas_metrics_dashboard IS 'Dashboard consolidado com todas as métricas SaaS';

-- =====================================================
-- Conceder permissões ao authenticated role
-- =====================================================
GRANT EXECUTE ON FUNCTION public.calculate_churn_rate TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_ltv TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_growth TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_by_plan TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_retention_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mrr_breakdown TO authenticated;
GRANT SELECT ON public.saas_metrics_dashboard TO authenticated;
