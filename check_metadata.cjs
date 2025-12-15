const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkMetadata() {
    console.log('--- CHECKING USER METADATA ---');

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error(error);
        return;
    }

    const superAdmin = users.find(u => u.email.includes('agenciabr'));

    if (superAdmin) {
        console.log('Super Admin Found:', superAdmin.email);
        console.log('Metadata:', JSON.stringify(superAdmin.user_metadata, null, 2));
    } else {
        console.error('Super Admin user NOT found!');
    }
}

checkMetadata();
