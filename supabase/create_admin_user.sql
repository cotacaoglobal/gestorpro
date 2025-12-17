-- ========================================
-- SCRIPT: Criar Usuário Admin Completo
-- ========================================
-- Este script cria um usuário funcional com Supabase Auth

-- PASSO 1: Criar usuário no Supabase Auth PRIMEIRO
-- Vá em: https://supabase.com/dashboard/project/vdhqdhaqlotbrqggkird/auth/users
-- Clique em "Add user" → "Create new user"
-- Email: admin@gestorpro.com
-- Password: Admin@123456
-- Auto Confirm User: SIM (marque esta opção!)
-- Copie o UUID gerado

-- PASSO 2: Criar/Atualizar tenant
INSERT INTO tenants (id, name, slug, plan, status)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Gestor Pro Admin',
  'gestor-pro-admin',
  'free',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = 'active';

-- PASSO 3: Inserir usuário na tabela users
-- SUBSTITUA 'UUID_DO_SUPABASE_AUTH' pelo UUID que você copiou
INSERT INTO users (id, tenant_id, name, email, role, password_hash, avatar)
VALUES (
  '9665da86-7606-405a-a3fa-8ab8e0958cc5', -- ← COLE O UUID AQUI
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Administrador',
  'admin@gestorpro.com',
  'super_admin',
  '', -- Vazio porque a senha é gerenciada pelo Supabase Auth
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- PASSO 4: Criar subscription ativa
INSERT INTO subscriptions (id, tenant_id, plan_id, status, started_at, expires_at, auto_renew)
SELECT 
  gen_random_uuid(),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  (SELECT id FROM saas_plans WHERE slug = 'free' LIMIT 1),
  'active',
  NOW(),
  NOW() + INTERVAL '365 days',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

-- ========================================
-- VERIFICAÇÃO
-- ========================================
-- Execute estas queries para verificar:

-- 1. Verificar tenant
SELECT * FROM tenants WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 2. Verificar usuário
SELECT * FROM users WHERE email = 'admin@gestorpro.com';

-- 3. Verificar subscription
SELECT * FROM subscriptions WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ========================================
-- CREDENCIAIS DE LOGIN
-- ========================================
-- Email: admin@gestorpro.com
-- Senha: Admin@123456
-- Role: super_admin
