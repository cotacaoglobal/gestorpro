// TEF Service - Transferência Eletrônica de Fundos
// Currently works with simulation, ready to connect to Stone, Cielo, Rede, etc.

import { supabase } from './supabaseClient';
import {
    TefProvider,
    TefTransactionType,
    TefTransaction,
    TefConfig,
    TefPaymentRequest,
    TefPaymentResponse,
    TefConnectionStatus,
    TefDailySummary,
    CardBrand,
} from '../types/tef';

// Simulated API delay for realistic UX
const simulateApiDelay = (ms: number = 2000) => new Promise(resolve => setTimeout(resolve, ms));

// Simulated card brands for demo
const CARD_BRANDS: CardBrand[] = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD'];

export const TefService = {
    // =====================================================
    // CONFIGURAÇÃO TEF
    // =====================================================

    /**
     * Buscar configuração TEF do tenant
     */
    getConfig: async (tenantId: string): Promise<TefConfig | null> => {
        const { data, error } = await supabase
            .from('tef_configs')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('Error fetching TEF config:', error);
            return null;
        }

        return TefService.mapConfigFromDb(data);
    },

    /**
     * Salvar configuração TEF
     */
    saveConfig: async (config: Partial<TefConfig> & { tenantId: string }): Promise<{ success: boolean; error?: string }> => {
        const dbData = {
            tenant_id: config.tenantId,
            provider: config.provider || 'NONE',
            is_active: config.isActive || false,
            environment: config.environment || 'SANDBOX',
            auto_capture: config.autoCapture !== false,
            max_installments: config.maxInstallments || 12,
            min_installment_value: config.minInstallmentValue || 5.00,
            pix_enabled: config.pixEnabled || false,
            pix_key: config.pixKey,
            pix_key_type: config.pixKeyType,
            pix_expiration_minutes: config.pixExpirationMinutes || 30,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('tef_configs')
            .upsert(dbData, { onConflict: 'tenant_id' });

        if (error) {
            console.error('Error saving TEF config:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    },

    /**
     * Verificar status da conexão TEF
     */
    checkConnection: async (tenantId: string): Promise<TefConnectionStatus> => {
        const config = await TefService.getConfig(tenantId);

        if (!config || !config.isActive || config.provider === 'NONE') {
            return {
                isConnected: false,
                provider: 'NONE',
            };
        }

        // SIMULAÇÃO: Em produção, faria ping real ao provider
        await simulateApiDelay(500);

        return {
            isConnected: true,
            provider: config.provider,
            lastPing: new Date(),
            terminalId: 'VIRTUAL-001',
            terminalModel: 'Simulador TEF',
        };
    },

    // =====================================================
    // TRANSAÇÕES
    // =====================================================

    /**
     * Iniciar transação TEF
     * NOTA: Atualmente simula. Quando integrar com provider real, substituir.
     */
    startPayment: async (
        tenantId: string,
        request: TefPaymentRequest
    ): Promise<TefPaymentResponse> => {
        const config = await TefService.getConfig(tenantId);

        if (!config || !config.isActive) {
            return {
                success: false,
                error: { code: 'TEF_NOT_CONFIGURED', message: 'TEF não está configurado ou ativo' },
            };
        }

        // Validar valor mínimo para parcelamento
        if (request.type === 'CREDIT_INST' && request.installments) {
            const installmentValue = request.amount / request.installments;
            if (installmentValue < config.minInstallmentValue) {
                return {
                    success: false,
                    error: {
                        code: 'MIN_INSTALLMENT',
                        message: `Valor mínimo da parcela é R$ ${config.minInstallmentValue.toFixed(2)}`
                    },
                };
            }
            if (request.installments > config.maxInstallments) {
                return {
                    success: false,
                    error: {
                        code: 'MAX_INSTALLMENTS',
                        message: `Máximo de ${config.maxInstallments} parcelas`
                    },
                };
            }
        }

        // ============================================================
        // SIMULAÇÃO DE TRANSAÇÃO
        // Quando integrar com API real (Stone, Cielo, etc),
        // substituir este bloco pelo código de integração
        // ============================================================

        // Criar registro da transação
        const { data: txData, error: txError } = await supabase
            .from('tef_transactions')
            .insert({
                tenant_id: tenantId,
                sale_id: request.saleId,
                type: request.type,
                status: 'PROCESSING',
                amount: request.amount,
                installments: request.installments || 1,
                installment_value: request.installments ? request.amount / request.installments : request.amount,
                provider: config.provider,
            })
            .select()
            .single();

        if (txError) {
            console.error('Error creating TEF transaction:', txError);
            return {
                success: false,
                error: { code: 'DB_ERROR', message: txError.message },
            };
        }

        // Simular processamento
        await simulateApiDelay(2500);

        // 95% de chance de aprovar (simulação)
        const isApproved = Math.random() < 0.95;
        const randomBrand = CARD_BRANDS[Math.floor(Math.random() * CARD_BRANDS.length)];
        const authCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const nsu = Date.now().toString().slice(-10);

        if (isApproved) {
            // Atualizar como aprovado
            const { data: updatedTx, error: updateError } = await supabase
                .from('tef_transactions')
                .update({
                    status: 'APPROVED',
                    card_brand: request.type !== 'PIX' ? randomBrand : null,
                    card_last_digits: request.type !== 'PIX' ? Math.floor(1000 + Math.random() * 9000).toString() : null,
                    authorization_code: authCode,
                    nsu: nsu,
                    acquirer_nsu: nsu,
                    processed_at: new Date().toISOString(),
                    receipt_customer: TefService.generateReceipt('CUSTOMER', request, authCode, nsu),
                    receipt_merchant: TefService.generateReceipt('MERCHANT', request, authCode, nsu),
                })
                .eq('id', txData.id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating TEF transaction:', updateError);
            }

            return {
                success: true,
                transaction: TefService.mapTransactionFromDb(updatedTx || txData),
            };
        } else {
            // Simular recusa
            const declineReasons = [
                { code: '51', message: 'Saldo insuficiente' },
                { code: '14', message: 'Cartão inválido' },
                { code: '05', message: 'Não autorizada' },
            ];
            const reason = declineReasons[Math.floor(Math.random() * declineReasons.length)];

            await supabase
                .from('tef_transactions')
                .update({
                    status: 'DECLINED',
                    error_code: reason.code,
                    error_message: reason.message,
                    processed_at: new Date().toISOString(),
                })
                .eq('id', txData.id);

            return {
                success: false,
                error: reason,
            };
        }
        // ============================================================
        // FIM DA SIMULAÇÃO
        // ============================================================
    },

    /**
     * Iniciar pagamento PIX
     */
    startPixPayment: async (
        tenantId: string,
        amount: number,
        saleId?: string
    ): Promise<TefPaymentResponse> => {
        const config = await TefService.getConfig(tenantId);

        if (!config || !config.pixEnabled) {
            return {
                success: false,
                error: { code: 'PIX_NOT_ENABLED', message: 'PIX não está habilitado' },
            };
        }

        // Criar transação PIX
        const expirationMinutes = config.pixExpirationMinutes || 30;
        const expiration = new Date(Date.now() + expirationMinutes * 60 * 1000);

        // Gerar QR Code simulado
        const pixPayload = `00020126580014br.gov.bcb.pix0136${config.pixKey || 'chave@exemplo.com'}5204000053039865406${amount.toFixed(2)}5802BR5925GESTOR PRO6009SAO PAULO62070503***6304`;
        const fakeQrBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        const { data: txData, error: txError } = await supabase
            .from('tef_transactions')
            .insert({
                tenant_id: tenantId,
                sale_id: saleId,
                type: 'PIX',
                status: 'PENDING',
                amount: amount,
                provider: config.provider,
                pix_key: config.pixKey,
                pix_qr_code: pixPayload,
                pix_qr_code_base64: fakeQrBase64,
                pix_expiration: expiration.toISOString(),
            })
            .select()
            .single();

        if (txError) {
            return {
                success: false,
                error: { code: 'DB_ERROR', message: txError.message },
            };
        }

        return {
            success: true,
            transaction: TefService.mapTransactionFromDb(txData),
            requiresConfirmation: true,
            qrCode: pixPayload,
            qrCodeBase64: fakeQrBase64,
        };
    },

    /**
     * Confirmar pagamento PIX (quando receber webhook ou polling)
     */
    confirmPixPayment: async (transactionId: string): Promise<TefPaymentResponse> => {
        const { data, error } = await supabase
            .from('tef_transactions')
            .update({
                status: 'APPROVED',
                processed_at: new Date().toISOString(),
            })
            .eq('id', transactionId)
            .select()
            .single();

        if (error) {
            return {
                success: false,
                error: { code: 'DB_ERROR', message: error.message },
            };
        }

        return {
            success: true,
            transaction: TefService.mapTransactionFromDb(data),
        };
    },

    /**
     * Cancelar transação
     */
    cancelTransaction: async (transactionId: string): Promise<{ success: boolean; error?: string }> => {
        const { data: tx, error: fetchError } = await supabase
            .from('tef_transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (fetchError || !tx) {
            return { success: false, error: 'Transação não encontrada' };
        }

        if (tx.status !== 'APPROVED') {
            return { success: false, error: 'Apenas transações aprovadas podem ser canceladas' };
        }

        // Verificar prazo (24h para cancelamento)
        const processedAt = new Date(tx.processed_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - processedAt.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            return { success: false, error: 'Prazo de 24 horas para cancelamento excedido' };
        }

        // SIMULAÇÃO: Em produção, enviaria para API de cancelamento
        await simulateApiDelay(1500);

        const { error: updateError } = await supabase
            .from('tef_transactions')
            .update({
                status: 'CANCELLED',
                cancelled_at: new Date().toISOString(),
            })
            .eq('id', transactionId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true };
    },

    // =====================================================
    // CONSULTAS
    // =====================================================

    /**
     * Listar transações
     */
    listTransactions: async (
        tenantId: string,
        filters?: {
            type?: TefTransactionType;
            status?: string;
            startDate?: Date;
            endDate?: Date;
            saleId?: string;
        },
        limit = 50,
        offset = 0
    ): Promise<{ transactions: TefTransaction[]; total: number }> => {
        let query = supabase
            .from('tef_transactions')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (filters?.type) {
            query = query.eq('type', filters.type);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate.toISOString());
        }
        if (filters?.saleId) {
            query = query.eq('sale_id', filters.saleId);
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error listing TEF transactions:', error);
            return { transactions: [], total: 0 };
        }

        return {
            transactions: data.map(TefService.mapTransactionFromDb),
            total: count || 0,
        };
    },

    /**
     * Buscar resumo do dia
     */
    getDailySummary: async (tenantId: string, date?: Date): Promise<TefDailySummary> => {
        const targetDate = date || new Date();
        const dateStr = targetDate.toISOString().split('T')[0];

        const { data, error } = await supabase.rpc('get_tef_daily_summary', {
            p_tenant_id: tenantId,
            p_date: dateStr,
        });

        if (error) {
            console.error('Error getting TEF summary:', error);
            return {
                date: dateStr,
                totalTransactions: 0,
                totalAmount: 0,
                byType: {
                    credit: { count: 0, amount: 0 },
                    creditInstallment: { count: 0, amount: 0 },
                    debit: { count: 0, amount: 0 },
                    pix: { count: 0, amount: 0 },
                },
                byBrand: {},
                cancelled: { count: 0, amount: 0 },
            };
        }

        return data as TefDailySummary;
    },

    // =====================================================
    // HELPERS
    // =====================================================

    mapConfigFromDb: (data: any): TefConfig => ({
        id: data.id,
        tenantId: data.tenant_id,
        provider: data.provider,
        isActive: data.is_active,
        environment: data.environment,
        autoCapture: data.auto_capture,
        maxInstallments: data.max_installments,
        minInstallmentValue: parseFloat(data.min_installment_value),
        fees: data.fees,
        pixEnabled: data.pix_enabled,
        pixKey: data.pix_key,
        pixKeyType: data.pix_key_type,
        pixExpirationMinutes: data.pix_expiration_minutes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    }),

    mapTransactionFromDb: (data: any): TefTransaction => ({
        id: data.id,
        tenantId: data.tenant_id,
        saleId: data.sale_id,
        type: data.type,
        status: data.status,
        amount: parseFloat(data.amount),
        installments: data.installments,
        installmentValue: data.installment_value ? parseFloat(data.installment_value) : undefined,
        cardBrand: data.card_brand,
        cardLastDigits: data.card_last_digits,
        cardHolderName: data.card_holder_name,
        pixKey: data.pix_key,
        pixQrCode: data.pix_qr_code,
        pixQrCodeBase64: data.pix_qr_code_base64,
        pixExpiration: data.pix_expiration ? new Date(data.pix_expiration) : undefined,
        authorizationCode: data.authorization_code,
        nsu: data.nsu,
        acquirerNsu: data.acquirer_nsu,
        receiptCustomer: data.receipt_customer,
        receiptMerchant: data.receipt_merchant,
        createdAt: new Date(data.created_at),
        processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
        cancelledAt: data.cancelled_at ? new Date(data.cancelled_at) : undefined,
        errorCode: data.error_code,
        errorMessage: data.error_message,
        provider: data.provider,
        providerTransactionId: data.provider_transaction_id,
    }),

    generateReceipt: (type: 'CUSTOMER' | 'MERCHANT', request: TefPaymentRequest, authCode: string, nsu: string): string => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');

        let receipt = `
================================
       COMPROVANTE TEF
       ${type === 'CUSTOMER' ? 'VIA CLIENTE' : 'VIA ESTABELECIMENTO'}
================================

Data: ${dateStr}
Hora: ${timeStr}

Tipo: ${request.type === 'CREDIT' ? 'CRÉDITO À VISTA' :
                request.type === 'CREDIT_INST' ? `CRÉDITO ${request.installments}x` :
                    request.type === 'DEBIT' ? 'DÉBITO' : 'PIX'}

Valor: R$ ${request.amount.toFixed(2)}
${request.installments && request.installments > 1 ? `Parcelas: ${request.installments}x R$ ${(request.amount / request.installments).toFixed(2)}` : ''}

Autorização: ${authCode}
NSU: ${nsu}

================================
     TRANSAÇÃO APROVADA
================================
`;
        return receipt;
    },

    // Calcular taxas estimadas
    calculateFees: (amount: number, type: TefTransactionType, installments: number = 1): number => {
        // Taxas aproximadas do mercado (%)
        const fees: Record<TefTransactionType, number> = {
            CREDIT: 2.99,
            CREDIT_INST: 3.49 + (installments > 6 ? 0.5 : 0), // +0.5% acima de 6x
            DEBIT: 1.99,
            PIX: 0.99,
            VOUCHER: 3.99,
        };

        return amount * (fees[type] / 100);
    },
};
