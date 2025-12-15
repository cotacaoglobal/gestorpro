-- SOLUÇÃO DEFINITIVA PARA RLS (USANDO METADATA DO JWT)
-- Evita recursão infinita pois não consulta tabelas, olha direto no token do usuário.

-- 1. Tenants: Super Admin vê tudo, Outros veem só o seu
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins have full access to tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;

-- Política Super Admin (Baseada no Metadata do JWT - Rápido e Sem Recursão)
CREATE POLICY "Super admins have full access to tenants"
ON tenants
FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Política Usuários Comuns (Baseada no Metadata do JWT - TenantID)
-- Se o tenantId estiver no metadata, usamos ele. 
-- Se não, fallback para consulta na tabela users (mas só se não for super admin)
CREATE POLICY "Users can view their own tenant"
ON tenants
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') != 'super_admin' -- Não aplica se for super admin
  AND 
  id::text = (auth.jwt() -> 'user_metadata' ->> 'tenantId') -- Verifica ID do metadata
);

-- NOTA: Se o tenantId não estiver no metadata de users antigos, 
-- precisamos de uma política de fallback ou garantir que o metadata esteja atualizado.
-- Pelo seu print, o metadata TEM 'role', mas não vi 'tenantId' no print do Super Admin.
-- Vamos adicionar uma política de fallback segura para usuários comuns:

CREATE POLICY "Users can view their own tenant (Fallback)"
ON tenants
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') != 'super_admin'
  AND
  id = (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);


-- 2. Users: Proteção de Perfil
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON users;

CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles"
ON users FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);
