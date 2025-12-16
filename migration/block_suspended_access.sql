-- BLOQUEIO TOTAL DE TENANTS SUSPENSOS
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
DROP POLICY IF EXISTS "View products" ON products; -- Remove antiga se houver nome diferente, ajuste conforme necessário
create policy "Tenants can view own products if active"
on products for select
using (
  tenant_id = (select tenant_id from users where id = auth.uid())
  AND public.is_tenant_active()
);

-- SALES
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
create policy "Tenants can view own sales if active"
on sales for select
using (
  tenant_id = (select tenant_id from users where id = auth.uid())
  AND public.is_tenant_active()
);

-- CASH SESSIONS
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
create policy "Tenants can view own sessions if active"
on cash_sessions for select
using (
  tenant_id = (select tenant_id from users where id = auth.uid())
  AND public.is_tenant_active()
);

-- CASH MOVEMENTS
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
create policy "Tenants can view own movements if active"
on cash_movements for select
using (
  tenant_id = (select tenant_id from users where id = auth.uid())
  AND public.is_tenant_active()
);

-- SAAS INVOICES (Se houver)
ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;
create policy "Tenants can view own invoices if active"
on saas_invoices for select
using (
  tenant_id = (select tenant_id from users where id = auth.uid())
  AND public.is_tenant_active()
);

-- CLIENTES / USERS (Para listagem de usuários do tenant)
-- Super Admins continuam vendo tudo pela policy 'Super admins can view all profiles' definida anteriormente
DROP POLICY IF EXISTS "Users can view own profile" ON users;
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
