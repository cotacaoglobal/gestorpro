-- FIX FINAL DE PERMISSÕES E DADOS DO USUÁRIO
-- 1. Garante que existe um tenant padrão
INSERT INTO tenants (name, slug, plan, status) 
VALUES ('Empresa Padrão', 'default', 'pro', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 2. Pega o ID desse tenant
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'default';

  -- 3. Atualiza o usuário Super Admin com TUDO correto (Tenant, Role, Senha)
  UPDATE users
  SET 
    tenant_id = v_tenant_id,
    role = 'super_admin',
    password_hash = '23171304vvwL@', -- Senha exata
    email = 'agenciabr.site@gmail.com'
  WHERE email = 'agenciabr.site@gmail.com';
  
END $$;

-- 4. Função de Login Ultra-Permissiva (Debug)
DROP FUNCTION IF EXISTS login_user;

CREATE OR REPLACE FUNCTION login_user(input_email TEXT, input_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Tenta achar match exato
  SELECT row_to_json(u) INTO result
  FROM users u
  WHERE u.email = input_email 
  AND u.password_hash = input_password;

  RETURN result;
END;
$$;

-- 5. Concede permissões públicas para a função
GRANT EXECUTE ON FUNCTION login_user TO anon;
GRANT EXECUTE ON FUNCTION login_user TO authenticated;
GRANT EXECUTE ON FUNCTION login_user TO service_role;
