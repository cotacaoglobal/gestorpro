-- ==============================================================================
-- MIGRAÇÃO: INVALIDAR SENHAS EM TEXTO PLANO E PREPARAR MIGRAÇÃO SUPABASE AUTH
-- ==============================================================================
-- ⚠️ ATENÇÃO: Este script INVALIDA todas as senhas atuais!
-- Todos os usuários precisarão fazer reset de senha após migração para Supabase Auth.
-- ==============================================================================

-- STEP 1: Backup da tabela users (Segurança)
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users_backup_pre_auth_migration') THEN
        CREATE TABLE users_backup_pre_auth_migration AS 
        SELECT * FROM users;
        
        RAISE NOTICE 'Backup criado: users_backup_pre_auth_migration com % registros', 
            (SELECT COUNT(*) FROM users_backup_pre_auth_migration);
    ELSE
        RAISE NOTICE 'Backup já existe. Pulando criação.';
    END IF;
END $$;

-- STEP 2: Criar tabela de tokens de reset de senha
-- ==============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- STEP 3: Invalidar todas as senhas atuais
-- ==============================================================================
-- Senhas antigas são marcadas como "INVALIDATED_SUPABASE_AUTH_MIGRATION"
-- Isso força todos os usuários a fazer reset via Supabase Auth

UPDATE users 
SET password_hash = 'INVALIDATED_SUPABASE_AUTH_MIGRATION'
WHERE password_hash != 'INVALIDATED_SUPABASE_AUTH_MIGRATION';

-- Registrar quantas senhas foram invalidadas
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM users WHERE password_hash = 'INVALIDATED_SUPABASE_AUTH_MIGRATION';
    RAISE NOTICE '% senhas foram invalidadas e requerem reset', v_count;
END $$;

-- STEP 4: Preparar para Supabase Auth
-- ==============================================================================
-- Criar coluna para armazenar auth.uid() do Supabase Auth
-- (Isso linkará users.id com auth.users.id)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_user_id UUID UNIQUE;
        RAISE NOTICE 'Coluna auth_user_id adicionada à tabela users';
    ELSE
        RAISE NOTICE 'Coluna auth_user_id já existe';
    END IF;
END $$;

-- STEP 5: Criar função para sincronizar novo usuário Auth com tabela users
-- ==============================================================================
-- Esta função será chamada automaticamente quando um usuário fizer reset de senha

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um usuário do Auth for criado, vincular com tabela users
  UPDATE public.users
  SET auth_user_id = NEW.id
  WHERE email = NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que roda quando novo usuário é criado no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_users();

-- STEP 6: Criar view para facilitar queries (Opcional)
-- ==============================================================================
CREATE OR REPLACE VIEW users_with_auth AS
SELECT 
  u.*,
  CASE 
    WHEN u.auth_user_id IS NOT NULL THEN 'migrated'
    ELSE 'pending_migration'
  END as migration_status
FROM users u;

-- ==============================================================================
-- STEP 7: Instruções para o próximo passo
-- ==============================================================================
-- NOTA: Após rodar este script:
--
-- 1. Configurar Email Templates no Supabase (para password reset)
-- 2. Implementar tela de "Password Reset Request" no frontend
-- 3. Enviar email para todos os usuários informando sobre a migração
-- 4. Monitorar coluna `auth_user_id` - quando todos tiverem valor, migração completa
--
-- Comando para verificar progresso da migração:
-- SELECT 
--   COUNT(*) FILTER (WHERE auth_user_id IS NOT NULL) as migrated,
--   COUNT(*) FILTER (WHERE auth_user_id IS NULL) as pending,
--   COUNT(*) as total
-- FROM users;
-- ==============================================================================

-- ==============================================================================
-- ROLLBACK (caso algo dê errado - USAR COM CAUTELA!)
-- ==============================================================================
-- ATENÇÃO: Só use isso se precisar desfazer a migração!
--
-- DELETE FROM users;
-- INSERT INTO users SELECT * FROM users_backup_pre_auth_migration;
-- DROP TABLE users_backup_pre_auth_migration;
-- DROP TABLE password_reset_tokens;
-- ALTER TABLE users DROP COLUMN IF EXISTS auth_user_id;
-- ==============================================================================
