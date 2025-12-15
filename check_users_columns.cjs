const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carrega variáveis de ambiente
const envPath = path.resolve(__dirname, '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('🔍 Checking users table columns...');

    // Fetch one row to see keys
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching users:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Columns found:', Object.keys(data[0]).join(', '));
    } else {
        console.log('⚠️ No users found, cannot infer columns from data.');
        // Fallback: try to insert dummy to get specific error or check definitions if possible via query
        // But listing keys is usually enough if data exists (and we know it does)
    }
}

checkColumns();
