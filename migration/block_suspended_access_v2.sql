-- BLOQUEIO TOTAL DE TENANTS SUSPENSOS (CORRIGIDO)
-- Atualiza as políticas de todas as tabelas para exigir que o tenant esteja ativo via is_tenant_active()

-- 1. Helper Function (Re-garantindo que ela existe e é performática)
CREATE OR REPLACE FUNCTION public.is_tenant_active()
RETURNS BOOLEAN AS $$
DECLARE
  v_status text;
  v_tenant_id uuid;
BEGIN
  -- Se for Super Admin (via metadata), sempre permita
  IF (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Busca tenant_id do usuário
  SELECT tenant_id INTO v_tenant_id
  FROM public.users
  WHERE id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RETURN TRUE; -- Sem tenant (ou erro de cadastro), deixa RLS padrão decidir
  END IF;

  -- Busca status
  SELECT status INTO v_status
  FROM public.tenants
  WHERE id = v_tenant_id;
  
  RETURN v_status = 'active'; -- Retorna TRUE apenas se estiver ativo
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Atualizar Políticas das Tabelas Principais

-- PRODUCTS
-- Removemos a política antiga se existir para evitar duplicidade ou conflito
-- (O nome pode variar, então o ideal é dropar pelo nome que criamos antes ou ignorar erro)
DROP POLICY IF EXISTS "Tenants can view own products if active" ON products;
DROP POLICY IF EXISTS "View products" ON products; 

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own products if active"
ON products FOR SELECT
USING (
  tenant_id = (select tenant_id from users where id = auth.uid())
  AND public.is_tenant_active()
);

-- SALES
DROP POLICY IF EXISTS "Tenants can view own sales if active" ON sales;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own sales if active"
ON sales FOR SELECT
USING (
  tenant_id = (select tenant_id from users where id = auth.uid())
  AND public.is_tenant_active()
);

-- CASH SESSIONS
DROP POLICY IF EXISTS "Tenants can view own sessions if active" ON cash_sessions;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own sessions if active"
ON cash_sessions FOR SELECT
USING (
  tenant_id = (select tenant_id from users where id = auth.uid())
  AND public.is_tenant_active()
);

-- CASH MOVEMENTS
DROP POLICY IF EXISTS "Tenants can view own movements if active" ON cash_movements;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own movements if active"
ON cash_movements FOR SELECT
USING (
  tenant_id = (select tenant_id from users where id = auth.uid())
  AND public.is_tenant_active()
);

-- CLIENTES / USERS (Para listagem de usuários do tenant)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile and tenant members if active" ON users;

CREATE POLICY "Users can view own profile and tenant members if active" 
ON users FOR SELECT 
USING (
  (
    auth.uid() = id OR tenant_id = (select tenant_id from public.users where id = auth.uid())
  )
  AND 
  (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    OR
    public.is_tenant_active()
  )
);
