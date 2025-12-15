const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function run() {
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) env[key.trim()] = value.trim();
        });

        const supabaseUrl = env.VITE_SUPABASE_URL;
        const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

        console.log('Testing connection to:', supabaseUrl);
        const supabase = createClient(supabaseUrl, supabaseKey);

        const email = 'agenciabr.site@gmail.com';
        const password = '23171304vvwL@';

        console.log(`\n🔍 checking RPC login_user for ${email}...`);
        const { data: rpcData, error: rpcError } = await supabase.rpc('login_user', {
            input_email: email,
            input_password: password
        });

        if (rpcError) {
            console.error('❌ RPC error:', rpcError.message);
        } else if (!rpcData) {
            console.warn('⚠️ RPC returned null data - check password or email content.');
        } else {
            console.log('✅ Login successful via RPC!');
            console.log('   User Role:', rpcData.role);
            console.log('   Tenant ID:', rpcData.tenant_id);
        }

    } catch (err) {
        console.error('💥 Script error:', err);
    }
}

run();
