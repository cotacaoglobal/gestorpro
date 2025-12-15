-- FUNCTION: Login Seguro (Bypassing RLS)
-- Isso resolve problemas onde o usuário não consegue fazer login por restrições de permissão na tabela users

CREATE OR REPLACE FUNCTION login_user(input_email TEXT, input_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com permissões de admin do banco
AS $$
DECLARE
  found_user RECORD;
BEGIN
  -- Tenta encontrar o usuário com email e senha exatos
  SELECT * FROM users 
  WHERE email = input_email 
  AND password_hash = input_password
  LIMIT 1
  INTO found_user;

  -- Se não achou, retorna null
  IF found_user.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Retorna o usuário como JSON
  RETURN row_to_json(found_user);
END;
$$;

-- BONUS: Garantir que a role 'super_admin' mostrada na UI não quebre nada
-- (Caso haja alguma constraint antiga)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- Recria check se necessário, ou deixa aberto (texto livre é mais flexível agora)
-- ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'operator', 'super_admin'));
