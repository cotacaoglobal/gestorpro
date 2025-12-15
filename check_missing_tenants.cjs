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

async function checkMissingTenants() {
    console.log('--- CHECKING ORPHAN TENANT IDs ---');

    // 1. Get all Tenants
    const { data: tenants } = await supabase.from('tenants').select('*');
    const existingTenantIds = new Set(tenants.map(t => t.id));
    console.log(`Existing Tenants (${tenants.length}):`, existingTenantIds);

    // 2. Get all Users and their TenantIDs
    const { data: users } = await supabase.from('users').select('id, name, email, tenant_id');

    const missingTenants = new Set();
    const usersWithMissingTenant = [];

    users.forEach(u => {
        if (u.tenant_id && !existingTenantIds.has(u.tenant_id)) {
            missingTenants.add(u.tenant_id);
            usersWithMissingTenant.push({ user: u.name || u.email, tenantId: u.tenant_id });
        }
    });

    if (missingTenants.size > 0) {
        console.log('\n❌ FOUND MISSING TENANTS!');
        console.log('These tenant IDs appear in `users` but NOT in `tenants`:');
        console.log(Array.from(missingTenants));
        console.log('\nUsers affected:');
        console.table(usersWithMissingTenant);
    } else {
        console.log('\n✅ No orphan tenant IDs found. All users belong to existing tenants.');
    }
}

checkMissingTenants();
