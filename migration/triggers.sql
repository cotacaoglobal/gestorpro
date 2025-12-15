-- Trigger para sincronizar novos usuários do Supabase Auth com a tabela public.users
-- Execute este script no Supabase SQL Editor

-- 1. Criar função que manipula o novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Tenta inserir na tabela public.users
  -- Se o ID já existir (caso da migração), faz apenas update do email se necessário
  INSERT INTO public.users (id, email, name, role, "tenantId")
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'operator'), 
    COALESCE(new.raw_user_meta_data->>'tenantId', NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email; -- Mantém os outros dados existentes

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
