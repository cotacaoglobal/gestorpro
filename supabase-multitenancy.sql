-- ============================================
-- GESTOR PRO - MIGRAÇÃO PARA MULTI-TENANCY
-- ============================================

-- 1. CRIAR TABELA DE TENANTS (ASSINANTES)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Identificador amigável (ex: padaria-joao)
  plan TEXT DEFAULT 'free', -- free, pro, enterprise
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRIAR TENANT PADRÃO PARA DADOS EXISTENTES
-- Isso garante que os dados atuais não fiquem órfãos (sem dono)
INSERT INTO tenants (name, slug, plan, status) 
VALUES ('Empresa Padrão', 'default', 'pro', 'active');

DO $$
DECLARE
  default_tenant_id UUID;
BEGIN
  SELECT id INTO default_tenant_id FROM tenants WHERE slug = 'default' LIMIT 1;

  -- 3. ADICIONAR COLUNA tenant_id NAS TABELAS EXISTENTES
  
  -- Users
  ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
  UPDATE users SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;

  -- Products
  ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
  UPDATE products SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;

  -- Sales
  ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
  UPDATE sales SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  ALTER TABLE sales ALTER COLUMN tenant_id SET NOT NULL;

  -- Cash Sessions
  ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
  UPDATE cash_sessions SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  ALTER TABLE cash_sessions ALTER COLUMN tenant_id SET NOT NULL;

  -- Cash Movements
  ALTER TABLE cash_movements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
  UPDATE cash_movements SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  ALTER TABLE cash_movements ALTER COLUMN tenant_id SET NOT NULL;

END $$;

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_tenant_id ON cash_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_tenant_id ON cash_movements(tenant_id);

-- 5. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- Habilitar RLS em tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Políticas para Tenants
-- Permitir leitura pública de tenants (necessário para login/verificação)
-- Em produção real, você deve restringir isso
CREATE POLICY "Enable read access for all users" ON tenants FOR SELECT USING (true);


-- ============================================
-- INSTRUÇÕES DE SEGURANÇA (RLS)
-- ============================================
-- Como estamos usando autenticação customizada (tabela users própria) e não Supabase Auth nativo,
-- o RLS do Postgres não consegue usar `auth.uid()` diretamente para filtrar `tenant_id`.
--
-- Por enquanto, a segurança do multi-tenancy será garantida na CAMADA DE APLICAÇÃO (Frontend/Backend Service),
-- garantindo que todas as queries filtrem por `tenant_id`.
--
-- Futuramente, para segurança nível banco de dados, devemos migrar para Supabase Auth.

-- ============================================
-- 6. FUNÇÃO RPC PARA REGISTRO DE TENANT
-- ============================================
-- Execute esta função para registrar uma nova empresa e seu dono atomicamente.

CREATE OR REPLACE FUNCTION register_tenant(
  owner_name TEXT,
  owner_email TEXT,
  owner_password TEXT,
  company_name TEXT,
  company_slug TEXT
) RETURNS JSON AS $$
DECLARE
  new_tenant_id UUID;
  new_user_id UUID;
BEGIN
  -- Verificar se slug já existe
  IF EXISTS (SELECT 1 FROM tenants WHERE slug = company_slug) THEN
    RETURN json_build_object('success', false, 'error', 'SLUG_TAKEN');
  END IF;

  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM users WHERE email = owner_email) THEN
    RETURN json_build_object('success', false, 'error', 'EMAIL_TAKEN');
  END IF;

  -- Criar Tenant
  INSERT INTO tenants (name, slug, plan, status)
  VALUES (company_name, company_slug, 'free', 'active')
  RETURNING id INTO new_tenant_id;

  -- Criar Usuário Admin Linked
  INSERT INTO users (tenant_id, name, email, password_hash, role)
  VALUES (new_tenant_id, owner_name, owner_email, owner_password, 'admin')
  RETURNING id INTO new_user_id;

  RETURN json_build_object(
    'success', true,
    'tenant_id', new_tenant_id,
    'user_id', new_user_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
