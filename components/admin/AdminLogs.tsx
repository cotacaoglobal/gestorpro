import React, { useEffect, useState } from 'react';
import { FileText, Filter, Download, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { AuditLog } from '../../types';

export const AdminLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        entityType: '',
        startDate: '',
        endDate: '',
        tenantId: '',
    });

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await SupabaseService.getAuditLogs({
                action: filters.action || undefined,
                entityType: filters.entityType || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                tenantId: filters.tenantId || undefined,
                limit: 100,
            });
            setLogs(data);
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionLabel = (action: string): string => {
        const labels: Record<string, string> = {
            'tenant_created': 'Tenant Criado',
            'tenant_suspended': 'Tenant Suspenso',
            'tenant_reactivated': 'Tenant Reativado',
            'plan_changed': 'Plano Alterado',
            'plan_changed_manual': 'Plano Alterado (Manual)',
            'subscription_created': 'Assinatura Criada',
            'subscription_activated': 'Assinatura Ativada',
            'subscription_status_changed': 'Status da Assinatura Alterado',
            'payment_received': 'Pagamento Recebido',
        };
        return labels[action] || action;
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle2 size={16} className="text-green-600" />;
            case 'failed':
                return <XCircle size={16} className="text-red-600" />;
            case 'pending':
                return <Clock size={16} className="text-yellow-600" />;
            default:
                return <AlertCircle size={16} className="text-gray-400" />;
        }
    };

    const getStatusBadge = (status?: string) => {
        const styles = {
            success: 'bg-green-100 text-green-700',
            failed: 'bg-red-100 text-red-700',
            pending: 'bg-yellow-100 text-yellow-700',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
    };

    const handleExport = () => {
        // Exportar logs como CSV
        const csvContent = [
            ['Data', 'Ação', 'Tenant', 'Usuário', 'Tipo', 'Status', 'Detalhes'].join(','),
            ...logs.map(log => [
                new Date(log.createdAt).toLocaleString('pt-BR'),
                getActionLabel(log.action),
                log.tenantName || '-',
                log.userName || '-',
                log.entityType || '-',
                log.status || '-',
                JSON.stringify(log.details || {}),
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString()}.csv`;
        link.click();
    };

    return (
        <div className="p-[10px] md:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-violet-600" size={28} />
                        Logs de Auditoria
                    </h1>
                    <p className="text-gray-500">Histórico de ações importantes no sistema</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                    <Download size={18} />
                    Exportar CSV
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={20} className="text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ação</label>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="">Todas</option>
                            <option value="tenant_created">Tenant Criado</option>
                            <option value="tenant_suspended">Tenant Suspenso</option>
                            <option value="plan_changed">Plano Alterado</option>
                            <option value="payment_received">Pagamento Recebido</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            value={filters.entityType}
                            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="">Todos</option>
                            <option value="tenant">Tenant</option>
                            <option value="subscription">Assinatura</option>
                            <option value="payment">Pagamento</option>
                            <option value="user">Usuário</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={loadLogs}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                    >
                        Aplicar Filtros
                    </button>
                    <button
                        onClick={() => {
                            setFilters({ action: '', entityType: '', startDate: '', endDate: '', tenantId: '' });
                            loadLogs();
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Limpar
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Data/Hora</th>
                                <th className="p-4 font-semibold text-gray-600">Ação</th>
                                <th className="p-4 font-semibold text-gray-600">Tenant</th>
                                <th className="p-4 font-semibold text-gray-600">Usuário</th>
                                <th className="p-4 font-semibold text-gray-600">Tipo</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-gray-600">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Carregando logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                                        <p>Nenhum log encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{getActionLabel(log.action)}</div>
                                            <div className="text-xs text-gray-500">{log.action}</div>
                                        </td>
                                        <td className="p-4 text-gray-700">{log.tenantName || '-'}</td>
                                        <td className="p-4 text-gray-700">{log.userName || 'Sistema'}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                {log.entityType || '-'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(log.status)}
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(log.status)}`}>
                                                    {log.status || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <details className="cursor-pointer">
                                                <summary className="text-violet-600 hover:text-violet-700 text-xs">
                                                    Ver detalhes
                                                </summary>
                                                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-w-xs">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Total de Logs</div>
                    <div className="text-2xl font-bold text-gray-800">{logs.length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Sucesso</div>
                    <div className="text-2xl font-bold text-green-600">
                        {logs.filter(l => l.status === 'success').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Falhas</div>
                    <div className="text-2xl font-bold text-red-600">
                        {logs.filter(l => l.status === 'failed').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Pendentes</div>
                    <div className="text-2xl font-bold text-yellow-600">
                        {logs.filter(l => l.status === 'pending').length}
                    </div>
                </div>
            </div>
        </div>
    );
};
