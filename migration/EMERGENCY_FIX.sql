-- CORREÇÃO DE EMERGÊNCIA - REMOVE RECURSÃO INFINITA
-- Execute isso IMEDIATAMENTE para restaurar o acesso

-- 1. Remover a política problemática da tabela users
DROP POLICY IF EXISTS "Users can view own profile and tenant members if active" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- 2. Criar política SIMPLES na tabela users (SEM is_tenant_active, SEM recursão)
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- 3. A função is_tenant_active() continua válida para OUTRAS tabelas (products, sales, etc)
-- Ela só causa problema quando usada na policy da própria tabela users

-- 4. Garantir que Super Admin vê todos os usuários
DROP POLICY IF EXISTS "Super admins can view all profiles" ON users;
CREATE POLICY "Super admins can view all profiles"
ON users FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);
