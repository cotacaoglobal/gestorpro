// ALTERNATIVA: Usar Service Role Key para operações administrativas
// 
// Se as políticas RLS não funcionarem, você pode criar um cliente Supabase
// separado usando a Service Role Key (que bypassa RLS) apenas para operações
// de Super Admin.
//
// ATENÇÃO: A Service Role Key deve ser mantida em SEGREDO e NUNCA exposta no frontend!
//
// Para implementar:
// 1. Adicione VITE_SUPABASE_SERVICE_ROLE_KEY ao .env.local
// 2. Crie um novo arquivo: services/supabaseAdminClient.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Cliente com Service Role - APENAS para operações administrativas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Então, em supabaseService.ts, use supabaseAdmin para operações de tenant:
//
// updateTenantStatus: async (tenantId: string, status: 'active' | 'suspended'): Promise<void> => {
//     const { error } = await supabaseAdmin  // <-- Usar supabaseAdmin ao invés de supabase
//         .from('tenants')
//         .update({ status })
//         .eq('id', tenantId);
//
//     if (error) throw error;
// },
