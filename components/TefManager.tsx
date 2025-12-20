import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Smartphone,
    Settings,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Wifi,
    WifiOff,
    RefreshCw,
    ChevronDown,
    X,
    Loader2,
    Zap,
    TrendingUp,
    Calendar,
    DollarSign,
    Receipt,
    Ban,
    Eye,
    Info,
} from 'lucide-react';
import { User } from '../types';
import { TefConfig, TefTransaction, TefProvider, TefDailySummary, TefConnectionStatus } from '../types/tef';
import { TefService } from '../services/tefService';

interface TefManagerProps {
    user: User;
}

const PROVIDERS: { id: TefProvider; name: string; logo: string }[] = [
    { id: 'STONE', name: 'Stone', logo: '🪨' },
    { id: 'CIELO', name: 'Cielo', logo: '🔵' },
    { id: 'REDE', name: 'Rede', logo: '🔴' },
    { id: 'PAGSEGURO', name: 'PagSeguro', logo: '🟢' },
    { id: 'GETNET', name: 'Getnet', logo: '🟠' },
    { id: 'MERCADOPAGO', name: 'Mercado Pago', logo: '💙' },
    { id: 'SUMUP', name: 'SumUp', logo: '📱' },
];

const TefManager: React.FC<TefManagerProps> = ({ user }) => {
    const [config, setConfig] = useState<TefConfig | null>(null);
    const [transactions, setTransactions] = useState<TefTransaction[]>([]);
    const [summary, setSummary] = useState<TefDailySummary | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<TefConnectionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [totalTransactions, setTotalTransactions] = useState(0);

    // Modals
    const [showConfig, setShowConfig] = useState(false);
    const [showDetails, setShowDetails] = useState<TefTransaction | null>(null);

    // Filters
    const [filterType, setFilterType] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        loadData();
    }, [user.tenantId]);

    useEffect(() => {
        if (user.tenantId) {
            loadTransactions();
        }
    }, [filterType, filterStatus]);

    const loadData = async () => {
        if (!user.tenantId) return;
        setLoading(true);

        try {
            // Carregar config
            const configData = await TefService.getConfig(user.tenantId);
            setConfig(configData);

            // Verificar conexão
            const status = await TefService.checkConnection(user.tenantId);
            setConnectionStatus(status);

            // Carregar resumo do dia
            const summaryData = await TefService.getDailySummary(user.tenantId);
            setSummary(summaryData);

            // Carregar transações
            await loadTransactions();
        } catch (error) {
            console.error('Error loading TEF data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async () => {
        if (!user.tenantId) return;

        const filters: any = {};
        if (filterType) filters.type = filterType;
        if (filterStatus) filters.status = filterStatus;

        const { transactions: data, total } = await TefService.listTransactions(
            user.tenantId,
            Object.keys(filters).length > 0 ? filters : undefined
        );
        setTransactions(data);
        setTotalTransactions(total);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
            PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock className="w-4 h-4" />, label: 'Pendente' },
            PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <RefreshCw className="w-4 h-4 animate-spin" />, label: 'Processando' },
            APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Aprovada' },
            DECLINED: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Recusada' },
            CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-700', icon: <Ban className="w-4 h-4" />, label: 'Cancelada' },
            ERROR: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertCircle className="w-4 h-4" />, label: 'Erro' },
            TIMEOUT: { bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock className="w-4 h-4" />, label: 'Timeout' },
        };
        const style = styles[status] || styles.PENDING;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                {style.icon}
                {style.label}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        const labels: Record<string, { label: string; color: string }> = {
            CREDIT: { label: 'Crédito', color: 'bg-violet-100 text-violet-700' },
            CREDIT_INST: { label: 'Crédito Parc.', color: 'bg-purple-100 text-purple-700' },
            DEBIT: { label: 'Débito', color: 'bg-blue-100 text-blue-700' },
            PIX: { label: 'Pix', color: 'bg-teal-100 text-teal-700' },
            VOUCHER: { label: 'Voucher', color: 'bg-orange-100 text-orange-700' },
        };
        const style = labels[type] || { label: type, color: 'bg-slate-100 text-slate-700' };
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${style.color}`}>
                {style.label}
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

    const isConfigured = config && config.isActive && config.provider !== 'NONE';

    return (
        <div className="p-2.5 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-3 mb-4 md:mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
                        Integração TEF
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">Gerencie transações de cartão e Pix</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    {/* Connection Status */}
                    <div className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-sm md:text-base ${connectionStatus?.isConnected
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                        }`}>
                        {connectionStatus?.isConnected ? (
                            <>
                                <Wifi className="w-5 h-5" />
                                <span className="font-semibold">Conectado</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-5 h-5" />
                                <span className="font-semibold">Desconectado</span>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setShowConfig(true)}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 text-sm md:text-base"
                    >
                        <Settings className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Configurar</span> TEF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-6">
                    <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl md:rounded-2xl p-3 md:p-4 text-white">
                        <div className="flex items-center gap-1.5 md:gap-2 text-emerald-100 text-xs md:text-sm mb-1">
                            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                            Total Hoje
                        </div>
                        <div className="text-xl md:text-2xl font-black">{formatCurrency(summary.totalAmount)}</div>
                        <div className="text-emerald-100 text-xs mt-1">{summary.totalTransactions} transações</div>
                    </div>

                    <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200">
                        <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 text-xs md:text-sm mb-1">
                            <CreditCard className="w-3 h-3 md:w-4 md:h-4" />
                            Crédito
                        </div>
                        <div className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(summary.byType?.credit?.amount || 0)}</div>
                        <div className="text-slate-400 text-xs mt-1">{summary.byType?.credit?.count || 0} vendas</div>
                    </div>

                    <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200">
                        <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 text-xs md:text-sm mb-1">
                            <CreditCard className="w-3 h-3 md:w-4 md:h-4" />
                            Débito
                        </div>
                        <div className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(summary.byType?.debit?.amount || 0)}</div>
                        <div className="text-slate-400 text-xs mt-1">{summary.byType?.debit?.count || 0} vendas</div>
                    </div>

                    <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200">
                        <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 text-xs md:text-sm mb-1">
                            <Smartphone className="w-3 h-3 md:w-4 md:h-4" />
                            Pix
                        </div>
                        <div className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(summary.byType?.pix?.amount || 0)}</div>
                        <div className="text-slate-400 text-xs mt-1">{summary.byType?.pix?.count || 0} vendas</div>
                    </div>

                    <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200">
                        <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 text-xs md:text-sm mb-1">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                            Parcelado
                        </div>
                        <div className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(summary.byType?.creditInstallment?.amount || 0)}</div>
                        <div className="text-slate-400 text-xs mt-1">{summary.byType?.creditInstallment?.count || 0} vendas</div>
                    </div>
                </div>
            )}

            {/* Config Alert */}
            {!isConfigured && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex items-start gap-2 md:gap-3">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-amber-800 text-sm md:text-base">Configure a integração TEF</h4>
                        <p className="text-xs md:text-sm text-amber-700 mt-1">
                            Configure seu provedor de pagamentos para processar automaticamente.
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
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-sm md:text-base"
                    >
                        <option value="">Todos os Tipos</option>
                        <option value="CREDIT">Crédito</option>
                        <option value="CREDIT_INST">Crédito Parcelado</option>
                        <option value="DEBIT">Débito</option>
                        <option value="PIX">Pix</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-sm md:text-base"
                    >
                        <option value="">Todos os Status</option>
                        <option value="APPROVED">Aprovadas</option>
                        <option value="DECLINED">Recusadas</option>
                        <option value="CANCELLED">Canceladas</option>
                        <option value="PENDING">Pendentes</option>
                    </select>
                    <button
                        onClick={loadTransactions}
                        className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="sm:inline">Atualizar</span>
                    </button>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12 md:py-20">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-blue-600 animate-spin" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 md:py-20 px-4">
                        <CreditCard className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-base md:text-lg font-semibold text-slate-600">Nenhuma transação encontrada</h3>
                        <p className="text-slate-400 mt-1 text-sm md:text-base">
                            As transações TEF aparecerão aqui
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Bandeira</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Autorização</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Data</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4">
                                            {getTypeBadge(tx.type)}
                                            {tx.installments && tx.installments > 1 && (
                                                <span className="ml-1 text-xs text-slate-500">{tx.installments}x</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-slate-800">
                                                {formatCurrency(tx.amount)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {tx.cardBrand ? (
                                                    <>
                                                        <span className="font-semibold text-slate-700">{tx.cardBrand}</span>
                                                        {tx.cardLastDigits && (
                                                            <span className="text-slate-400 text-xs">****{tx.cardLastDigits}</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-mono text-sm text-slate-600">
                                                {tx.authorizationCode || '-'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-slate-600">
                                                {formatDate(tx.createdAt)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {getStatusBadge(tx.status)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setShowDetails(tx)}
                                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver detalhes"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
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
                {totalTransactions} transaç{totalTransactions !== 1 ? 'ões' : 'ão'} encontrada{totalTransactions !== 1 ? 's' : ''}
            </div>

            {/* Config Modal */}
            {showConfig && (
                <TefConfigModal
                    tenantId={user.tenantId!}
                    config={config}
                    onClose={() => setShowConfig(false)}
                    onSave={() => {
                        setShowConfig(false);
                        loadData();
                    }}
                />
            )}

            {/* Details Modal */}
            {showDetails && (
                <TefDetailsModal
                    transaction={showDetails}
                    onClose={() => setShowDetails(null)}
                />
            )}
        </div>
    );
};

// =====================================================
// TEF CONFIG MODAL
// =====================================================
interface TefConfigModalProps {
    tenantId: string;
    config: TefConfig | null;
    onClose: () => void;
    onSave: () => void;
}

const TefConfigModal: React.FC<TefConfigModalProps> = ({ tenantId, config, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        provider: config?.provider || 'NONE',
        isActive: config?.isActive || false,
        environment: config?.environment || 'SANDBOX',
        autoCapture: config?.autoCapture !== false,
        maxInstallments: config?.maxInstallments || 12,
        minInstallmentValue: config?.minInstallmentValue || 5.00,
        pixEnabled: config?.pixEnabled || false,
        pixKey: config?.pixKey || '',
        pixKeyType: config?.pixKeyType || 'EMAIL',
        pixExpirationMinutes: config?.pixExpirationMinutes || 30,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await TefService.saveConfig({
                tenantId,
                provider: formData.provider as TefProvider,
                isActive: formData.isActive,
                environment: formData.environment as 'PRODUCTION' | 'SANDBOX',
                autoCapture: formData.autoCapture,
                maxInstallments: formData.maxInstallments,
                minInstallmentValue: formData.minInstallmentValue,
                pixEnabled: formData.pixEnabled,
                pixKey: formData.pixKey,
                pixKeyType: formData.pixKeyType as any,
                pixExpirationMinutes: formData.pixExpirationMinutes,
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
                        <h2 className="text-xl font-bold text-slate-800">Configuração TEF</h2>
                        <p className="text-sm text-slate-500">Configure seu provedor de pagamentos</p>
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

                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Provedor de Pagamentos</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {PROVIDERS.map((provider) => (
                                <button
                                    key={provider.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, provider: provider.id })}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.provider === provider.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{provider.logo}</div>
                                    <div className={`text-sm font-semibold ${formData.provider === provider.id ? 'text-blue-600' : 'text-slate-600'}`}>
                                        {provider.name}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ativar */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <h4 className="font-semibold text-slate-800">Ativar Integração TEF</h4>
                            <p className="text-sm text-slate-500">Habilita o processamento automático de pagamentos</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            className={`w-14 h-8 rounded-full transition-colors relative ${formData.isActive ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${formData.isActive ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>

                    {/* Ambiente */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Ambiente</label>
                            <select
                                value={formData.environment}
                                onChange={(e) => setFormData({ ...formData, environment: e.target.value as 'PRODUCTION' | 'SANDBOX' })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="SANDBOX">Sandbox (Testes)</option>
                                <option value="PRODUCTION">Produção</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Máximo de Parcelas</label>
                            <select
                                value={formData.maxInstallments}
                                onChange={(e) => setFormData({ ...formData, maxInstallments: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                    <option key={n} value={n}>{n}x</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Pix */}
                    <div className="border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-teal-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">Pix Integrado</h4>
                                    <p className="text-xs text-slate-500">Gerar QR Code automático</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, pixEnabled: !formData.pixEnabled })}
                                className={`w-14 h-8 rounded-full transition-colors relative ${formData.pixEnabled ? 'bg-teal-600' : 'bg-slate-300'
                                    }`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${formData.pixEnabled ? 'left-7' : 'left-1'
                                    }`} />
                            </button>
                        </div>

                        {formData.pixEnabled && (
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo de Chave</label>
                                    <select
                                        value={formData.pixKeyType}
                                        onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value as 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM' })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="CPF">CPF</option>
                                        <option value="CNPJ">CNPJ</option>
                                        <option value="EMAIL">Email</option>
                                        <option value="PHONE">Telefone</option>
                                        <option value="RANDOM">Chave Aleatória</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Chave Pix</label>
                                    <input
                                        type="text"
                                        value={formData.pixKey}
                                        onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                                        placeholder="sua.chave@email.com"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                            <strong>Modo Demonstração:</strong> As transações são simuladas. Para processar pagamentos reais,
                            configure as credenciais do seu provedor na área de produção.
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
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
// TEF DETAILS MODAL
// =====================================================
interface TefDetailsModalProps {
    transaction: TefTransaction;
    onClose: () => void;
}

const TefDetailsModal: React.FC<TefDetailsModalProps> = ({ transaction, onClose }) => {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Detalhes da Transação</h2>
                        <p className="text-sm text-slate-500">
                            {transaction.type} • {transaction.status}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Valor */}
                    <div className="text-center py-4 bg-slate-50 rounded-xl">
                        <div className="text-4xl font-black text-slate-800">{formatCurrency(transaction.amount)}</div>
                        {transaction.installments && transaction.installments > 1 && (
                            <div className="text-slate-500 mt-1">
                                {transaction.installments}x de {formatCurrency(transaction.installmentValue || 0)}
                            </div>
                        )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {transaction.cardBrand && (
                            <div className="bg-slate-50 rounded-xl p-3">
                                <div className="text-xs text-slate-500 mb-1">Bandeira</div>
                                <div className="font-bold text-slate-800">{transaction.cardBrand}</div>
                            </div>
                        )}
                        {transaction.cardLastDigits && (
                            <div className="bg-slate-50 rounded-xl p-3">
                                <div className="text-xs text-slate-500 mb-1">Cartão</div>
                                <div className="font-mono text-slate-800">****{transaction.cardLastDigits}</div>
                            </div>
                        )}
                        {transaction.authorizationCode && (
                            <div className="bg-slate-50 rounded-xl p-3">
                                <div className="text-xs text-slate-500 mb-1">Autorização</div>
                                <div className="font-mono font-bold text-slate-800">{transaction.authorizationCode}</div>
                            </div>
                        )}
                        {transaction.nsu && (
                            <div className="bg-slate-50 rounded-xl p-3">
                                <div className="text-xs text-slate-500 mb-1">NSU</div>
                                <div className="font-mono text-slate-800">{transaction.nsu}</div>
                            </div>
                        )}
                    </div>

                    {/* Receipt */}
                    {transaction.receiptCustomer && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-2">Comprovante</h4>
                            <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                {transaction.receiptCustomer}
                            </pre>
                        </div>
                    )}

                    {/* Error */}
                    {transaction.errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="text-xs text-red-500 mb-1">Erro: {transaction.errorCode}</div>
                            <div className="font-semibold text-red-700">{transaction.errorMessage}</div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TefManager;
