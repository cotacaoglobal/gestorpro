// Supabase Edge Function para receber webhooks do Mercado Pago
// Deploy: supabase functions deploy mp-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Parse webhook notification
        const notification = await req.json()

        console.log('Webhook received:', notification)

        // Mercado Pago envia notificações de diferentes tipos
        if (notification.type === 'payment') {
            const paymentId = notification.data.id

            // Buscar detalhes do pagamento no MP
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                },
            })

            if (!mpResponse.ok) {
                console.error('Failed to fetch payment from MP')
                return new Response('error', { status: 500 })
            }

            const payment = await mpResponse.json()
            console.log('Payment details:', payment)

            // Extrair metadata
            const tenantId = payment.metadata?.tenant_id
            const subscriptionId = payment.metadata?.subscription_id

            if (!tenantId) {
                console.error('No tenant_id in metadata')
                return new Response('ok', { status: 200 }) // Retornar 200 para não reenviar
            }

            // Buscar transação existente pelo preference_id
            const { data: existingTransaction } = await supabase
                .from('payment_transactions')
                .select('*')
                .eq('mp_preference_id', payment.external_reference)
                .single()

            if (existingTransaction) {
                // Atualizar transação existente
                const { error: updateError } = await supabase
                    .from('payment_transactions')
                    .update({
                        status: payment.status, // approved, rejected, etc
                        mp_payment_id: payment.id.toString(),
                        mp_payment_type: payment.payment_type_id,
                        mp_payment_method: payment.payment_method_id,
                        paid_at: payment.status === 'approved' ? new Date().toISOString() : null,
                        webhook_data: payment,
                    })
                    .eq('id', existingTransaction.id)

                if (updateError) {
                    console.error('Update error:', updateError)
                } else {
                    console.log(`Transaction ${existingTransaction.id} updated to ${payment.status}`)

                    // Se foi aprovado, a trigger handle_payment_approved() vai ativar a subscription automaticamente
                }
            } else {
                // Criar nova transação (caso não exista)
                const { error: insertError } = await supabase
                    .from('payment_transactions')
                    .insert({
                        tenant_id: tenantId,
                        subscription_id: subscriptionId,
                        amount: payment.transaction_amount,
                        currency: payment.currency_id,
                        status: payment.status,
                        mp_payment_id: payment.id.toString(),
                        mp_payment_type: payment.payment_type_id,
                        mp_payment_method: payment.payment_method_id,
                        description: payment.description,
                        paid_at: payment.status === 'approved' ? new Date().toISOString() : null,
                        webhook_data: payment,
                    })

                if (insertError) {
                    console.error('Insert error:', insertError)
                }
            }
        }

        // Sempre retornar 200 para o MP não reenviar
        return new Response('ok', { status: 200 })
    } catch (error) {
        console.error('Webhook error:', error)
        return new Response('error', { status: 500 })
    }
})
