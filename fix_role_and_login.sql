-- SOLUÇÃO COMPLETA: AJUSTE DE ROLE + INSERT + LOGIN
-- Execute tudo de uma vez no SQL Editor.

-- 1. ATUALIZA A REGRA DE CARGOS (Permite 'super_admin')
-- O erro anterior aconteceu porque o banco não conhecia o cargo 'super_admin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'operator', 'super_admin'));

-- 2. INSERE O USUÁRIO MASTER
-- Copia o tenant_id de um usuário existente para evitar erro de chave estrangeira
INSERT INTO users (tenant_id, name, email, password_hash, role)
SELECT 
    tenant_id, 
    'Agencia BR Master',
    'agenciabr.site@gmail.com',
    '23171304vvwL@',
    'super_admin'
FROM users
LIMIT 1;

-- 3. CRIA A FUNÇÃO DE LOGIN SEGURA
CREATE OR REPLACE FUNCTION login_user(input_email TEXT, input_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT row_to_json(u) INTO result
  FROM users u
  WHERE u.email = input_email 
  AND u.password_hash = input_password;
  RETURN result;
END;
$$;

-- 4. PERMISSÕES PARA O FRONTEND USAR A FUNÇÃO
GRANT EXECUTE ON FUNCTION login_user TO anon;
GRANT EXECUTE ON FUNCTION login_user TO authenticated;
GRANT EXECUTE ON FUNCTION login_user TO service_role;
