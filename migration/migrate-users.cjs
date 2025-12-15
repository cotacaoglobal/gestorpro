const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carrega variáveis de ambiente
const envPath = path.resolve(__dirname, '../.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error('❌ ERRO CRÍTICO: VITE_SUPABASE_SERVICE_ROLE_KEY não encontrada no arquivo .env.local');
    console.log('👉 Por favor, adicione a chave Service Role (secret) ao seu .env.local para executar a migração.');
    console.log('   Você encontra essa chave no Dashboard do Supabase > Project Settings > API');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateUsers() {
    console.log('🚀 Iniciando migração de usuários...\n');

    // 1. Buscar usuários existentes na tabela public.users
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        return;
    }

    console.log(`📋 Encontrados ${users.length} usuários para migrar.`);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
        console.log(`\nProcessing: ${user.email}`);

        // Verificar se usuário já existe no Auth
        // Infelizmente admin.listUsers não filtra por email facilmente, então tentamos criar
        // Se falhar por duplicidade, sabemos que já existe.
        
        try {
            const { data, error: createError } = await supabase.auth.admin.createUser({
                id: user.id, // IMPORTANTE: Manter o mesmo ID
                email: user.email,
                password: user.password_hash, // Usando a senha original (texto plano)
                email_confirm: true,
                user_metadata: {
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId
                }
            });

            if (createError) {
                if (createError.message.includes('already been registered')) {
                     console.log('⚠️ Usuário já existe no Auth (pulando).');
                } else {
                    console.error(`❌ Falha ao criar usuário: ${createError.message}`);
                    failCount++;
                }
            } else {
                console.log(`✅ Usuário migrado com sucesso: ${user.email} (ID: ${user.id})`);
                successCount++;
            }

        } catch (err) {
            console.error(`💥 Erro inesperado: ${err.message}`);
            failCount++;
        }
    }

    console.log('\n-----------------------------------');
    console.log(`🏁 Migração finalizada!`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Falhas: ${failCount}`);
    console.log('-----------------------------------');
}

migrateUsers();
