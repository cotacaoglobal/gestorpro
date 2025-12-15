-- Execute este comando no SQL Editor do Supabase para promover seu usuário
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'agenciabr.site@gmail.com';
