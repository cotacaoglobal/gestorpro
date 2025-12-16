import React, { useEffect, useState } from 'react';
import { Users, DollarSign, AlertCircle, TrendingUp, ArrowUpRight, Activity, CheckCircle2 } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { SaasStats } from '../../types';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<SaasStats | null>(null);
    const [recentTenants, setRecentTenants] = useState<any[]>([]);
    const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [statsData, tenantsData, invoicesData] = await Promise.all([
                SupabaseService.getSaaSStats(),
                SupabaseService.getTenants(),
                SupabaseService.getInvoices()
            ]);

            setStats(statsData);

            // Filter recent tenants (last 5)
            const recent = tenantsData
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);
            setRecentTenants(recent);

            // Filter overdue invoices
            const overdue = invoicesData.filter(inv => {
                const isOverdue = new Date(inv.dueDate) < new Date() && (inv.status === 'open' || inv.status === 'pending');
                return isOverdue;
            });
            setOverdueInvoices(overdue);

        } catch (error) {
            console.error('Error loading SaaS stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, subValue, change }: any) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border border-slate-100/50">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3.5 rounded-2xl ${color.bg} ${color.text}`}>
                    <Icon size={26} strokeWidth={2.5} />
                </div>
                {/* Optional action icon placeholder */}
                <div className="bg-slate-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={18} className="text-slate-400" />
                </div>
            </div>

            <div>
                <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
                <div className="mt-3 flex items-center gap-2">
                    {change && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {change}
                        </span>
                    )}
                    {subValue && (
                        <span className={`text-xs font-medium text-slate-400`}>
                            {subValue}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-[10px] md:p-6 space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">Visão Geral do SaaS</h1>
                    <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-500">
                        Monitoramento em tempo real • Atualizado agora
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="MRR (Estimado)"
                    value={`R$ ${(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    color={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }}
                    change="---"
                    subValue="Receita Recorrente"
                />
                <StatCard
                    title="Tenants Ativos"
                    value={stats?.totalTenants.toString() || '0'}
                    icon={Users}
                    color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
                    change={`+${stats?.newTenantsMonth || 0}`}
                    subValue="este mês"
                />
                <StatCard
                    title="Novos no Mês"
                    value={stats?.newTenantsMonth.toString() || '0'}
                    icon={TrendingUp}
                    color={{ bg: 'bg-violet-100', text: 'text-violet-600' }}
                    change="---"
                    subValue="Crescimento"
                />
                <StatCard
                    title="Assinaturas Ativas"
                    value={stats?.activeSubscriptions.toString() || '0'}
                    icon={Activity}
                    color={{ bg: 'bg-amber-100', text: 'text-amber-600' }}
                    change="---"
                    subValue="Em dia"
                />
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Recent Tenants */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Últimos Cadastros</h2>
                        <button className="text-violet-600 font-semibold text-sm hover:bg-violet-50 px-3 py-1 rounded-xl transition-colors">
                            Ver Todos
                        </button>
                    </div>

                    {recentTenants.length > 0 ? (
                        <div className="space-y-4">
                            {recentTenants.map((tenant) => (
                                <div key={tenant.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {tenant.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{tenant.name}</div>
                                            <div className="text-xs text-slate-500">{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded-full font-bold ${tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {tenant.status === 'active' ? 'Ativo' : 'Inativo'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex-1">
                            <Users size={48} className="text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">Nenhum cadastro recente</p>
                            <p className="text-xs text-slate-400 mt-1">Os novos tenants aparecerão aqui</p>
                        </div>
                    )}
                </div>

                {/* Overdue Invoices */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Alerta de Inadimplência</h2>
                        <button className="text-violet-600 font-semibold text-sm hover:bg-violet-50 px-3 py-1 rounded-xl transition-colors">
                            Financeiro
                        </button>
                    </div>

                    {overdueInvoices.length > 0 ? (
                        <div className="space-y-4">
                            {overdueInvoices.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg text-red-500">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">Fatura #{inv.id.substring(0, 6)}</div>
                                            <div className="text-xs text-red-600 font-medium">Venceu em: {new Date(inv.dueDate).toLocaleDateString('pt-BR')}</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-red-700">
                                        R$ {inv.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-emerald-50/50 rounded-xl border border-dashed border-emerald-200 flex-1">
                            <CheckCircle2 size={48} className="text-emerald-300 mb-3" />
                            <p className="text-emerald-700 font-medium">Tudo certo por aqui</p>
                            <p className="text-xs text-emerald-500 mt-1">Nenhuma pendência financeira crítica encontrada</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
