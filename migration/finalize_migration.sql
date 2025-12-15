-- 1. Reativar o Trigger de Sincronização
-- (Copia novos usuários do Auth para a tabela public.users)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, tenant_id) -- CORRIGIDO: tenant_id
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'operator'), 
    COALESCE(new.raw_user_meta_data->>'tenantId', NULL) -- Metadata ainda usa tenantId (vindo do frontend/script)
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Configurar RLS na tabela tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DROP POLICY IF EXISTS "Super admins have full access to tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;

-- Política para Super Admin (Verifica role na tabela users via auth.uid())
CREATE POLICY "Super admins have full access to tenants"
ON tenants
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);

-- Política para usuários comuns (Verifica tenant_id na tabela users via auth.uid())
CREATE POLICY "Users can view their own tenant"
ON tenants
FOR SELECT
USING (
    id = (
        SELECT tenant_id FROM users -- CORRIGIDO: tenant_id
        WHERE users.id = auth.uid()
    )
);

-- 3. Configurar RLS na tabela users (Proteção dos perfis)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can view all profiles" ON users;
CREATE POLICY "Super admins can view all profiles"
ON users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'super_admin'
    )
);
