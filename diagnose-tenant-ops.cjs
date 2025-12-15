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

        console.log('🔍 Testing tenant operations...\n');
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Check if status column exists
        console.log('1️⃣ Checking tenants table structure...');
        const { data: tenants, error: fetchError } = await supabase
            .from('tenants')
            .select('*')
            .limit(1);

        if (fetchError) {
            console.error('❌ Error fetching tenants:', fetchError.message);
            return;
        }

        if (tenants && tenants.length > 0) {
            const columns = Object.keys(tenants[0]);
            console.log('✅ Columns found:', columns.join(', '));

            if (!columns.includes('status')) {
                console.error('❌ PROBLEMA: Coluna "status" NÃO existe na tabela tenants!');
                console.log('   Execute o script add_tenant_status_column.sql no Supabase SQL Editor');
            } else {
                console.log('✅ Coluna "status" existe!');
            }
        }

        // 2. Test update status
        console.log('\n2️⃣ Testing status update...');
        const { data: testTenant } = await supabase
            .from('tenants')
            .select('id, name, status')
            .limit(1)
            .single();

        if (testTenant) {
            console.log(`   Tenant de teste: ${testTenant.name} (Status atual: ${testTenant.status || 'NULL'})`);

            // Try to update
            const newStatus = testTenant.status === 'active' ? 'suspended' : 'active';
            const { error: updateError } = await supabase
                .from('tenants')
                .update({ status: newStatus })
                .eq('id', testTenant.id);

            if (updateError) {
                console.error('❌ Erro ao atualizar status:', updateError.message);
            } else {
                console.log(`✅ Status atualizado para: ${newStatus}`);

                // Revert back
                await supabase
                    .from('tenants')
                    .update({ status: testTenant.status || 'active' })
                    .eq('id', testTenant.id);
                console.log('   (Status revertido para o original)');
            }
        }

        console.log('\n✅ Diagnóstico completo!');

    } catch (err) {
        console.error('💥 Script error:', err);
    }
}

run();
