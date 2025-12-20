-- ==============================================================================
-- CORREÇÃO: PERMISSÕES DE REGISTRO (RLS)
-- Este script permite que novos usuários criem seu tenant e perfil durante o registro.
-- Execute este script no SQL Editor do Supabase.
-- ==============================================================================

-- 1. Permissões para a tabela 'tenants'
-- ------------------------------------------------------------------------------

-- Permitir que usuários autenticados (recém-registrados) criem um novo tenant
DROP POLICY IF EXISTS "Allow authenticated users to insert tenants" ON tenants;
CREATE POLICY "Allow authenticated users to insert tenants"
ON tenants FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir leitura pública dos tenants
-- Necessário para o checkout do slug e para que o retorno do INSERT (.select()) funcione
DROP POLICY IF EXISTS "tenants_public_select" ON tenants;
CREATE POLICY "tenants_public_select"
ON tenants FOR SELECT
TO public
USING (true);

-- 2. Permissões para a tabela 'users'
-- ------------------------------------------------------------------------------

-- Permitir que o usuário insira seu próprio perfil público durante o registro
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON users;
CREATE POLICY "Allow users to insert their own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Permitir que o usuário atualize seu próprio perfil
-- (Exemplo: quando o sistema vincula o tenant_id após a criação do tenant)
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;
CREATE POLICY "Allow users to update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Garantir que as tabelas tenham RLS habilitado
-- ------------------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- FIM DO SCRIPT DE CORREÇÃO
-- ==============================================================================
