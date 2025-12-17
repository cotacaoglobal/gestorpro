-- ==============================================================================
-- CORREÇÃO DEFINITIVA: ERRO DE RECURSÃO INFINITA (42P17)
-- ==============================================================================
-- O erro ocorre porque a política de segurança da tabela 'users' tenta ler
-- a própria tabela 'users' para verificar permissões, criando um loop infinito.
--
-- SOLUÇÃO: Criar funções de segurança (Security Definer) que bypassam o RLS
-- apenas para verificar as credenciais, quebrando o loop.
-- ==============================================================================

-- 1. Helper seguro para buscar dados do usuário atual (sem causar recursão)
-- SECURITY DEFINER: Executa com permissão de superusuário, ignorando RLS
CREATE OR REPLACE FUNCTION get_my_auth_data()
RETURNS TABLE (tenant_id UUID, role TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id, role FROM users WHERE id = auth.uid();
$$;

-- 2. Remover TODAS as políticas de leitura problemáticas anteriores
DROP POLICY IF EXISTS "users_select_same_tenant" ON users;
DROP POLICY IF EXISTS "users_read_own_profile" ON users;
DROP POLICY IF EXISTS "Enable all for anon" ON users;
-- Políticas criadas no passo anterior (nomes podem variar)
DROP POLICY IF EXISTS "users_select_same_tenant_v2" ON users;

-- 3. Criar NOVA política de LEITURA (SELECT) à prova de recursão
CREATE POLICY "users_read_clean_policy" ON users
FOR SELECT
USING (
    -- Regra 1: Usuário SEMPRE pode ler seus próprios dados (evita loop na raiz)
    id = auth.uid()
    OR
    -- Regra 2: Usuário pode ler outros do MESMO tenant (usando função segura)
    tenant_id = (SELECT tenant_id FROM get_my_auth_data())
    OR
    -- Regra 3: Super Admin pode ler tudo (usando função segura)
    (SELECT role FROM get_my_auth_data()) = 'super_admin'
);

-- 4. Atualizar política de UPDATE para usar a função segura
DROP POLICY IF EXISTS "users_update_self_only" ON users;
CREATE POLICY "users_update_safe_policy" ON users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  -- Garante consistência usando a função segura
  AND tenant_id = (SELECT tenant_id FROM get_my_auth_data())
  AND role = (SELECT role FROM get_my_auth_data())
);

-- 5. Atualizar política de DELETE para usar a função segura
DROP POLICY IF EXISTS "users_delete_admin_only" ON users;
CREATE POLICY "users_delete_safe_policy" ON users
FOR DELETE
USING (
  (SELECT role FROM get_my_auth_data()) = 'admin'
  AND tenant_id = (SELECT tenant_id FROM get_my_auth_data())
  AND id != auth.uid()
);

-- 6. Atualizar política de INSERT
DROP POLICY IF EXISTS "users_insert_admin_only" ON users;
CREATE POLICY "users_insert_safe_policy" ON users
FOR INSERT
WITH CHECK (
  (SELECT role FROM get_my_auth_data()) = 'admin'
  AND tenant_id = (SELECT tenant_id FROM get_my_auth_data())
);
