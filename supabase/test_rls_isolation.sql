-- ==============================================================================
-- SCRIPT DE TESTE: Verificação de Isolamento Multi-Tenant
-- Execute este script para validar que as políticas RLS estão funcionando
-- ==============================================================================

-- 1. CRIAR DOIS TENANTS DE TESTE
INSERT INTO tenants (id, name, slug, plan, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tenant A Test', 'tenant-a', 'free', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Tenant B Test', 'tenant-b', 'free', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. CRIAR USUÁRIOS DE TESTE (via Supabase Auth primeiro, depois linkar)
-- NOTA: Você precisa criar os usuários via Supabase Auth UI primeiro
-- Depois execute este script para linkar aos tenants

-- Assumindo que você criou usuários com IDs específicos:
-- User A: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- User B: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

INSERT INTO users (id, tenant_id, name, email, role, password_hash) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'User A', 'usera@test.com', 'admin', 'MANAGED_BY_SUPABASE_AUTH'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'User B', 'userb@test.com', 'admin', 'MANAGED_BY_SUPABASE_AUTH')
ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id;

-- 3. CRIAR PRODUTOS DE TESTE
INSERT INTO products (id, tenant_id, name, category, price_sell, price_cost, stock, min_stock) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Produto A1', 'Categoria A', 10.00, 5.00, 100, 10),
  ('aaaaaaaa-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'Produto A2', 'Categoria A', 20.00, 10.00, 50, 5),
  ('bbbbbbbb-0001-0001-0001-000000000001', '22222222-2222-2222-2222-222222222222', 'Produto B1', 'Categoria B', 15.00, 7.50, 75, 8),
  ('bbbbbbbb-0002-0002-0002-000000000002', '22222222-2222-2222-2222-222222222222', 'Produto B2', 'Categoria B', 25.00, 12.50, 30, 3)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- TESTES DE ISOLAMENTO
-- ==============================================================================

-- TESTE 1: Verificar que cada tenant vê apenas seus produtos
-- Execute como User A (tenant A)
SET LOCAL "request.jwt.claims" = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
SELECT id, name, tenant_id FROM products;
-- ESPERADO: Apenas produtos com tenant_id = '11111111-1111-1111-1111-111111111111'

-- Execute como User B (tenant B)
SET LOCAL "request.jwt.claims" = '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';
SELECT id, name, tenant_id FROM products;
-- ESPERADO: Apenas produtos com tenant_id = '22222222-2222-2222-2222-222222222222'

-- TESTE 2: Tentar deletar produto de outro tenant (DEVE FALHAR)
-- User A tentando deletar produto do Tenant B
SET LOCAL "request.jwt.claims" = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
DELETE FROM products WHERE id = 'bbbbbbbb-0001-0001-0001-000000000001';
-- ESPERADO: 0 rows affected (RLS bloqueou)

-- Verificar que produto ainda existe
SELECT id, name FROM products WHERE id = 'bbbbbbbb-0001-0001-0001-000000000001';
-- ESPERADO: 1 row (produto não foi deletado)

-- TESTE 3: Deletar produto do próprio tenant (DEVE FUNCIONAR)
SET LOCAL "request.jwt.claims" = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
DELETE FROM products WHERE id = 'aaaaaaaa-0002-0002-0002-000000000002';
-- ESPERADO: 1 row affected

-- Verificar que produto foi deletado
SELECT id, name FROM products WHERE id = 'aaaaaaaa-0002-0002-0002-000000000002';
-- ESPERADO: 0 rows

-- ==============================================================================
-- LIMPEZA (Opcional - executar após testes)
-- ==============================================================================

-- Remover dados de teste
DELETE FROM products WHERE tenant_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM users WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM tenants WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- ==============================================================================
-- RESULTADO ESPERADO
-- ==============================================================================
-- ✅ Cada tenant vê apenas seus próprios dados
-- ✅ Não é possível deletar dados de outro tenant
-- ✅ É possível deletar dados do próprio tenant
-- ❌ Se qualquer teste falhar, as políticas RLS precisam ser revisadas
