import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

// Helper to format currency
const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const GeminiService = {
  analyzeBusiness: async (products: Product[], sales: Sale[]) => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key não configurada.");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Prepare data summary for the AI (avoid sending huge JSONs if list is massive, simplify here)
      const salesSummary = sales.slice(-50).map(s => ({
        date: s.date,
        total: s.total,
        items: s.items.map(i => `${i.name} (x${i.quantity})`).join(', ')
      }));

      const lowStockProducts = products.filter(p => p.stock <= p.minStock).map(p => p.name);
      
      const totalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0);

      const prompt = `
        Atue como um consultor de negócios especialista em varejo. Analise os seguintes dados da minha loja:
        
        Dados de Estoque:
        - Produtos com estoque baixo (urgente): ${lowStockProducts.join(', ') || 'Nenhum'}
        - Total de produtos cadastrados: ${products.length}
        
        Dados de Vendas Recentes:
        - Receita Total (histórico): ${formatCurrency(totalRevenue)}
        - Amostra das últimas vendas: ${JSON.stringify(salesSummary)}

        Forneça um relatório conciso com:
        1. Alertas de estoque e sugestões de reposição.
        2. Identificação de produtos que estão vendendo bem (tendências).
        3. Uma dica estratégica para aumentar o lucro baseada nos dados.
        4. Use formatação Markdown.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.error("Erro na análise AI:", error);
      return "Não foi possível gerar a análise no momento. Verifique sua chave de API ou tente novamente mais tarde.";
    }
  }
};