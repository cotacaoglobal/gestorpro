// Invoice Types - Prepared for NF-e, NFC-e, NFS-e integration

export type InvoiceType = 'NFE' | 'NFCE' | 'NFSE' | 'NFPE' | 'MDFE';

export type InvoiceStatus =
    | 'DRAFT'      // Rascunho - não enviado
    | 'PENDING'    // Aguardando processamento
    | 'AUTHORIZED' // Autorizado pela SEFAZ
    | 'CANCELLED'  // Cancelado
    | 'DENIED'     // Rejeitado pela SEFAZ
    | 'CORRECTED'; // Carta de correção aplicada

export interface InvoiceItem {
    id: string;
    productId: string;
    productName: string;
    ncm?: string;        // Código NCM do produto
    cfop?: string;       // Código Fiscal de Operações
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount?: number;
    // Tributos (para integração futura)
    icms?: number;
    ipi?: number;
    pis?: number;
    cofins?: number;
}

export interface InvoiceRecipient {
    type: 'CPF' | 'CNPJ';
    document: string;
    name: string;
    email?: string;
    phone?: string;
    // Endereço
    address?: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
        ibgeCode?: string;
    };
}

export interface Invoice {
    id: string;
    tenantId: string;
    saleId?: string;         // Venda relacionada (opcional)
    type: InvoiceType;
    status: InvoiceStatus;
    number?: string;         // Número da nota (gerado pela SEFAZ)
    series?: string;         // Série da nota
    accessKey?: string;      // Chave de acesso (44 dígitos)
    protocolNumber?: string; // Protocolo de autorização

    // Emitente (preenchido automaticamente da config)
    issuerCnpj: string;
    issuerName: string;

    // Destinatário
    recipient: InvoiceRecipient;

    // Itens
    items: InvoiceItem[];

    // Valores
    totalProducts: number;
    totalDiscount: number;
    shippingCost?: number;
    totalInvoice: number;

    // Pagamento
    paymentMethod: 'CASH' | 'CREDIT' | 'DEBIT' | 'PIX' | 'OTHER';

    // Observações
    notes?: string;
    internalNotes?: string;

    // Datas
    createdAt: Date;
    issuedAt?: Date;         // Data de emissão (autorização)
    cancelledAt?: Date;

    // Arquivos (URLs)
    xmlUrl?: string;
    pdfUrl?: string;

    // Erros (se houver)
    errorCode?: string;
    errorMessage?: string;
}

// Configuração fiscal da empresa
export interface FiscalConfig {
    id: string;
    tenantId: string;

    // Dados da empresa
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    inscricaoEstadual?: string;
    inscricaoMunicipal?: string;

    // Regime tributário
    taxRegime: 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI';

    // Endereço
    address: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
        ibgeCode?: string;
    };

    // Contato
    email: string;
    phone: string;

    // Certificado Digital (info, não o arquivo em si)
    certificateStatus: 'NOT_CONFIGURED' | 'VALID' | 'EXPIRED' | 'INVALID';
    certificateExpiry?: Date;

    // Configurações de emissão
    defaultSeries: string;
    environment: 'PRODUCTION' | 'HOMOLOGATION'; // Produção ou testes

    // API de integração (para futuro)
    apiProvider?: 'NFEIO' | 'FOCUS' | 'WEBMANIA' | 'ENOTAS' | 'NONE';
    apiKey?: string;

    // Controle
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Uso de notas no plano
export interface InvoiceUsage {
    tenantId: string;
    month: number;       // YYYYMM format
    invoicesIssued: number;
    invoicesLimit: number;
    overageInvoices: number;
    overageCost: number;
}

// Planos com limite de notas
export interface PlanWithInvoices {
    id: string;
    name: string;
    price: number;
    invoicesIncluded: number;    // 0 = sem notas, -1 = ilimitado
    overagePrice: number;        // Preço por nota excedente
    features: string[];
}

// Resposta da API de emissão (para integração futura)
export interface InvoiceApiResponse {
    success: boolean;
    invoiceId?: string;
    number?: string;
    series?: string;
    accessKey?: string;
    protocolNumber?: string;
    xmlUrl?: string;
    pdfUrl?: string;
    errorCode?: string;
    errorMessage?: string;
}
