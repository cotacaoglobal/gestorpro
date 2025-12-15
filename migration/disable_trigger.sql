-- Desabilitar Trigger temporariamente para migração
-- Execute isso no Supabase SQL Editor

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
