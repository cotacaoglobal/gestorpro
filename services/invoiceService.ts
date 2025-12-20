// Invoice Service - Prepared for NF-e API Integration
// Currently works with local simulation, ready to connect to NFe.io, Focus, etc.

import { supabase } from './supabaseClient';
import {
    Invoice,
    InvoiceType,
    InvoiceStatus,
    InvoiceItem,
    InvoiceRecipient,
    FiscalConfig,
    InvoiceUsage,
    InvoiceApiResponse
} from '../types/invoice';

// Simulated API delay for realistic UX
const simulateApiDelay = () => new Promise(resolve => setTimeout(resolve, 1500));

export const InvoiceService = {
    // =====================================================
    // CONFIGURAÇÃO FISCAL
    // =====================================================

    /**
     * Buscar configuração fiscal do tenant
     */
    getFiscalConfig: async (tenantId: string): Promise<FiscalConfig | null> => {
        const { data, error } = await supabase
            .from('fiscal_configs')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching fiscal config:', error);
            return null;
        }

        return InvoiceService.mapFiscalConfigFromDb(data);
    },

    /**
     * Salvar/atualizar configuração fiscal
     */
    saveFiscalConfig: async (config: Partial<FiscalConfig> & { tenantId: string }): Promise<{ success: boolean; error?: string }> => {
        const dbData = {
            tenant_id: config.tenantId,
            cnpj: config.cnpj,
            razao_social: config.razaoSocial,
            nome_fantasia: config.nomeFantasia,
            inscricao_estadual: config.inscricaoEstadual,
            inscricao_municipal: config.inscricaoMunicipal,
            tax_regime: config.taxRegime,
            address_street: config.address?.street,
            address_number: config.address?.number,
            address_complement: config.address?.complement,
            address_neighborhood: config.address?.neighborhood,
            address_city: config.address?.city,
            address_state: config.address?.state,
            address_zip_code: config.address?.zipCode,
            address_ibge_code: config.address?.ibgeCode,
            email: config.email,
            phone: config.phone,
            default_series: config.defaultSeries || '1',
            environment: config.environment || 'HOMOLOGATION',
            api_provider: config.apiProvider || 'NONE',
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('fiscal_configs')
            .upsert(dbData, { onConflict: 'tenant_id' });

        if (error) {
            console.error('Error saving fiscal config:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    },

    // =====================================================
    // EMISSÃO DE NOTAS
    // =====================================================

    /**
     * Verificar se pode emitir nota (limite do plano)
     */
    canIssueInvoice: async (tenantId: string): Promise<{
        canIssue: boolean;
        isUnlimited: boolean;
        issued: number;
        limit: number;
        remaining: number;
        overageCount: number;
    }> => {
        const { data, error } = await supabase.rpc('can_issue_invoice', {
            p_tenant_id: tenantId
        });

        if (error) {
            console.error('Error checking invoice limit:', error);
            // Default: allow but warn
            return {
                canIssue: true,
                isUnlimited: false,
                issued: 0,
                limit: 0,
                remaining: 0,
                overageCount: 0
            };
        }

        return {
            canIssue: data.can_issue,
            isUnlimited: data.is_unlimited,
            issued: data.issued,
            limit: data.limit,
            remaining: data.remaining,
            overageCount: data.overage_count || 0
        };
    },

    /**
     * Criar rascunho de nota fiscal
     */
    createDraft: async (
        tenantId: string,
        type: InvoiceType,
        recipient: InvoiceRecipient,
        items: Omit<InvoiceItem, 'id'>[],
        paymentMethod: string,
        saleId?: string,
        notes?: string
    ): Promise<{ success: boolean; invoice?: Invoice; error?: string }> => {
        // Buscar config fiscal
        const config = await InvoiceService.getFiscalConfig(tenantId);
        if (!config) {
            return { success: false, error: 'Configuração fiscal não encontrada. Configure os dados da empresa primeiro.' };
        }

        // Calcular totais
        const totalProducts = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
        const totalInvoice = totalProducts - totalDiscount;

        // Inserir nota
        const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                tenant_id: tenantId,
                sale_id: saleId,
                type,
                status: 'DRAFT',
                issuer_cnpj: config.cnpj,
                issuer_name: config.razaoSocial,
                recipient_type: recipient.type,
                recipient_document: recipient.document,
                recipient_name: recipient.name,
                recipient_email: recipient.email,
                recipient_phone: recipient.phone,
                recipient_address: recipient.address,
                total_products: totalProducts,
                total_discount: totalDiscount,
                total_invoice: totalInvoice,
                payment_method: paymentMethod,
                notes,
            })
            .select()
            .single();

        if (invoiceError) {
            console.error('Error creating invoice draft:', invoiceError);
            return { success: false, error: invoiceError.message };
        }

        // Inserir itens
        const itemsToInsert = items.map(item => ({
            invoice_id: invoiceData.id,
            product_id: item.productId,
            product_name: item.productName,
            ncm: item.ncm,
            cfop: item.cfop,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            discount: item.discount || 0,
        }));

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('Error creating invoice items:', itemsError);
            // Rollback: delete invoice
            await supabase.from('invoices').delete().eq('id', invoiceData.id);
            return { success: false, error: itemsError.message };
        }

        return {
            success: true,
            invoice: InvoiceService.mapInvoiceFromDb(invoiceData, items as InvoiceItem[])
        };
    },

    /**
     * Emitir nota fiscal (enviar para SEFAZ)
     * NOTA: Atualmente simula a emissão. Quando integrar com API real,
     * substituir o conteúdo deste método.
     */
    issueInvoice: async (invoiceId: string): Promise<InvoiceApiResponse> => {
        // Buscar nota
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (error || !invoice) {
            return { success: false, errorMessage: 'Nota não encontrada' };
        }

        if (invoice.status !== 'DRAFT') {
            return { success: false, errorMessage: 'Apenas notas em rascunho podem ser emitidas' };
        }

        // Atualizar para PENDING
        await supabase
            .from('invoices')
            .update({ status: 'PENDING' })
            .eq('id', invoiceId);

        // ============================================================
        // SIMULAÇÃO DE EMISSÃO
        // Quando integrar com API real (NFe.io, Focus, etc), 
        // substituir este bloco pelo código de integração
        // ============================================================
        await simulateApiDelay();

        // Gerar número fictício para demonstração
        const fakeNumber = Math.floor(Math.random() * 900000 + 100000).toString();
        const fakeSeries = '1';
        const fakeAccessKey = Array(44).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
        const fakeProtocol = `${Date.now()}`;

        // Atualizar nota como autorizada
        const { error: updateError } = await supabase
            .from('invoices')
            .update({
                status: 'AUTHORIZED',
                number: fakeNumber,
                series: fakeSeries,
                access_key: fakeAccessKey,
                protocol_number: fakeProtocol,
                issued_at: new Date().toISOString(),
                // Em produção, aqui viriam as URLs reais do XML e PDF
                xml_url: null,
                pdf_url: null,
            })
            .eq('id', invoiceId);

        if (updateError) {
            return { success: false, errorMessage: updateError.message };
        }

        return {
            success: true,
            invoiceId,
            number: fakeNumber,
            series: fakeSeries,
            accessKey: fakeAccessKey,
            protocolNumber: fakeProtocol,
        };
        // ============================================================
        // FIM DA SIMULAÇÃO
        // ============================================================
    },

    /**
     * Cancelar nota fiscal
     */
    cancelInvoice: async (invoiceId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (error || !invoice) {
            return { success: false, error: 'Nota não encontrada' };
        }

        if (invoice.status !== 'AUTHORIZED') {
            return { success: false, error: 'Apenas notas autorizadas podem ser canceladas' };
        }

        // Verificar prazo (24h para cancelamento)
        const issuedAt = new Date(invoice.issued_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - issuedAt.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            return { success: false, error: 'Prazo de 24 horas para cancelamento excedido' };
        }

        // SIMULAÇÃO: Em produção, enviaria para API de cancelamento
        await simulateApiDelay();

        const { error: updateError } = await supabase
            .from('invoices')
            .update({
                status: 'CANCELLED',
                cancelled_at: new Date().toISOString(),
                internal_notes: `Motivo do cancelamento: ${reason}`,
            })
            .eq('id', invoiceId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true };
    },

    // =====================================================
    // CONSULTAS
    // =====================================================

    /**
     * Listar notas fiscais
     */
    listInvoices: async (
        tenantId: string,
        filters?: {
            type?: InvoiceType;
            status?: InvoiceStatus;
            startDate?: Date;
            endDate?: Date;
            search?: string;
        },
        limit = 50,
        offset = 0
    ): Promise<{ invoices: Invoice[]; total: number }> => {
        let query = supabase
            .from('invoices')
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
        if (filters?.search) {
            query = query.or(`recipient_name.ilike.%${filters.search}%,recipient_document.ilike.%${filters.search}%,number.ilike.%${filters.search}%`);
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error listing invoices:', error);
            return { invoices: [], total: 0 };
        }

        const invoices = data.map(inv => InvoiceService.mapInvoiceFromDb(inv));
        return { invoices, total: count || 0 };
    },

    /**
     * Buscar nota por ID com itens
     */
    getInvoiceById: async (invoiceId: string): Promise<Invoice | null> => {
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (error || !invoice) {
            return null;
        }

        const { data: items } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoiceId);

        return InvoiceService.mapInvoiceFromDb(invoice, items || []);
    },

    /**
     * Buscar uso de notas do mês
     */
    getMonthlyUsage: async (tenantId: string): Promise<InvoiceUsage | null> => {
        const currentMonth = new Date().getFullYear() * 100 + (new Date().getMonth() + 1);

        const { data, error } = await supabase
            .from('invoice_usage')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('month', currentMonth)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('Error fetching usage:', error);
            return null;
        }

        return {
            tenantId: data.tenant_id,
            month: data.month,
            invoicesIssued: data.invoices_issued,
            invoicesLimit: data.invoices_limit,
            overageInvoices: data.overage_invoices,
            overageCost: data.overage_cost,
        };
    },

    // =====================================================
    // HELPERS
    // =====================================================

    mapFiscalConfigFromDb: (data: any): FiscalConfig => ({
        id: data.id,
        tenantId: data.tenant_id,
        cnpj: data.cnpj,
        razaoSocial: data.razao_social,
        nomeFantasia: data.nome_fantasia,
        inscricaoEstadual: data.inscricao_estadual,
        inscricaoMunicipal: data.inscricao_municipal,
        taxRegime: data.tax_regime,
        address: {
            street: data.address_street,
            number: data.address_number,
            complement: data.address_complement,
            neighborhood: data.address_neighborhood,
            city: data.address_city,
            state: data.address_state,
            zipCode: data.address_zip_code,
            ibgeCode: data.address_ibge_code,
        },
        email: data.email,
        phone: data.phone,
        certificateStatus: data.certificate_status,
        certificateExpiry: data.certificate_expiry ? new Date(data.certificate_expiry) : undefined,
        defaultSeries: data.default_series,
        environment: data.environment,
        apiProvider: data.api_provider,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    }),

    mapInvoiceFromDb: (data: any, items?: any[]): Invoice => ({
        id: data.id,
        tenantId: data.tenant_id,
        saleId: data.sale_id,
        type: data.type,
        status: data.status,
        number: data.number,
        series: data.series,
        accessKey: data.access_key,
        protocolNumber: data.protocol_number,
        issuerCnpj: data.issuer_cnpj,
        issuerName: data.issuer_name,
        recipient: {
            type: data.recipient_type,
            document: data.recipient_document,
            name: data.recipient_name,
            email: data.recipient_email,
            phone: data.recipient_phone,
            address: data.recipient_address,
        },
        items: items?.map(item => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            ncm: item.ncm,
            cfop: item.cfop,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price,
            discount: item.discount,
        })) || [],
        totalProducts: parseFloat(data.total_products),
        totalDiscount: parseFloat(data.total_discount),
        shippingCost: data.shipping_cost ? parseFloat(data.shipping_cost) : undefined,
        totalInvoice: parseFloat(data.total_invoice),
        paymentMethod: data.payment_method,
        notes: data.notes,
        internalNotes: data.internal_notes,
        createdAt: new Date(data.created_at),
        issuedAt: data.issued_at ? new Date(data.issued_at) : undefined,
        cancelledAt: data.cancelled_at ? new Date(data.cancelled_at) : undefined,
        xmlUrl: data.xml_url,
        pdfUrl: data.pdf_url,
        errorCode: data.error_code,
        errorMessage: data.error_message,
    }),

    // Formatar CNPJ
    formatCnpj: (cnpj: string): string => {
        const numbers = cnpj.replace(/\D/g, '');
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    },

    // Formatar CPF
    formatCpf: (cpf: string): string => {
        const numbers = cpf.replace(/\D/g, '');
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    // Validar CNPJ
    validateCnpj: (cnpj: string): boolean => {
        const numbers = cnpj.replace(/\D/g, '');
        if (numbers.length !== 14) return false;
        if (/^(\d)\1+$/.test(numbers)) return false;

        // Validação do dígito verificador
        let sum = 0;
        let weight = 2;
        for (let i = 11; i >= 0; i--) {
            sum += parseInt(numbers[i]) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (parseInt(numbers[12]) !== digit1) return false;

        sum = 0;
        weight = 2;
        for (let i = 12; i >= 0; i--) {
            sum += parseInt(numbers[i]) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        return parseInt(numbers[13]) === digit2;
    },

    // Validar CPF
    validateCpf: (cpf: string): boolean => {
        const numbers = cpf.replace(/\D/g, '');
        if (numbers.length !== 11) return false;
        if (/^(\d)\1+$/.test(numbers)) return false;

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(numbers[i]) * (10 - i);
        }
        let digit1 = (sum * 10) % 11;
        if (digit1 === 10) digit1 = 0;
        if (parseInt(numbers[9]) !== digit1) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(numbers[i]) * (11 - i);
        }
        let digit2 = (sum * 10) % 11;
        if (digit2 === 10) digit2 = 0;
        return parseInt(numbers[10]) === digit2;
    },
};
