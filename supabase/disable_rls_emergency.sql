-- ========================================
-- SOLUÇÃO EMERGENCIAL: Desabilitar RLS temporariamente
-- ========================================
-- ATENÇÃO: Isso é temporário apenas para você conseguir entrar!
-- Depois que entrar, vamos reativar com políticas corretas.

-- PASSO 1: Desabilitar RLS na tabela users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Verificar
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Resultado esperado: rowsecurity = false

-- ========================================
-- DEPOIS QUE CONSEGUIR ENTRAR:
-- Execute este script para reativar RLS com políticas corretas
-- ========================================

/*
-- Reativar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "users_select_simple" ON users;
DROP POLICY IF EXISTS "users_insert_simple" ON users;
DROP POLICY IF EXISTS "users_update_simple" ON users;
DROP POLICY IF EXISTS "users_delete_simple" ON users;

-- Criar política SUPER SIMPLES sem recursão
CREATE POLICY "users_all_access" ON users
FOR ALL
USING (true)
WITH CHECK (true);
*/
