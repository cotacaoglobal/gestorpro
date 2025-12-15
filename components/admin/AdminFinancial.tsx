import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, FileText, Download } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { SaasInvoice } from '../../types';

export const AdminFinancial: React.FC = () => {
    const [invoices, setInvoices] = useState<SaasInvoice[]>([]);
    const [revenue, setRevenue] = useState({ mrr: 0, arr: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFinancialData();
    }, []);

    const loadFinancialData = async () => {
        try {
            setLoading(true);
            const [invoicesData, revenueData] = await Promise.all([
                SupabaseService.getInvoices(),
                SupabaseService.getRevenueStats(),
            ]);
            setInvoices(invoicesData);
            setRevenue(revenueData);
        } catch (error) {
            console.error('Error loading financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            paid: 'bg-green-100 text-green-700',
            open: 'bg-yellow-100 text-yellow-700',
            void: 'bg-gray-100 text-gray-700',
            uncollectible: 'bg-red-100 text-red-700',
        };
        return styles[status as keyof typeof styles] || styles.open;
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            paid: 'Pago',
            open: 'Pendente',
            void: 'Cancelado',
            uncollectible: 'Inadimplente',
        };
        return labels[status as keyof typeof labels] || status;
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
                <p className="text-gray-500">Visão geral de receita e faturas</p>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">MRR (Receita Mensal Recorrente)</p>
                            <h3 className="text-3xl font-bold text-gray-800">
                                R$ {revenue.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50 text-green-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">ARR (Receita Anual Recorrente)</p>
                            <h3 className="text-3xl font-bold text-gray-800">
                                R$ {revenue.arr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="p-3 rounded-lg bg-violet-50 text-violet-600">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">Faturas Recentes</h2>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100">
                        <Download size={16} /> Exportar
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">ID</th>
                                <th className="p-4 font-semibold text-gray-600">Cliente</th>
                                <th className="p-4 font-semibold text-gray-600">Valor</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-gray-600">Vencimento</th>
                                <th className="p-4 font-semibold text-gray-600">Criado em</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Carregando faturas...</td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                                        <p>Nenhuma fatura encontrada.</p>
                                        <p className="text-xs mt-1">As faturas aparecerão aqui quando os clientes forem cobrados.</p>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-mono text-xs text-gray-500">{invoice.id.slice(0, 8)}...</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700">{invoice.tenantId.slice(0, 8)}...</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-800">
                                                R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                                                {getStatusLabel(invoice.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">
                                            {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">
                                            {new Date(invoice.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
