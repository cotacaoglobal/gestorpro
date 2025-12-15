-- SOLUÇÃO DEFINITIVA DE LOGIN
-- Execute este script completo para garantir o acesso.

-- 1. Forçar a senha e role do usuário (Garante que não há erro de digitação ou espaços)
UPDATE users
SET 
    password_hash = '23171304vvwL@',  -- Senha exata informada
    role = 'super_admin',
    email = 'agenciabr.site@gmail.com' -- Garante casing correto
WHERE email = 'agenciabr.site@gmail.com';

-- 2. Recriar função de login com permissões explícitas
DROP FUNCTION IF EXISTS login_user;

CREATE OR REPLACE FUNCTION login_user(input_email TEXT, input_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Ignora RLS
SET search_path = public -- Segurança
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

-- 3. Garantir permissão de execução (Crítico para funcionar via API)
GRANT EXECUTE ON FUNCTION login_user TO anon;
GRANT EXECUTE ON FUNCTION login_user TO authenticated;
GRANT EXECUTE ON FUNCTION login_user TO service_role;
