-- Script para configurar permissões RLS na tabela tenants
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tenants';

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Super admins can do anything" ON tenants;
DROP POLICY IF EXISTS "Tenants can view themselves" ON tenants;
DROP POLICY IF EXISTS "Enable read access for all users" ON tenants;

-- 3. Criar política para Super Admins terem acesso total
CREATE POLICY "Super admins have full access to tenants"
ON tenants
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);

-- 4. Criar política para usuários normais visualizarem apenas seu próprio tenant
CREATE POLICY "Users can view their own tenant"
ON tenants
FOR SELECT
USING (
    id IN (
        SELECT tenant_id FROM users
        WHERE users.id = auth.uid()
    )
);

-- 5. Habilitar RLS (se não estiver habilitado)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 6. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'tenants';

-- 7. Testar se as operações funcionam
-- (Você pode descomentar e executar após fazer login como super_admin)
-- UPDATE tenants SET status = 'suspended' WHERE slug = 'apae-maracanau';
-- SELECT * FROM tenants WHERE slug = 'apae-maracanau';
