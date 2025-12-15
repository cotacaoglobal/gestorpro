import React from 'react';
import { Users, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    // MOCK DATA - Futuramente virá do Supabase
    const stats = [
        { label: 'MRR (Receita Mensal)', value: 'R$ 15.490', change: '+12%', icon: DollarSign, color: 'emerald' },
        { label: 'Tenants Ativos', value: '142', change: '+8', icon: Users, color: 'blue' },
        { label: 'Novos no Mês', value: '15', change: '+3', icon: TrendingUp, color: 'violet' },
        { label: 'Assinaturas Vencidas', value: '4', change: '-1', icon: AlertCircle, color: 'red' },
    ];

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Visão Geral do SaaS</h1>
                <div className="text-sm text-gray-500">Atualizado agora</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                            <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                                {stat.change} vs mês anterior
                            </span>
                        </div>
                        <div className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Recentes Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-gray-800">Últimos Cadastros</h2>
                        <button className="text-sm text-blue-600 hover:underline">Ver todos</button>
                    </div>
                    {/* Tabela Simplificada */}
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 uppercase">M{i}</div>
                                    <div>
                                        <p className="font-medium text-gray-800">Mercadinho Exemplo {i}</p>
                                        <p className="text-xs text-gray-500">Plano Pro • Desde 12/12/2025</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Ativo</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-gray-800">Alerta de Inadimplência</h2>
                        <button className="text-sm text-blue-600 hover:underline">Financeiro</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">Padaria do João</p>
                                        <p className="text-xs text-red-500">Vencido há 5 dias</p>
                                    </div>
                                </div>
                                <button className="text-sm font-semibold text-blue-600 hover:underline">Ver Fatura</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
