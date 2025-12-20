// Supabase Edge Function: Admin Add User
// Este script permite que um Admin crie novos usuários (operadores) sem ser deslogado.
// Deploy: supabase functions deploy admin-add-user

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AdminAddUserRequest {
    name: string
    email: string
    password: string
    role: string
    tenantId: string
}

serve(async (req) => {
    // CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Criar cliente Supabase com Service Role Key para ter boderes de Admin
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Parse request payload
        const { name, email, password, role, tenantId }: AdminAddUserRequest = await req.json()

        // 1. Criar usuário no Supabase Auth usando o admin client
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        })

        if (authError) {
            return new Response(JSON.stringify({ error: authError.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Inserir ou atualizar na tabela pública de usuários
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .upsert({
                id: authUser.user.id,
                name,
                email,
                role,
                tenant_id: tenantId,
                password_hash: 'MANAGED_BY_SUPABASE_AUTH'
            })
            .select()
            .single()

        if (profileError) {
            console.error('Profile Error:', profileError)
            // Nota: Em caso de erro aqui, o usuário ainda existirá no Auth. 
            // Você pode opcionalmente deletar o auth user aqui para rollback.
            return new Response(JSON.stringify({ error: profileError.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify({ success: true, user: profile }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Unexpected Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
