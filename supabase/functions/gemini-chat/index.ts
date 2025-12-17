import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
    prompt: string
    context?: string
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Verificar autenticação
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Não autorizado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Criar cliente Supabase e verificar usuário
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Usuário não autenticado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Buscar tenant_id do usuário
        const { data: userData, error: profileError } = await supabaseClient
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (profileError || !userData?.tenant_id) {
            return new Response(
                JSON.stringify({ error: 'Perfil de usuário não encontrado' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const tenantId = userData.tenant_id

        // 4. Rate Limiting (20 requisições por minuto por tenant)
        const rateLimitKey = `gemini_rate_limit:${tenantId}`
        const now = Date.now()
        const windowMs = 60 * 1000 // 1 minuto

        // Buscar contador de rate limit do KV storage
        const kv = await Deno.openKv()
        const rateLimitData = await kv.get([rateLimitKey])

        let requestCount = 1
        let windowStart = now

        if (rateLimitData.value) {
            const data = rateLimitData.value as { count: number; start: number }
            if (now - data.start < windowMs) {
                requestCount = data.count + 1
                windowStart = data.start

                if (requestCount > 20) {
                    return new Response(
                        JSON.stringify({
                            error: 'Limite de requisições excedido. Tente novamente em alguns segundos.',
                            retryAfter: Math.ceil((windowMs - (now - data.start)) / 1000)
                        }),
                        {
                            status: 429,
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json',
                                'Retry-After': String(Math.ceil((windowMs - (now - data.start)) / 1000))
                            }
                        }
                    )
                }
            } else {
                // Nova janela de tempo
                requestCount = 1
                windowStart = now
            }
        }

        // Atualizar contador
        await kv.set([rateLimitKey], { count: requestCount, start: windowStart }, { expireIn: windowMs })

        // 5. Validar corpo da requisição
        const { prompt, context }: RequestBody = await req.json()

        if (!prompt || typeof prompt !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Prompt inválido' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (prompt.length > 2000) {
            return new Response(
                JSON.stringify({ error: 'Prompt muito longo (máximo 2000 caracteres)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 6. Chamar Google Gemini API
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
        if (!geminiApiKey) {
            console.error('GEMINI_API_KEY não configurada')
            return new Response(
                JSON.stringify({ error: 'Serviço temporariamente indisponível' }),
                { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`

        const geminiPayload = {
            contents: [{
                parts: [{
                    text: context ? `${context}\n\n${prompt}` : prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
            }
        }

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiPayload)
        })

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text()
            console.error('Gemini API error:', errorText)
            return new Response(
                JSON.stringify({ error: 'Erro ao processar requisição' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const geminiData = await geminiResponse.json()

        // 7. Extrair resposta
        const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Desculpe, não consegui gerar uma resposta.'

        // 8. Log de auditoria (opcional)
        await supabaseClient.from('audit_logs').insert({
            tenant_id: tenantId,
            user_id: user.id,
            action: 'gemini_chat',
            details: { prompt_length: prompt.length, response_length: responseText.length }
        }).catch(err => console.error('Erro ao registrar log:', err))

        // 9. Retornar resposta
        return new Response(
            JSON.stringify({
                response: responseText,
                usage: {
                    requests_remaining: 20 - requestCount,
                    window_reset_in: Math.ceil((windowMs - (now - windowStart)) / 1000)
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Erro na Edge Function:', error)
        return new Response(
            JSON.stringify({ error: 'Erro interno do servidor' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
