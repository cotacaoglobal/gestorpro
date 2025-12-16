// Supabase Edge Function: Auto-Renew Subscriptions
// Executa diariamente via Cron Job
// Deploy: supabase functions deploy auto-renew-subscriptions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        console.log('🔄 Iniciando processo de renovação automática...')

        // 1. Buscar assinaturas que expiram em até 7 dias E têm auto_renew=true
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

        const { data: expiringSubs, error: fetchError } = await supabase
            .from('subscriptions')
            .select(`
                id,
                tenant_id,
                plan_id,
                status,
                expires_at,
                auto_renew,
                tenants (
                    id,
                    name,
                    owner_email
                ),
                saas_plans (
                    id,
                    name,
                    price
                )
            `)
            .eq('status', 'active')
            .eq('auto_renew', true)
            .lte('expires_at', sevenDaysFromNow.toISOString())
            .gt('expires_at', new Date().toISOString()) // Não expiradas ainda

        if (fetchError) {
            console.error('Erro ao buscar assinaturas:', fetchError)
            return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
        }

        console.log(`📊 Encontradas ${expiringSubs?.length || 0} assinaturas para renovação automática`)

        const results = []

        // 2. Para cada assinatura, criar preferência de pagamento
        for (const sub of expiringSubs || []) {
            try {
                console.log(`💳 Processando assinatura ${sub.id} do tenant ${sub.tenants.name}`)

                // Verificar se já existe uma transação pendente para esta assinatura
                const { data: existingTransaction } = await supabase
                    .from('payment_transactions')
                    .select('id, status')
                    .eq('subscription_id', sub.id)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (existingTransaction) {
                    console.log(`⏭️ Assinatura ${sub.id} já tem transação pendente, pulando...`)
                    results.push({
                        subscriptionId: sub.id,
                        tenantName: sub.tenants.name,
                        status: 'skipped',
                        reason: 'pending_transaction'
                    })
                    continue
                }

                // Criar preferência no Mercado Pago
                const preference = {
                    items: [
                        {
                            title: `Renovação ${sub.saas_plans.name} - ${sub.tenants.name}`,
                            description: `Renovação mensal automática`,
                            quantity: 1,
                            currency_id: 'BRL',
                            unit_price: parseFloat(sub.saas_plans.price),
                        },
                    ],
                    payer: {
                        email: sub.tenants.owner_email || 'cliente@exemplo.com',
                    },
                    external_reference: sub.tenant_id,
                    notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
                    metadata: {
                        tenant_id: sub.tenant_id,
                        plan_id: sub.plan_id,
                        subscription_id: sub.id,
                        auto_renewal: true,
                    },
                }

                const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(preference),
                })

                if (!mpResponse.ok) {
                    const errorData = await mpResponse.json()
                    console.error(`❌ Erro ao criar preferência MP para ${sub.id}:`, errorData)
                    results.push({
                        subscriptionId: sub.id,
                        tenantName: sub.tenants.name,
                        status: 'failed',
                        error: errorData
                    })
                    continue
                }

                const mpData = await mpResponse.json()

                // Salvar transação no banco
                const { data: transaction, error: txError } = await supabase
                    .from('payment_transactions')
                    .insert({
                        tenant_id: sub.tenant_id,
                        subscription_id: sub.id,
                        plan_id: sub.plan_id,
                        amount: sub.saas_plans.price,
                        currency: 'BRL',
                        status: 'pending',
                        mp_preference_id: mpData.id,
                        payment_link: mpData.init_point,
                        description: `Renovação automática - ${sub.saas_plans.name}`,
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
                    })
                    .select()
                    .single()

                if (txError) {
                    console.error(`❌ Erro ao salvar transação para ${sub.id}:`, txError)
                    results.push({
                        subscriptionId: sub.id,
                        tenantName: sub.tenants.name,
                        status: 'failed',
                        error: txError.message
                    })
                    continue
                }

                // TODO: Enviar email ao cliente com link de pagamento
                // Por enquanto, apenas logamos
                console.log(`✅ Cobrança criada com sucesso para ${sub.tenants.name}`)
                console.log(`   Link de pagamento: ${mpData.init_point}`)

                results.push({
                    subscriptionId: sub.id,
                    tenantId: sub.tenant_id,
                    tenantName: sub.tenants.name,
                    transactionId: transaction.id,
                    paymentLink: mpData.init_point,
                    status: 'created'
                })

            } catch (error) {
                console.error(`❌ Erro ao processar assinatura ${sub.id}:`, error)
                results.push({
                    subscriptionId: sub.id,
                    tenantName: sub.tenants?.name || 'Unknown',
                    status: 'error',
                    error: error.message
                })
            }
        }

        // 3. Expirar assinaturas vencidas (que não foram pagas)
        const now = new Date().toISOString()
        const { data: expiredSubs, error: expireError } = await supabase
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('status', 'active')
            .lt('expires_at', now)
            .select('id, tenant_id')

        if (expireError) {
            console.error('❌ Erro ao expirar assinaturas:', expireError)
        } else {
            console.log(`⏰ ${expiredSubs?.length || 0} assinaturas expiradas`)
        }

        // 4. Expirar trials vencidos
        const { data: expiredTrials, error: trialError } = await supabase
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('status', 'trial')
            .lt('trial_ends_at', now)
            .select('id, tenant_id')

        if (trialError) {
            console.error('❌ Erro ao expirar trials:', trialError)
        } else {
            console.log(`⏰ ${expiredTrials?.length || 0} trials expirados`)
        }

        return new Response(
            JSON.stringify({
                success: true,
                summary: {
                    processed: expiringSubs?.length || 0,
                    created: results.filter(r => r.status === 'created').length,
                    failed: results.filter(r => r.status === 'failed' || r.status === 'error').length,
                    skipped: results.filter(r => r.status === 'skipped').length,
                    expired: (expiredSubs?.length || 0) + (expiredTrials?.length || 0)
                },
                details: results
            }),
            {
                headers: { 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('❌ Erro geral:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})
