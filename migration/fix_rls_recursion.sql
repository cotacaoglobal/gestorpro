-- Fix para o erro de "Infinite Recursion" nas políticas RLS
-- Ocorre porque a política checava a tabela users, que ativava a política novamente.

-- 1. Criar função segura para verificar se é super admin
-- SECURITY DEFINER faz com que a função rode com permissões de quem criou (admin), ignorando RLS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN current_role = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recriar as políticas da tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can view all profiles" ON users;
CREATE POLICY "Super admins can view all profiles"
ON users FOR SELECT
USING (
  public.is_super_admin()
);

-- 3. Recriar política da tabela tenants (aproveitando a função)
DROP POLICY IF EXISTS "Super admins have full access to tenants" ON tenants;
CREATE POLICY "Super admins have full access to tenants"
ON tenants
FOR ALL
USING (
  public.is_super_admin()
);
