-- ==============================================================================
-- FINAL SAAS STRUCTURE FIX FOR SUPER ADMIN
-- Run this script in Supabase SQL Editor to fix missing tables, views, and RLS.
-- ==============================================================================

-- 1. FIX TABLE NAME CONFUSION & ENSURE TABLES EXIST

-- Ensure 'subscriptions' exists (renamed from saas_subscriptions legacy idea)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  plan_id UUID REFERENCES saas_plans(id) NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure 'saas_invoices' exists
CREATE TABLE IF NOT EXISTS saas_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,          -- paid, open, void, uncollectible
  invoice_url TEXT,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE DASHBOARD METRICS VIEW (Crucial for Admin Dashboard)
DROP VIEW IF EXISTS saas_metrics_dashboard;
CREATE OR REPLACE VIEW saas_metrics_dashboard AS
WITH stats AS (
    SELECT 
        (SELECT COUNT(*) FROM tenants) as total_tenants,
        (SELECT COUNT(*) FROM tenants WHERE created_at >= date_trunc('month', CURRENT_DATE)) as new_tenants_month,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
        (
            SELECT COALESCE(SUM(p.price), 0)
            FROM subscriptions s
            JOIN saas_plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
        ) as mrr
)
SELECT 
    total_tenants,
    new_tenants_month,
    active_subscriptions,
    mrr,
    (mrr * 12) as arr,
    0.0 as churn_rate, -- Placeholder
    0.0 as ltv         -- Placeholder
FROM stats;

-- 3. FIX RLS POLICIES (Allow Super Admin to see everything)

-- Tenants: Allow Super Admin to SELECT all
DROP POLICY IF EXISTS "Super Admin see all tenants" ON tenants;
CREATE POLICY "Super Admin see all tenants" ON tenants
FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);
-- Ensure basic read is available if not strict
CREATE POLICY "Public read tenants" ON tenants FOR SELECT USING (true);

-- Subscriptions: Allow Super Admin
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admin see all subscriptions" ON subscriptions;
CREATE POLICY "Super Admin see all subscriptions" ON subscriptions
FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- Invoices: Allow Super Admin
ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admin see all invoices" ON saas_invoices;
CREATE POLICY "Super Admin see all invoices" ON saas_invoices
FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- 4. GRANT PERMISSIONS (Just in case)
GRANT SELECT ON saas_metrics_dashboard TO authenticated;
GRANT SELECT ON saas_metrics_dashboard TO anon;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON saas_invoices TO authenticated;
