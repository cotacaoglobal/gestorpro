-- Script para adicionar coluna 'status' na tabela tenants
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna status (se não existir)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Adicionar constraint para validar valores permitidos
ALTER TABLE tenants 
DROP CONSTRAINT IF EXISTS tenants_status_check;

ALTER TABLE tenants 
ADD CONSTRAINT tenants_status_check 
CHECK (status IN ('active', 'suspended', 'cancelled'));

-- 3. Atualizar registros existentes que não têm status
UPDATE tenants 
SET status = 'active' 
WHERE status IS NULL;

-- 4. Verificar resultado
SELECT id, name, slug, plan, status, created_at 
FROM tenants 
ORDER BY created_at DESC;
