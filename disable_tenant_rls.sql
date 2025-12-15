-- Script para DESABILITAR RLS na tabela tenants
-- Execute este script no SQL Editor do Supabase para restaurar o acesso

-- 1. Desabilitar RLS completamente
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas
DROP POLICY IF EXISTS "Super admins have full access to tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;

-- 3. Verificar se funcionou
SELECT * FROM tenants ORDER BY created_at DESC;

-- IMPORTANTE: Com RLS desabilitado, qualquer usuário autenticado pode ver/modificar tenants.
-- Isso é aceitável para um painel de Super Admin, mas em produção você deve:
-- 1. Usar a Service Role Key (opção 2 que mostrei antes), OU
-- 2. Implementar autenticação Supabase Auth adequada
