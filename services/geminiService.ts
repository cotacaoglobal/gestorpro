import { supabase } from './supabaseClient';

/**
 * GeminiService - Serviço de IA com Google Gemini
 * 
 * SEGURANÇA: Chave API protegida via Supabase Edge Function
 * Rate Limiting: 20 requisições/minuto por tenant
 */
export const GeminiService = {
  /**
   * Envia prompt para o Gemini AI via Edge Function segura
   * @param prompt - Pergunta ou comando do usuário
   * @param context - Contexto adicional (dados de vendas, produtos, etc)
   * @returns Resposta do Gemini AI
   */
  chat: async (prompt: string, context?: string): Promise<string> => {
    try {
      // Validar input
      if (!prompt || prompt.trim().length === 0) {
        return '❌ **Erro**: Por favor, faça uma pergunta.';
      }

      if (prompt.length > 2000) {
        return '❌ **Erro**: Pergunta muito longa. Limite: 2000 caracteres.';
      }

      // Chamar Edge Function (autenticação automática via Supabase client)
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: prompt.trim(),
          context: context?.trim()
        }
      });

      if (error) {
        console.error('Erro ao chamar Edge Function:', error);

        // Tratamento de erros específicos
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          return '⏱️ **Limite de Requisições Excedido**\n\nVocê atingiu o limite de 20 perguntas por minuto. Aguarde alguns segundos e tente novamente.';
        }

        if (error.message?.includes('401') || error.message?.includes('403')) {
          return '🔒 **Erro de Autenticação**\n\nSua sessão expirou. Por favor, faça login novamente.';
        }

        return '❌ **Erro de Conexão**\n\nNão foi possível conectar ao serviço de IA. Tente novamente em alguns instantes.';
      }

      if (!data?.response) {
        return '❌ **Erro**: Resposta inválida do servidor.';
      }

      // Retornar resposta com informações de uso (opcional)
      let response = data.response;

      if (data.usage) {
        const { requests_remaining, window_reset_in } = data.usage;
        if (requests_remaining <= 3) {
          response += `\n\n_ℹ️ Você tem ${requests_remaining} perguntas restantes neste minuto._`;
        }
      }

      return response;

    } catch (error: any) {

      return `❌ **Erro ao gerar análise**\n\n${error.message || 'Não foi possível gerar a análise no momento. Tente novamente mais tarde.'}`;
    }
  }
};