-- ========================================
-- FIX: Remover recursão infinita nas políticas RLS
-- ========================================

-- PASSO 1: Remover TODAS as políticas da tabela users
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;

-- PASSO 2: Criar políticas SIMPLES sem recursão

-- SELECT: Usuários podem ver outros usuários do mesmo tenant
CREATE POLICY "users_select_simple" ON users
FOR SELECT
USING (
  auth.uid() = id  -- Pode ver a si mesmo
  OR
  tenant_id IN (  -- Ou usuários do mesmo tenant
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
);

-- INSERT: Apenas super_admin pode criar usuários
CREATE POLICY "users_insert_simple" ON users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
  OR
  auth.uid() = id  -- Permite criar o próprio registro (signup)
);

-- UPDATE: Usuários podem atualizar a si mesmos, admins podem atualizar do mesmo tenant
CREATE POLICY "users_update_simple" ON users
FOR UPDATE
USING (
  auth.uid() = id  -- Pode atualizar a si mesmo
  OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND tenant_id = users.tenant_id
  )
);

-- DELETE: Apenas admins podem deletar usuários do mesmo tenant
CREATE POLICY "users_delete_simple" ON users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND tenant_id = users.tenant_id
  )
);

-- ========================================
-- VERIFICAÇÃO
-- ========================================
-- Execute para verificar as políticas:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';
