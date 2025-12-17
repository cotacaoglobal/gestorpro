-- ==============================================================================
-- TRIGGER: Criar entry na tabela users quando usuário se registra via Auth
-- ==============================================================================
-- Este trigger vincula automaticamente auth.users com public.users
--==============================================================================

-- Função que roda quando novo usuário é criado no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir na tabela public.users quando usuário se cadastra
  INSERT INTO public.users (id, email, name, role, password_hash, tenant_id, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    'MANAGED_BY_SUPABASE_AUTH', -- Placeholder (Auth gerencia senhas)
    NULL, -- Será atualizado depois que tenant for criado
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função após INSERT em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- SUCESSO!
-- ==============================================================================
-- Agora, quando alguém se cadastrar via supabase.auth.signUp():
-- 1. Usuário é criado em auth.users (Supabase Auth)
-- 2. Trigger cria entry correspondente em public.users
-- 3. Aplicação atualiza tenant_id depois de criar tenant
-- ==============================================================================
