-- Script para criar usuário manualmente no banco

-- PASSO 1: Obter o UUID do usuário do Supabase Auth
-- Vá em: https://supabase.com/dashboard/project/vdhqdhaqlotbrqggkird/auth/users
-- Copie o UUID do usuário "padaria@gmail.com"

-- PASSO 2: Criar tenant (se não existir)
INSERT INTO tenants (id, name, slug, plan, status)
VALUES (
  '11111111-1111-1111-1111-111111111111', -- ID temporário do tenant
  'Padaria Flix',
  'padaria-flix',
  'free',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- PASSO 3: Criar usuário na tabela users
-- SUBSTITUA 'UUID_DO_AUTH' pelo UUID real do usuário
INSERT INTO users (id, tenant_id, name, email, role, password_hash)
VALUES (
  'UUID_DO_AUTH', -- COLE AQUI o UUID do Supabase Auth
  '11111111-1111-1111-1111-111111111111',
  'Joao Silva',
  'padaria@gmail.com',
  'admin',
  'MANAGED_BY_SUPABASE_AUTH'
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- PASSO 4: Criar subscription (opcional, para evitar bloqueio)
INSERT INTO subscriptions (id, tenant_id, plan_id, status, started_at, expires_at, auto_renew)
SELECT 
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM saas_plans WHERE slug = 'free' LIMIT 1),
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
);
