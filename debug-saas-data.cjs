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

async function debugSaaSData() {
    console.log('--- DEBUGGING SAAS DATA ---');

    // 1. Check Tenants
    const { data: tenants, error: errTens } = await supabase.from('tenants').select('*');
    if (errTens) console.error('Error fetching tenants:', errTens);
    else {
        console.log(`\n📊 Tenants Count: ${tenants.length}`);
        console.table(tenants);
    }

    // 2. Check Subscriptions (renamed from saas_subscriptions to match hint)
    const { data: subs, error: errSubs } = await supabase.from('subscriptions').select('*');
    if (errSubs) console.error('Error fetching subscriptions:', errSubs);
    else {
        console.log(`\n📄 Subscriptions Count: ${subs.length}`);
        console.table(subs);
    }

    // 2.1 Check Invoices
    const { data: invoices, error: errInv } = await supabase.from('saas_invoices').select('*');
    if (errInv) console.error('Error fetching invoices:', errInv);
    else {
        console.log(`\n💸 Invoices Count: ${invoices.length}`);
        console.table(invoices);
    }

    // 3. Check Users
    const { data: users, error: errUsers } = await supabase.from('users').select('id, name, email, tenant_id, role');
    if (errUsers) console.error('Error fetching users:', errUsers);
    else {
        console.log(`\n👥 Users Count: ${users.length}`);
        console.table(users);
    }

    // 4. Check Plans
    const { data: plans, error: errPlans } = await supabase.from('saas_plans').select('*');
    if (errPlans) console.error('Error fetching plans:', errPlans);
    else {
        console.log(`\n📦 Plans Count: ${plans.length}`);
        console.table(plans.map(p => ({ id: p.id, name: p.name, slug: p.slug, price: p.price })));
    }
}

debugSaaSData();
