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
                    
                    // 7. Enviar email de confirmação se aprovado
                    if (payment.status === 'approved') {
                        try {
                            // Buscar dados do tenant e plano para o email
                            const { data: tenant } = await supabase
                                .from('tenants')
                                .select('name, owner_email')
                                .eq('id', tenantId)
                                .single()

                            const { data: plan } = await supabase
                                .from('saas_plans')
                                .select('name')
                                .eq('id', payment.metadata?.plan_id)
                                .single()

                            if (tenant && tenant.owner_email) {
                                console.log(`📧 Enviando email de confirmação para ${tenant.owner_email}...`)
                                
                                const emailBody = `
                                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                                        <h1 style="color: #059669; text-align: center;">Pagamento Confirmado!</h1>
                                        <p>Olá <strong>${tenant.name}</strong>,</p>
                                        <p>Recebemos a confirmação do seu pagamento para o plano <strong>${plan?.name || 'Assinatura'}</strong>.</p>
                                        <p>Sua assinatura foi ativada/renovada com sucesso e você já pode continuar utilizando todos os recursos do Gestor Pro.</p>
                                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                            <p style="margin: 5px 0;"><strong>Valor:</strong> R$ ${parseFloat(payment.transaction_amount).toFixed(2)}</p>
                                            <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                                            <p style="margin: 5px 0;"><strong>Método:</strong> ${payment.payment_method_id.toUpperCase()}</p>
                                        </div>
                                        <p style="text-align: center; margin-top: 30px;">
                                            <a href="${SUPABASE_URL.replace('.supabase.co', '')}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Painel</a>
                                        </p>
                                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                                        <p style="font-size: 12px; color: #64748b; text-align: center;">
                                            Gestor Pro - Sistema de Gestão Inteligente<br>
                                            Este é um email automático, por favor não responda.
                                        </p>
                                    </div>
                                `

                                await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        to: tenant.owner_email,
                                        subject: 'Pagamento Confirmado - Gestor Pro',
                                        html: emailBody
                                    })
                                })
                                console.log(`✅ Email de confirmação enviado!`)
                            }
                        } catch (emailErr) {
                            console.error('⚠️ Falha ao enviar email de confirmação:', emailErr)
                        }
                    }
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
