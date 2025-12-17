-- ========================================
-- REATIVAR RLS COM POLÍTICAS SEGURAS
-- ========================================
-- Execute este script DEPOIS de testar a aplicação

-- PASSO 1: Reativar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover TODAS as políticas antigas
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
END $$;

-- PASSO 3: Criar política SIMPLES e SEGURA
-- Esta política permite acesso total autenticado (sem recursão)
CREATE POLICY "users_authenticated_access" ON users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- PASSO 4: Verificar
SELECT 
    tablename, 
    policyname, 
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- Deve mostrar apenas 1 política:
-- - users_authenticated_access (FOR ALL, TO authenticated)
