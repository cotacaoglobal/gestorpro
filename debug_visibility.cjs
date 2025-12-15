const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carrega variáveis de ambiente
const envPath = path.resolve(__dirname, '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
}

// Usar Service Role para ver a "verdade" do banco
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error("❌ Erro: VITE_SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
    console.log('🔍 Iniciando diagnóstico...\n');

    // 1. Check Tenants count
    console.log('--- TABELA: TENANTS ---');
    const { data: tenants, error: tErr } = await supabase.from('tenants').select('*');
    if (tErr) console.error('Error fetching tenants:', tErr);
    else {
        console.log(`Total de tenants encontrados: ${tenants.length}`);
        console.table(tenants.map(t => ({ id: t.id, name: t.name, status: t.status })));
    }

    // 2. Check Users
    console.log('\n--- TABELA: PUBLIC.USERS ---');
    const { data: users, error: uErr } = await supabase.from('users').select('id, email, role, tenant_id');
    if (uErr) console.error('Error fetching users:', uErr);
    else {
        console.log(`Total de usuários encontrados: ${users.length}`);
        console.table(users);
    }

    // 3. Check Auth Users (Compare IDs)
    console.log('\n--- AUTH.USERS (Via Admin API) ---');
    const { data: { users: authUsers }, error: aErr } = await supabase.auth.admin.listUsers();
    if (aErr) console.error('Error fetching auth users:', aErr);
    else {
        console.log(`Total de usuários no Auth: ${authUsers.length}`);

        console.log('\n--- COMPARAÇÃO DE IDs (Auth vs Public) ---');
        authUsers.forEach(au => {
            const publicUser = users?.find(pu => pu.email === au.email);
            const match = publicUser ? (publicUser.id === au.id ? '✅ OK' : '❌ MISMATCH') : '⚠️ MISSING IN PUBLIC';
            console.log(`Email: ${au.email.padEnd(30)} | AuthID: ${au.id} | PublicID: ${publicUser?.id || 'N/A'} | Status: ${match}`);
        });

        // Check reversed (Public users not in Auth? Shouldn't happen if migrated correctly)
    }
}

diagnose();
