-- ==============================================================================
-- CORREÇÃO CRÍTICA: RLS POLICIES PARA ISOLAMENTO MULTI-TENANT
-- Execute este script no Supabase SQL Editor
-- ==============================================================================
-- IMPORTANTE: Este script assume uso de Supabase Auth nativo com auth.uid()
-- ==============================================================================

-- 1. REMOVER POLÍTICAS PERIGOSAS ABERTAS
DROP POLICY IF EXISTS "Enable all for anon" ON users;
DROP POLICY IF EXISTS "Enable all for anon" ON products;
DROP POLICY IF EXISTS "Enable all for anon" ON sales;
DROP POLICY IF EXISTS "Enable all for anon" ON cash_sessions;
DROP POLICY IF EXISTS "Enable all for anon" ON cash_movements;
DROP POLICY IF EXISTS "Public read tenants" ON tenants;
DROP POLICY IF EXISTS "Enable read access for all users" ON tenants;

-- 2. GARANTIR QUE RLS ESTEJA HABILITADO
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. POLÍTICAS PARA TABELA USERS
-- ==============================================================================

-- 3.1 SELECT: Usuário vê apenas usuários do mesmo tenant (ou super admin vê todos)
DROP POLICY IF EXISTS "users_select_same_tenant" ON users;
CREATE POLICY "users_select_same_tenant"
ON users FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR 
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- 3.2 INSERT: Admin pode criar operadores no seu tenant
DROP POLICY IF EXISTS "users_insert_admin_only" ON users;
CREATE POLICY "users_insert_admin_only"
ON users FOR INSERT
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- 3.3 UPDATE: Usuário pode atualizar apenas si mesmo (sem mudar role/tenant_id)
DROP POLICY IF EXISTS "users_update_self_only" ON users;
CREATE POLICY "users_update_self_only"
ON users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND role = (SELECT role FROM users WHERE id = auth.uid())
);

-- 3.4 DELETE: Apenas admin pode deletar usuários do próprio tenant
DROP POLICY IF EXISTS "users_delete_admin_only" ON users;
CREATE POLICY "users_delete_admin_only"
ON users FOR DELETE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND id != auth.uid() -- Não pode deletar a si mesmo
);

-- ==============================================================================
-- 4. POLÍTICAS PARA TABELA PRODUCTS
-- ==============================================================================

DROP POLICY IF EXISTS "products_tenant_isolation" ON products;
CREATE POLICY "products_tenant_isolation"
ON products FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- ==============================================================================
-- 5. POLÍTICAS PARA TABELA SALES
-- ==============================================================================

DROP POLICY IF EXISTS "sales_tenant_isolation" ON sales;
CREATE POLICY "sales_tenant_isolation"
ON sales FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- ==============================================================================
-- 6. POLÍTICAS PARA TABELA CASH_SESSIONS
-- ==============================================================================

DROP POLICY IF EXISTS "cash_sessions_tenant_isolation" ON cash_sessions;
CREATE POLICY "cash_sessions_tenant_isolation"
ON cash_sessions FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- ==============================================================================
-- 7. POLÍTICAS PARA TABELA CASH_MOVEMENTS
-- ==============================================================================

DROP POLICY IF EXISTS "cash_movements_tenant_isolation" ON cash_movements;
CREATE POLICY "cash_movements_tenant_isolation"
ON cash_movements FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- ==============================================================================
-- 8. POLÍTICAS PARA TABELA TENANTS
-- ==============================================================================

-- 8.1 SELECT: Tenants podem ver apenas a si mesmos, Super Admin vê todos
DROP POLICY IF EXISTS "tenants_select_own_or_super_admin" ON tenants;
CREATE POLICY "tenants_select_own_or_super_admin"
ON tenants FOR SELECT
USING (
  id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- 8.2 UPDATE: Apenas Super Admin pode modificar tenants
DROP POLICY IF EXISTS "tenants_update_super_admin_only" ON tenants;
CREATE POLICY "tenants_update_super_admin_only"
ON tenants FOR UPDATE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- 8.3 DELETE: Apenas Super Admin pode deletar tenants
DROP POLICY IF EXISTS "tenants_delete_super_admin_only" ON tenants;
CREATE POLICY "tenants_delete_super_admin_only"
ON tenants FOR DELETE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- ==============================================================================
-- 9. POLÍTICAS ESPECIAIS: SaaS Admin Tables
-- ==============================================================================

-- 9.1 SaaS Plans: Leitura pública de planos ativos
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saas_plans_public_read" ON saas_plans;
CREATE POLICY "saas_plans_public_read"
ON saas_plans FOR SELECT
USING (active = true);

-- 9.2 Subscriptions: Ver apenas própria assinatura
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_own_or_super_admin" ON subscriptions;
CREATE POLICY "subscriptions_own_or_super_admin"
ON subscriptions FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- 9.3 Invoices: Ver apenas próprias faturas
ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_own_or_super_admin" ON saas_invoices;
CREATE POLICY "invoices_own_or_super_admin"
ON saas_invoices FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- ==============================================================================
-- 10. VALIDAÇÃO (Opcional - Verificar se políticas foram criadas)
-- ==============================================================================
-- Execute em nova query para verificar:
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';

-- ==============================================================================
-- FIM DA CORREÇÃO CRÍTICA
-- ==============================================================================
