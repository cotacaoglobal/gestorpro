import React, { useState, useEffect } from 'react';
import {
    Receipt,
    Plus,
    Search,
    Filter,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Download,
    Eye,
    RotateCcw,
    Settings,
    ChevronDown,
    X,
    Building2,
    User as UserIcon,
    Calendar,
    CreditCard,
    Package,
    Loader2,
    Info,
    Sparkles
} from 'lucide-react';
import { User } from '../types';
import { Invoice, InvoiceType, InvoiceStatus, FiscalConfig } from '../types/invoice';
import { InvoiceService } from '../services/invoiceService';

interface InvoiceManagerProps {
    user: User;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ user }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalInvoices, setTotalInvoices] = useState(0);
    const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig | null>(null);
    const [usageInfo, setUsageInfo] = useState<{
        issued: number;
        limit: number;
        remaining: number;
        isUnlimited: boolean;
    } | null>(null);

    // Modals
    const [showNewInvoice, setShowNewInvoice] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [showDetails, setShowDetails] = useState<Invoice | null>(null);

    // Filters
    const [filterType, setFilterType] = useState<InvoiceType | ''>('');
    const [filterStatus, setFilterStatus] = useState<InvoiceStatus | ''>('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, [user.tenantId, filterType, filterStatus]);

    const loadData = async () => {
        if (!user.tenantId) return;
        setLoading(true);

        try {
            // Carregar config fiscal
            const config = await InvoiceService.getFiscalConfig(user.tenantId);
            setFiscalConfig(config);

            // Carregar uso do mês
            const canIssue = await InvoiceService.canIssueInvoice(user.tenantId);
            setUsageInfo({
                issued: canIssue.issued,
                limit: canIssue.limit,
                remaining: canIssue.remaining,
                isUnlimited: canIssue.isUnlimited,
            });

            // Carregar notas
            const filters: any = {};
            if (filterType) filters.type = filterType;
            if (filterStatus) filters.status = filterStatus;
            if (searchTerm) filters.search = searchTerm;

            const { invoices: data, total } = await InvoiceService.listInvoices(
                user.tenantId,
                Object.keys(filters).length > 0 ? filters : undefined
            );
            setInvoices(data);
            setTotalInvoices(total);
        } catch (error) {
            console.error('Error loading invoice data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: InvoiceStatus) => {
        const styles: Record<InvoiceStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
            DRAFT: { bg: 'bg-slate-100', text: 'text-slate-600', icon: <FileText className="w-4 h-4" />, label: 'Rascunho' },
            PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock className="w-4 h-4" />, label: 'Processando' },
            AUTHORIZED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Autorizada' },
            CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Cancelada' },
            DENIED: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertCircle className="w-4 h-4" />, label: 'Rejeitada' },
            CORRECTED: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <RotateCcw className="w-4 h-4" />, label: 'Corrigida' },
        };
        const style = styles[status];
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                {style.icon}
                {style.label}
            </span>
        );
    };

    const getTypeBadge = (type: InvoiceType) => {
        const labels: Record<InvoiceType, string> = {
            NFE: 'NF-e',
            NFCE: 'NFC-e',
            NFSE: 'NFS-e',
            NFPE: 'NFP-e',
            MDFE: 'MDF-e',
        };
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-violet-100 text-violet-700">
                {labels[type]}
            </span>
        );
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    // Check if fiscal config is complete
    const isConfigComplete = fiscalConfig && fiscalConfig.cnpj && fiscalConfig.razaoSocial;

    return (
        <div className="p-2.5 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-3 mb-4 md:mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Receipt className="w-6 h-6 md:w-7 md:h-7 text-violet-600" />
                        Notas Fiscais
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">Emita e gerencie notas fiscais eletrônicas</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <button
                        onClick={() => setShowConfig(true)}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm md:text-base"
                    >
                        <Settings className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Configurar</span>
                    </button>
                    <button
                        onClick={() => isConfigComplete ? setShowNewInvoice(true) : setShowConfig(true)}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 text-sm md:text-base"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        Emitir Nota
                    </button>
                </div>
            </div>

            {/* Usage Info Card */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                    <div>
                        <h3 className="text-base md:text-lg font-bold mb-1 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                            Uso do Mês
                        </h3>
                        <p className="text-violet-200 text-xs md:text-sm">
                            {usageInfo?.isUnlimited
                                ? 'Emissão ilimitada de notas'
                                : `Notas emitidas este mês`}
                        </p>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                        {!usageInfo?.isUnlimited && (
                            <>
                                <div className="text-center">
                                    <div className="text-2xl md:text-3xl font-black">{usageInfo?.issued || 0}</div>
                                    <div className="text-xs text-violet-200">Emitidas</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl md:text-3xl font-black">{usageInfo?.limit || 0}</div>
                                    <div className="text-xs text-violet-200">Limite</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl md:text-3xl font-black">{usageInfo?.remaining || 0}</div>
                                    <div className="text-xs text-violet-200">Restantes</div>
                                </div>
                            </>
                        )}
                        {usageInfo?.isUnlimited && (
                            <div className="text-center">
                                <div className="text-2xl md:text-3xl font-black">∞</div>
                                <div className="text-xs text-violet-200">Ilimitado</div>
                            </div>
                        )}
                    </div>
                </div>
                {usageInfo && usageInfo.limit > 0 && !usageInfo.isUnlimited && (
                    <div className="mt-3 md:mt-4">
                        <div className="h-1.5 md:h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all"
                                style={{ width: `${Math.min(100, (usageInfo.issued / usageInfo.limit) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Config Alert */}
            {!isConfigComplete && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex items-start gap-2 md:gap-3">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-amber-800 text-sm md:text-base">Configure os dados fiscais</h4>
                        <p className="text-xs md:text-sm text-amber-700 mt-1">
                            Configure os dados da empresa (CNPJ, Razão Social) para emitir notas.
                        </p>
                        <button
                            onClick={() => setShowConfig(true)}
                            className="mt-2 md:mt-3 text-xs md:text-sm font-semibold text-amber-800 hover:underline"
                        >
                            Configurar agora →
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou número..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadData()}
                            className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-violet-500 text-sm md:text-base"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as InvoiceType | '')}
                        className="px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-violet-500 font-medium text-sm md:text-base"
                    >
                        <option value="">Todos os Tipos</option>
                        <option value="NFE">NF-e</option>
                        <option value="NFCE">NFC-e</option>
                        <option value="NFSE">NFS-e</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | '')}
                        className="px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-violet-500 font-medium text-sm md:text-base"
                    >
                        <option value="">Todos os Status</option>
                        <option value="DRAFT">Rascunho</option>
                        <option value="AUTHORIZED">Autorizada</option>
                        <option value="CANCELLED">Cancelada</option>
                        <option value="DENIED">Rejeitada</option>
                    </select>
                </div>
            </div>

            {/* Invoice List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12 md:py-20">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-violet-600 animate-spin" />
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-12 md:py-20 px-4">
                        <Receipt className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-base md:text-lg font-semibold text-slate-600">Nenhuma nota encontrada</h3>
                        <p className="text-slate-400 mt-1 text-sm md:text-base">
                            {searchTerm || filterType || filterStatus
                                ? 'Tente ajustar os filtros'
                                : 'Clique em "Emitir Nota" para começar'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Número</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Emissão</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4">
                                            {getTypeBadge(invoice.type)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-mono font-semibold text-slate-800">
                                                {invoice.number || '-'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div>
                                                <div className="font-semibold text-slate-800">{invoice.recipient.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    {invoice.recipient.type}: {invoice.recipient.document}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-semibold text-slate-800">
                                                {formatCurrency(invoice.totalInvoice)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-slate-600">
                                                {invoice.issuedAt ? formatDate(invoice.issuedAt) : formatDate(invoice.createdAt)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setShowDetails(invoice)}
                                                    className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                    title="Ver detalhes"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {invoice.pdfUrl && (
                                                    <button
                                                        onClick={() => window.open(invoice.pdfUrl, '_blank')}
                                                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Baixar PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Total */}
            <div className="mt-3 md:mt-4 text-xs md:text-sm text-slate-500 text-right">
                {totalInvoices} nota{totalInvoices !== 1 ? 's' : ''} encontrada{totalInvoices !== 1 ? 's' : ''}
            </div>

            {/* Config Modal */}
            {showConfig && (
                <FiscalConfigModal
                    tenantId={user.tenantId!}
                    config={fiscalConfig}
                    onClose={() => setShowConfig(false)}
                    onSave={() => {
                        setShowConfig(false);
                        loadData();
                    }}
                />
            )}

            {/* New Invoice Modal */}
            {showNewInvoice && fiscalConfig && (
                <NewInvoiceModal
                    tenantId={user.tenantId!}
                    config={fiscalConfig}
                    onClose={() => setShowNewInvoice(false)}
                    onSuccess={() => {
                        setShowNewInvoice(false);
                        loadData();
                    }}
                />
            )}

            {/* Details Modal */}
            {showDetails && (
                <InvoiceDetailsModal
                    invoice={showDetails}
                    onClose={() => setShowDetails(null)}
                    onCancel={() => {
                        // TODO: Implement cancel
                        setShowDetails(null);
                        loadData();
                    }}
                />
            )}
        </div>
    );
};

// =====================================================
// FISCAL CONFIG MODAL
// =====================================================
interface FiscalConfigModalProps {
    tenantId: string;
    config: FiscalConfig | null;
    onClose: () => void;
    onSave: () => void;
}

const FiscalConfigModal: React.FC<FiscalConfigModalProps> = ({ tenantId, config, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        cnpj: config?.cnpj || '',
        razaoSocial: config?.razaoSocial || '',
        nomeFantasia: config?.nomeFantasia || '',
        inscricaoEstadual: config?.inscricaoEstadual || '',
        inscricaoMunicipal: config?.inscricaoMunicipal || '',
        taxRegime: config?.taxRegime || 'SIMPLES',
        email: config?.email || '',
        phone: config?.phone || '',
        street: config?.address?.street || '',
        number: config?.address?.number || '',
        complement: config?.address?.complement || '',
        neighborhood: config?.address?.neighborhood || '',
        city: config?.address?.city || '',
        state: config?.address?.state || '',
        zipCode: config?.address?.zipCode || '',
        environment: config?.environment || 'HOMOLOGATION',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate CNPJ
        if (!InvoiceService.validateCnpj(formData.cnpj)) {
            setError('CNPJ inválido');
            setLoading(false);
            return;
        }

        try {
            const result = await InvoiceService.saveFiscalConfig({
                tenantId,
                cnpj: formData.cnpj.replace(/\D/g, ''),
                razaoSocial: formData.razaoSocial,
                nomeFantasia: formData.nomeFantasia,
                inscricaoEstadual: formData.inscricaoEstadual,
                inscricaoMunicipal: formData.inscricaoMunicipal,
                taxRegime: formData.taxRegime as any,
                email: formData.email,
                phone: formData.phone,
                address: {
                    street: formData.street,
                    number: formData.number,
                    complement: formData.complement,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                },
                environment: formData.environment as any,
            });

            if (result.success) {
                onSave();
            } else {
                setError(result.error || 'Erro ao salvar configuração');
            }
        } catch (err) {
            setError('Erro ao salvar configuração');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Configuração Fiscal</h2>
                        <p className="text-sm text-slate-500">Dados da empresa para emissão de notas</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Dados da Empresa */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> Dados da Empresa
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">CNPJ *</label>
                                <input
                                    type="text"
                                    value={formData.cnpj}
                                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                                    placeholder="00.000.000/0000-00"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Regime Tributário</label>
                                <select
                                    value={formData.taxRegime}
                                    onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="SIMPLES">Simples Nacional</option>
                                    <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                                    <option value="LUCRO_REAL">Lucro Real</option>
                                    <option value="MEI">MEI</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Razão Social *</label>
                                <input
                                    type="text"
                                    value={formData.razaoSocial}
                                    onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Fantasia</label>
                                <input
                                    type="text"
                                    value={formData.nomeFantasia}
                                    onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Inscrição Estadual</label>
                                <input
                                    type="text"
                                    value={formData.inscricaoEstadual}
                                    onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Inscrição Municipal</label>
                                <input
                                    type="text"
                                    value={formData.inscricaoMunicipal}
                                    onChange={(e) => setFormData({ ...formData, inscricaoMunicipal: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contato */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3">Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Telefone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Logradouro</label>
                                <input
                                    type="text"
                                    value={formData.street}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Número</label>
                                <input
                                    type="text"
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Bairro</label>
                                <input
                                    type="text"
                                    value={formData.neighborhood}
                                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Cidade</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
                                <select
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">Selecione</option>
                                    {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">CEP</label>
                                <input
                                    type="text"
                                    value={formData.zipCode}
                                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ambiente */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-800">Ambiente de Emissão</h4>
                                <p className="text-sm text-amber-700 mt-1 mb-3">
                                    O ambiente de homologação é para testes. Use produção apenas quando estiver pronto para emitir notas reais.
                                </p>
                                <select
                                    value={formData.environment}
                                    onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                                    className="px-4 py-2 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="HOMOLOGATION">Homologação (Testes)</option>
                                    <option value="PRODUCTION">Produção (Real)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Salvar Configuração
                    </button>
                </div>
            </div>
        </div>
    );
};

// =====================================================
// NEW INVOICE MODAL (Simplified for now)
// =====================================================
interface NewInvoiceModalProps {
    tenantId: string;
    config: FiscalConfig;
    onClose: () => void;
    onSuccess: () => void;
}

const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({ tenantId, config, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [invoiceType, setInvoiceType] = useState<InvoiceType>('NFCE');
    const [recipient, setRecipient] = useState({
        type: 'CPF' as 'CPF' | 'CNPJ',
        document: '',
        name: '',
        email: '',
    });

    const handleIssue = async () => {
        setLoading(true);
        try {
            // Create draft with mock items for demonstration
            const result = await InvoiceService.createDraft(
                tenantId,
                invoiceType,
                recipient,
                [{
                    productId: '',
                    productName: 'Produto Demonstração',
                    quantity: 1,
                    unitPrice: 100,
                    totalPrice: 100,
                }],
                'PIX'
            );

            if (result.success && result.invoice) {
                // Issue the invoice
                const issueResult = await InvoiceService.issueInvoice(result.invoice.id);
                if (issueResult.success) {
                    alert(`Nota emitida com sucesso!\nNúmero: ${issueResult.number}\nSérie: ${issueResult.series}`);
                    onSuccess();
                } else {
                    alert('Erro ao emitir nota: ' + issueResult.errorMessage);
                }
            } else {
                alert('Erro ao criar nota: ' + result.error);
            }
        } catch (error) {
            console.error('Error issuing invoice:', error);
            alert('Erro ao emitir nota');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Emitir Nota Fiscal</h2>
                        <p className="text-sm text-slate-500">Preencha os dados para emissão</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Invoice Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Tipo de Nota</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['NFCE', 'NFE', 'NFSE'] as InvoiceType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setInvoiceType(type)}
                                    className={`p-4 rounded-xl border-2 transition-all ${invoiceType === type
                                        ? 'border-violet-500 bg-violet-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <Receipt className={`w-6 h-6 mx-auto mb-2 ${invoiceType === type ? 'text-violet-600' : 'text-slate-400'}`} />
                                    <div className={`text-sm font-bold ${invoiceType === type ? 'text-violet-600' : 'text-slate-600'}`}>
                                        {type === 'NFCE' ? 'NFC-e' : type === 'NFE' ? 'NF-e' : 'NFS-e'}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {type === 'NFCE' ? 'Consumidor' : type === 'NFE' ? 'Venda B2B' : 'Serviço'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recipient */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Dados do Cliente</label>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRecipient({ ...recipient, type: 'CPF' })}
                                    className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${recipient.type === 'CPF' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}
                                >
                                    CPF
                                </button>
                                <button
                                    onClick={() => setRecipient({ ...recipient, type: 'CNPJ' })}
                                    className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${recipient.type === 'CNPJ' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}
                                >
                                    CNPJ
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder={recipient.type === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                value={recipient.document}
                                onChange={(e) => setRecipient({ ...recipient, document: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                            />
                            <input
                                type="text"
                                placeholder="Nome do cliente"
                                value={recipient.name}
                                onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                            />
                            <input
                                type="email"
                                placeholder="Email (opcional - para envio do XML)"
                                value={recipient.email}
                                onChange={(e) => setRecipient({ ...recipient, email: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                            <strong>Modo Demonstração:</strong> A nota será simulada. Quando integrar com uma API de emissão,
                            a nota será enviada para a SEFAZ automaticamente.
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleIssue}
                        disabled={loading || !recipient.document || !recipient.name}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Emitir Nota
                    </button>
                </div>
            </div>
        </div>
    );
};

// =====================================================
// INVOICE DETAILS MODAL
// =====================================================
interface InvoiceDetailsModalProps {
    invoice: Invoice;
    onClose: () => void;
    onCancel: () => void;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ invoice, onClose, onCancel }) => {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Detalhes da Nota</h2>
                        <p className="text-sm text-slate-500">
                            {invoice.type} • {invoice.number ? `Nº ${invoice.number}` : 'Sem número'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <span className="font-semibold text-slate-600">Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${invoice.status === 'AUTHORIZED' ? 'bg-emerald-100 text-emerald-700' :
                            invoice.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                            }`}>
                            {invoice.status}
                        </span>
                    </div>

                    {/* Key Info */}
                    {invoice.accessKey && (
                        <div className="p-4 bg-violet-50 rounded-xl">
                            <div className="text-xs font-semibold text-violet-600 mb-1">Chave de Acesso</div>
                            <div className="font-mono text-sm text-violet-800 break-all">{invoice.accessKey}</div>
                        </div>
                    )}

                    {/* Recipient */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Destinatário</h4>
                        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Nome</span>
                                <span className="font-semibold">{invoice.recipient.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{invoice.recipient.type}</span>
                                <span className="font-mono">{invoice.recipient.document}</span>
                            </div>
                        </div>
                    </div>

                    {/* Values */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Valores</h4>
                        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Produtos</span>
                                <span className="font-semibold">{formatCurrency(invoice.totalProducts)}</span>
                            </div>
                            {invoice.totalDiscount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Desconto</span>
                                    <span className="font-semibold text-red-600">-{formatCurrency(invoice.totalDiscount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-slate-200">
                                <span className="font-semibold text-slate-700">Total</span>
                                <span className="font-bold text-lg text-emerald-600">{formatCurrency(invoice.totalInvoice)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-between">
                    {invoice.status === 'AUTHORIZED' && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold"
                        >
                            Cancelar Nota
                        </button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        {invoice.pdfUrl && (
                            <button
                                onClick={() => window.open(invoice.pdfUrl, '_blank')}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /> PDF
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-violet-600 text-white rounded-lg font-semibold"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceManager;
