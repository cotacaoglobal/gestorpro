import { supabase } from './supabaseClient';

export interface EmailData {
    to: string | string[];
    subject: string;
    templateName: 'sale-confirmation' | 'payment-reminder' | 'payment-confirmation' | 'expiration-warning';
    templateData: Record<string, any>;
}

export const EmailService = {
    /**
     * Envia um email processando um template HTML
     */
    async sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Buscar o template HTML (em produção isso poderia vir do banco ou ser embutido)
            // Como estamos no frontend, vamos preferir buscar via fetch se estiver no public ou processar strings
            // Para simplificar esta versão, vamos usar uma função auxiliar para carregar o conteúdo
            const htmlTemplate = await this.loadTemplate(data.templateName, data.templateData);

            // 2. Chamar a Edge Function
            const { data: response, error } = await supabase.functions.invoke('send-email', {
                body: {
                    to: data.to,
                    subject: data.subject,
                    html: htmlTemplate
                }
            });

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error('Erro ao enviar email:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Carrega e processa o template substituindo variáveis
     */
    async loadTemplate(name: string, data: Record<string, any>): Promise<string> {
        try {
            // Em uma aplicação Vite, podemos tentar buscar o arquivo ou importar a string
            // Para este ambiente, vamos assumir que os templates estão disponíveis ou serão injetados
            // Mock de carregamento (em uma implementação real usaríamos fetch('/email-templates/...') )
            let template = await this.fetchTemplateContent(name);

            // Substituição simples de placeholders {{key}}
            Object.keys(data).forEach(key => {
                const value = data[key];

                // Tratar arrays (como itens de venda)
                if (Array.isArray(value) && template.includes(`{{#${key}}}`)) {
                    const sectionRegex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
                    template = template.replace(sectionRegex, (_, innerContent) => {
                        return value.map(item => {
                            let processedInner = innerContent;
                            Object.keys(item).forEach(itemKey => {
                                processedInner = processedInner.replace(new RegExp(`{{${itemKey}}}`, 'g'), item[itemKey]);
                            });
                            return processedInner;
                        }).join('');
                    });
                } else {
                    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
                }
            });

            return template;
        } catch (error) {
            console.error('Erro ao processar template:', error);
            throw error;
        }
    },

    /**
     * Simula a busca do conteúdo do arquivo de template
     */
    async fetchTemplateContent(name: string): Promise<string> {
        // Nota: Em desenvolvimento local com Vite, poderíamos usar import.meta.glob ou similar
        // Aqui vamos buscar do diretório público se possível, ou usar um fallback embutido
        try {
            const response = await fetch(`/email-templates/${name}.html`);
            if (!response.ok) throw new Error('Template não encontrado');
            return await response.text();
        } catch (e) {
            console.warn('Falha ao buscar template externo, usando fallback embutido para', name);
            return this.getFallbackTemplate(name);
        }
    },

    getFallbackTemplate(name: string): string {
        // Templates básicos embutidos para garantir funcionamento se o fetch falhar
        if (name === 'sale-confirmation') {
            return `<h1>Confirmação de Venda</h1><p>Olá {{customerName}}, obrigado por sua compra de R$ {{total}}.</p>`;
        }
        if (name === 'payment-reminder') {
            return `<h1>Lembrete de Pagamento</h1><p>Olá {{tenantName}}, sua assinatura expira em {{dueDate}}. Valor: R$ {{amount}}.</p>`;
        }
        if (name === 'payment-confirmation') {
            return `<h1>Pagamento Confirmado</h1><p>Olá {{tenantName}}, recebemos seu pagamento de R$ {{amount}}.</p>`;
        }
        if (name === 'expiration-warning') {
            return `<h1>Sua Assinatura Expirou</h1><p>Olá {{tenantName}}, sua conta expirou em {{expiryDate}}.</p>`;
        }
        return `<h1>Notificação Gestor Pro</h1><p>Olá, você tem uma nova atualização do sistema.</p>`;
    },

    // Helpers específicos
    async sendSaleConfirmation(sale: any, customerEmail: string, storeName: string) {
        return this.sendEmail({
            to: customerEmail,
            subject: `Confirmação de Compra - ${storeName}`,
            templateName: 'sale-confirmation',
            templateData: {
                customerName: sale.customerName || 'Cliente',
                storeName: storeName,
                date: new Date(sale.date).toLocaleString('pt-BR'),
                saleId: sale.id.substring(0, 8),
                items: sale.items.map((item: any) => ({
                    name: item.name,
                    quantity: item.quantity,
                    subtotal: (item.price * item.quantity).toFixed(2)
                })),
                total: sale.total.toFixed(2),
                year: new Date().getFullYear()
            }
        });
    },

    async sendPaymentReminder(tenantName: string, email: string, planName: string, amount: string | number, dueDate: string, paymentLink: string) {
        return this.sendEmail({
            to: email,
            subject: 'Lembrete: Sua assinatura Gestor Pro está vencendo',
            templateName: 'payment-reminder',
            templateData: {
                tenantName,
                planName,
                amount: Number(amount).toFixed(2),
                dueDate,
                paymentLink,
                year: new Date().getFullYear()
            }
        });
    },

    async sendPaymentConfirmation(tenantName: string, email: string, planName: string, amount: string | number, date: string, expiryDate: string) {
        return this.sendEmail({
            to: email,
            subject: 'Pagamento Confirmado - Gestor Pro',
            templateName: 'payment-confirmation',
            templateData: {
                tenantName,
                planName,
                amount: Number(amount).toFixed(2),
                date,
                expiryDate,
                year: new Date().getFullYear()
            }
        });
    },

    async sendExpirationWarning(tenantName: string, email: string, planName: string, expiryDate: string, paymentLink: string) {
        return this.sendEmail({
            to: email,
            subject: 'Atenção: Sua assinatura Gestor Pro expirou',
            templateName: 'expiration-warning',
            templateData: {
                tenantName,
                planName,
                expiryDate,
                paymentLink,
                year: new Date().getFullYear()
            }
        });
    }
};

export default EmailService;
