// TEF Types - Transferência Eletrônica de Fundos
// Prepared for integration with Stone, Cielo, Rede, PagSeguro, etc.

export type TefProvider =
    | 'STONE'
    | 'CIELO'
    | 'REDE'
    | 'PAGSEGURO'
    | 'GETNET'
    | 'SAFRAPAY'
    | 'SUMUP'
    | 'MERCADOPAGO'
    | 'NONE';

export type TefTransactionType =
    | 'CREDIT'      // Crédito à vista
    | 'CREDIT_INST' // Crédito parcelado
    | 'DEBIT'       // Débito
    | 'PIX'         // Pix
    | 'VOUCHER';    // Vale refeição/alimentação

export type TefTransactionStatus =
    | 'PENDING'     // Aguardando processamento
    | 'PROCESSING'  // Sendo processada
    | 'APPROVED'    // Aprovada
    | 'DECLINED'    // Recusada
    | 'CANCELLED'   // Cancelada
    | 'ERROR'       // Erro na transação
    | 'TIMEOUT';    // Tempo esgotado

export type CardBrand =
    | 'VISA'
    | 'MASTERCARD'
    | 'ELO'
    | 'AMEX'
    | 'HIPERCARD'
    | 'DINERS'
    | 'DISCOVER'
    | 'AURA'
    | 'JCB'
    | 'OTHER';

export interface TefTransaction {
    id: string;
    tenantId: string;
    saleId?: string;

    // Tipo da transação
    type: TefTransactionType;
    status: TefTransactionStatus;

    // Valores
    amount: number;
    installments?: number;      // Número de parcelas (para crédito)
    installmentValue?: number;  // Valor de cada parcela

    // Dados do cartão (mascarados)
    cardBrand?: CardBrand;
    cardLastDigits?: string;    // Últimos 4 dígitos
    cardHolderName?: string;

    // Dados PIX
    pixKey?: string;
    pixQrCode?: string;
    pixQrCodeBase64?: string;
    pixExpiration?: Date;

    // Resposta do TEF
    authorizationCode?: string;
    nsu?: string;               // Número Sequencial Único
    acquirerNsu?: string;       // NSU do adquirente
    receiptCustomer?: string;   // Via do cliente (texto)
    receiptMerchant?: string;   // Via do estabelecimento

    // Datas
    createdAt: Date;
    processedAt?: Date;
    cancelledAt?: Date;

    // Erros
    errorCode?: string;
    errorMessage?: string;

    // Provider info
    provider: TefProvider;
    providerTransactionId?: string;
}

// Configuração TEF do estabelecimento
export interface TefConfig {
    id: string;
    tenantId: string;

    // Provider ativo
    provider: TefProvider;
    isActive: boolean;

    // Credenciais (criptografadas no banco)
    stoneCode?: string;         // Stone
    cieloMerchantId?: string;   // Cielo
    cieloMerchantKey?: string;
    redeAffiliationId?: string; // Rede
    redePv?: string;
    pagseguroEmail?: string;    // PagSeguro
    pagseguroToken?: string;
    mercadoPagoToken?: string;  // Mercado Pago

    // Configurações gerais
    environment: 'PRODUCTION' | 'SANDBOX';
    autoCapture: boolean;       // Captura automática
    maxInstallments: number;    // Máximo de parcelas
    minInstallmentValue: number;// Valor mínimo da parcela

    // Taxas por bandeira (para exibição/cálculo)
    fees?: {
        [key in CardBrand]?: {
            credit: number;         // % taxa crédito
            creditInstallment: number; // % taxa crédito parcelado
            debit: number;          // % taxa débito
        };
    };

    // Pix
    pixEnabled: boolean;
    pixKey?: string;
    pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
    pixExpirationMinutes?: number;

    createdAt: Date;
    updatedAt: Date;
}

// Requisição para iniciar transação
export interface TefPaymentRequest {
    amount: number;
    type: TefTransactionType;
    installments?: number;
    saleId?: string;
    customerDocument?: string;
    customerName?: string;
}

// Resposta de transação TEF
export interface TefPaymentResponse {
    success: boolean;
    transaction?: TefTransaction;
    requiresConfirmation?: boolean; // Para Pix
    qrCode?: string;
    qrCodeBase64?: string;
    error?: {
        code: string;
        message: string;
    };
}

// Status do terminal/connection
export interface TefConnectionStatus {
    isConnected: boolean;
    provider: TefProvider;
    lastPing?: Date;
    terminalId?: string;
    terminalModel?: string;
}

// Resumo de transações do dia
export interface TefDailySummary {
    date: string;
    totalTransactions: number;
    totalAmount: number;
    byType: {
        credit: { count: number; amount: number };
        creditInstallment: { count: number; amount: number };
        debit: { count: number; amount: number };
        pix: { count: number; amount: number };
    };
    byBrand: {
        [key in CardBrand]?: { count: number; amount: number };
    };
    cancelled: { count: number; amount: number };
}

// Taxas estimadas
export interface TefFeeEstimate {
    grossAmount: number;
    netAmount: number;
    totalFees: number;
    feePercentage: number;
    anticipationFee?: number;
    receivableDate: Date;
}
