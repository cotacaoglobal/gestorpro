import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, BarChart3, PieChart, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SupabaseService } from '../../services/supabaseService';
import { TenantGrowth, RevenueByPlan, RetentionMetrics, MrrBreakdown, SaasStats } from '../../types';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const AdminMetrics: React.FC = () => {
    const [stats, setStats] = useState<SaasStats | null>(null);
    const [tenantGrowth, setTenantGrowth] = useState<TenantGrowth[]>([]);
    const [revenueByPlan, setRevenueByPlan] = useState<RevenueByPlan[]>([]);
    const [retention, setRetention] = useState<RetentionMetrics | null>(null);
    const [mrrBreakdown, setMrrBreakdown] = useState<MrrBreakdown | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            const [statsData, growthData, revenueData, retentionData, mrrData] = await Promise.all([
                SupabaseService.getSaaSStats(),
                SupabaseService.getTenantGrowth(6),
                SupabaseService.getRevenueByPlan(),
                SupabaseService.getRetentionMetrics(),
                SupabaseService.getMrrBreakdown(),
            ]);

            setStats(statsData);
            setTenantGrowth(growthData);
            setRevenueByPlan(revenueData);
            setRetention(retentionData);
            setMrrBreakdown(mrrData);
        } catch (error) {
            console.error('Error loading metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando métricas avançadas...</div>;
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="text-violet-600" size={28} />
                    Métricas Avançadas
                </h1>
                <p className="text-gray-500">Análise detalhada do desempenho do negócio</p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* MRR */}
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-start justify-between mb-2">
                        <DollarSign size={24} />
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Mensal</span>
                    </div>
                    <div className="text-sm opacity-90 mb-1">MRR</div>
                    <div className="text-3xl font-bold">
                        R$ {(stats?.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {mrrBreakdown && (
                        <div className="mt-2 text-xs opacity-75">
                            {mrrBreakdown.net_mrr_growth >= 0 ? (
                                <span className="flex items-center gap-1">
                                    <TrendingUp size={14} />
                                    +R$ {mrrBreakdown.net_mrr_growth.toFixed(2)} este mês
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <TrendingDown size={14} />
                                    R$ {Math.abs(mrrBreakdown.net_mrr_growth).toFixed(2)} este mês
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* ARR */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-start justify-between mb-2">
                        <DollarSign size={24} />
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Anual</span>
                    </div>
                    <div className="text-sm opacity-90 mb-1">ARR</div>
                    <div className="text-3xl font-bold">
                        R$ {(stats?.arr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 text-xs opacity-75">
                        Projeção anual
                    </div>
                </div>

                {/* LTV */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-start justify-between mb-2">
                        <Target size={24} />
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Médio</span>
                    </div>
                    <div className="text-sm opacity-90 mb-1">LTV</div>
                    <div className="text-3xl font-bold">
                        R$ {(stats?.ltv || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 text-xs opacity-75">
                        Lifetime Value / Cliente
                    </div>
                </div>

                {/* Churn Rate */}
                <div className={`bg-gradient-to-br ${(stats?.churnRate || 0) < 5 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} text-white p-6 rounded-xl shadow-lg`}>
                    <div className="flex items-start justify-between mb-2">
                        <Activity size={24} />
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">30 dias</span>
                    </div>
                    <div className="text-sm opacity-90 mb-1">Churn Rate</div>
                    <div className="text-3xl font-bold">
                        {(stats?.churnRate || 0).toFixed(2)}%
                    </div>
                    <div className="mt-2 text-xs opacity-75">
                        {(stats?.churnRate || 0) < 5 ? 'Excelente!' : 'Precisa atenção'}
                    </div>
                </div>
            </div>

            {/* MRR Breakdown */}
            {mrrBreakdown && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Breakdown do MRR</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-violet-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Novo MRR</div>
                            <div className="text-xl font-bold text-violet-600">
                                R$ {mrrBreakdown.mrr_new.toFixed(2)}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Expansão</div>
                            <div className="text-xl font-bold text-blue-600">
                                R$ {mrrBreakdown.mrr_expansion.toFixed(2)}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Contração</div>
                            <div className="text-xl font-bold text-amber-600">
                                R$ {mrrBreakdown.mrr_contraction.toFixed(2)}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Churn</div>
                            <div className="text-xl font-bold text-red-600">
                                R$ {mrrBreakdown.mrr_churn.toFixed(2)}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Crescimento Líquido</div>
                            <div className={`text-xl font-bold ${mrrBreakdown.net_mrr_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {mrrBreakdown.net_mrr_growth >= 0 ? '+' : ''}R$ {mrrBreakdown.net_mrr_growth.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Row 1: Tenant Growth + Revenue by Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tenant Growth Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-violet-600" />
                        Crescimento de Clientes
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={tenantGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" stroke="#666" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="new_tenants"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                name="Novos Clientes"
                                dot={{ fill: '#8b5cf6', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="total_tenants"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Total Clientes"
                                dot={{ fill: '#3b82f6', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue by Plan - Pie Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <PieChart size={20} className="text-violet-600" />
                        Receita por Plano
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPie>
                            <Pie
                                data={revenueByPlan}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.plan_name}: ${entry.percentage.toFixed(1)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="mrr"
                            >
                                {revenueByPlan.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Revenue by Plan - Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-800">Detalhamento por Plano</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Plano</th>
                                <th className="p-4 font-semibold text-gray-600">Preço</th>
                                <th className="p-4 font-semibold text-gray-600">Assinaturas</th>
                                <th className="p-4 font-semibold text-gray-600">MRR</th>
                                <th className="p-4 font-semibold text-gray-600">% do Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {revenueByPlan.map((plan, idx) => (
                                <tr key={plan.plan_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                            />
                                            <span className="font-medium text-gray-800">{plan.plan_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        R$ {plan.plan_price.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {plan.active_subscriptions}
                                    </td>
                                    <td className="p-4">
                                        <span className="font-semibold text-gray-800">
                                            R$ {plan.mrr.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                                <div
                                                    className="h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${plan.percentage}%`,
                                                        backgroundColor: COLORS[idx % COLORS.length]
                                                    }}
                                                />
                                            </div>
                                            <span className="text-gray-600 font-medium">
                                                {plan.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Retention Metrics */}
            {retention && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Métricas de Retenção</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Total de Clientes</div>
                            <div className="text-3xl font-bold text-blue-600">{retention.total_tenants}</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Clientes Ativos</div>
                            <div className="text-3xl font-bold text-green-600">{retention.active_tenants}</div>
                        </div>
                        <div className="text-center p-4 bg-violet-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Taxa de Retenção</div>
                            <div className="text-3xl font-bold text-violet-600">{retention.retention_rate.toFixed(2)}%</div>
                        </div>
                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Tempo Médio (dias)</div>
                            <div className="text-3xl font-bold text-amber-600">{Math.round(retention.avg_subscription_days)}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
