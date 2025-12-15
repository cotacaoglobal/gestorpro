-- Script de Correção Robusta para Visibilidade do Super Admin

-- 1. Garantir que os dados da coluna role estejam limpos (sem espaços extras)
UPDATE public.users 
SET role = TRIM(role)
WHERE role IS NOT NULL;

-- 2. Atualizar a função is_super_admin para ser mais segura e robusta
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role text;
BEGIN
  -- Verificar se auth.uid() é nulo
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO current_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Comparação insensível a maiúsculas/minúsculas e sem espaços
  RETURN TRIM(LOWER(current_role)) = 'super_admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recriar a política de tenants para garantir que está usando a nova função
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins have full access to tenants" ON tenants;

CREATE POLICY "Super admins have full access to tenants"
ON tenants
FOR ALL
USING (
  public.is_super_admin() = true
);

-- 4. Verificação (apenas para debug no SQL Editor)
SELECT count(*) as total_tenants FROM tenants;
