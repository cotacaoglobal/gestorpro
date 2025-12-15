import React, { useEffect, useState } from 'react';
import { Users, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { SaasStats } from '../../types';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<SaasStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await SupabaseService.getSaaSStats();
            setStats(data);
        } catch (error) {
            console.error('Error loading SaaS stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando métricas...</div>;
    }

    const statCards = [
        {
            label: 'MRR (Estimado)',
            value: `R$ ${(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            change: '---',
            icon: DollarSign,
            color: 'emerald'
        },
        {
            label: 'Tenants Ativos',
            value: stats?.totalTenants.toString() || '0',
            change: `+${stats?.newTenantsMonth || 0} este mês`,
            icon: Users,
            color: 'blue'
        },
        {
            label: 'Novos no Mês',
            value: stats?.newTenantsMonth.toString() || '0',
            change: '---',
            icon: TrendingUp,
            color: 'violet'
        },
        {
            label: 'Assinaturas Ativas',
            value: stats?.activeSubscriptions.toString() || '0',
            change: '---',
            icon: AlertCircle,
            color: 'red'
        },
    ];

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Visão Geral do SaaS</h1>
                <div className="text-sm text-gray-500">Atualizado agora</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                            <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-gray-400'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Recentes Section - Placeholder for now, or could fetch recent tenants */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-gray-800">Últimos Cadastros</h2>
                        {/* <button className="text-sm text-blue-600 hover:underline">Ver todos</button> */}
                    </div>

                    <div className="text-center py-8 text-gray-400 text-sm">
                        Implementação de lista recente em breve.
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-gray-800">Alerta de Inadimplência</h2>
                        {/* <button className="text-sm text-blue-600 hover:underline">Financeiro</button> */}
                    </div>
                    <div className="text-center py-8 text-gray-400 text-sm">
                        Módulo financeiro em desenvolvimento.
                    </div>
                </div>
            </div>
        </div>
    );
};
