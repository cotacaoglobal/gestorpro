// Supabase Edge Function para criar pagamento no Mercado Pago
// Deploy: supabase functions deploy create-mp-payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CreatePaymentRequest {
    tenantId: string
    planId: string
    subscriptionId?: string
}

serve(async (req) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    try {
        // Criar cliente Supabase
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Parse request
        const { tenantId, planId, subscriptionId }: CreatePaymentRequest = await req.json()

        // Buscar dados do plano
        const { data: plan, error: planError } = await supabase
            .from('saas_plans')
            .select('*')
            .eq('id', planId)
            .single()

        if (planError || !plan) {
            return new Response(JSON.stringify({ error: 'Plano não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Buscar dados do tenant
        const { data: tenant } = await supabase
            .from('tenants')
            .select('name, owner_email')
            .eq('id', tenantId)
            .single()

        // Criar preferência no Mercado Pago
        const preference = {
            items: [
                {
                    title: `Assinatura ${plan.name} - ${tenant?.name || 'Empresa'}`,
                    description: plan.description,
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: parseFloat(plan.price),
                },
            ],
            payer: {
                email: tenant?.owner_email || 'cliente@exemplo.com',
            },
            external_reference: tenantId, // Para identificar no webhook
            notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
            metadata: {
                tenant_id: tenantId,
                plan_id: planId,
                subscription_id: subscriptionId,
            },
        }

        // Fazer request ao Mercado Pago
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
            console.error('Mercado Pago Error:', errorData)
            return new Response(JSON.stringify({ error: 'Erro ao criar pagamento', details: errorData }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const mpData = await mpResponse.json()

        // Salvar transação no banco
        const { data: transaction, error: txError } = await supabase
            .from('payment_transactions')
            .insert({
                tenant_id: tenantId,
                subscription_id: subscriptionId,
                plan_id: planId,
                amount: plan.price,
                currency: 'BRL',
                status: 'pending',
                mp_preference_id: mpData.id,
                payment_link: mpData.init_point,
                description: `Assinatura ${plan.name}`,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
            })
            .select()
            .single()

        if (txError) {
            console.error('Transaction Error:', txError)
            return new Response(JSON.stringify({ error: 'Erro ao salvar transação' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Retornar link de pagamento
        return new Response(
            JSON.stringify({
                success: true,
                transactionId: transaction.id,
                paymentLink: mpData.init_point,
                preferenceId: mpData.id,
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
