import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Search, Calendar, Filter, User as UserIcon, X } from 'lucide-react';
import { CashSession, User } from '../types';
import { SessionDetailsModal, CloseSessionModal } from './CashManagementModals';

interface CashManagementProps {
    user: User; // Add user prop
}

export const CashManagement: React.FC<CashManagementProps> = ({ user }) => {
    const [sessions, setSessions] = useState<CashSession[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('active');
    const [operatorFilter, setOperatorFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('');

    // Modals State
    const [detailsSessionId, setDetailsSessionId] = useState<string | null>(null);
    const [closingSessionId, setClosingSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.tenantId) {
            loadData();
            const interval = setInterval(loadData, 30000); // 30s auto-refresh
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadData = async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const [sessionsData, usersData] = await Promise.all([
                SupabaseService.getSessions(user.tenantId),
                SupabaseService.getUsers(user.tenantId)
            ]);
            setSessions(sessionsData);
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading cash data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (userId: string) => {
        return users.find(u => u.id === userId)?.name || 'Desconhecido';
    };

    const handleCloseSession = async (sessionId: string, totals: any) => {
        try {
            await SupabaseService.closeSession(sessionId, totals);
            await loadData(); // Reload data to show updated status
            // Success feedback could be improved with a toast
        } catch (error) {
            console.error('Error closing session:', error);
            alert('Erro ao fechar sessão. Tente novamente.');
        }
    };

    // --- Filtering Logic ---
    const filteredSessions = sessions.filter(session => {
        // Status Filter
        const status = session.status as string;
        const isOpen = status === 'OPEN' || status === 'open';
        if (statusFilter === 'active' && !isOpen) return false;
        if (statusFilter === 'closed' && isOpen) return false;

        // Operator Filter
        if (operatorFilter !== 'all' && session.openedByUserId !== operatorFilter) return false;

        // Date Filter (matches openedAt date)
        if (dateFilter) {
            const sessionDate = new Date(session.openedAt).toISOString().split('T')[0];
            if (sessionDate !== dateFilter) return false;
        }

        return true;
    });

    const activeSessionsCount = sessions.filter(s => (s.status as string) === 'OPEN' || (s.status as string) === 'open').length;
    const totalCashInActive = sessions
        .filter(s => (s.status as string) === 'OPEN' || (s.status as string) === 'open')
        .reduce((acc, s) => acc + s.initialFund, 0);

    // Calculate total sales for active sessions (approximate from reported totals if available, or 0)
    // Note: To get exact real-time sales we would need to fetch sales for all active sessions, which might be heavy.
    // For now we rely on what's available or leave it as a simple sum if possible.
    // Actually, in the previous version we summed reportedTotals. Let's keep that logic if reportedTotals updates live (it doesn't usually).
    // So this card might be static until we implement real-time aggregation. 
    // Let's use the reduce logic from before but be aware it might be zero if reportedTotals is only set on close.
    // Ideally we would fetch sales for active sessions. For now I'll comment it out or leave as is.
    const totalSalesActive = 0; // Placeholder until we have a performant way to sum all sales of all active sessions without 10 requests.

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">
                    Gestão de Caixa
                </h1>
                <p className="mt-2 text-slate-500">
                    Controle de sessões e movimentações financeiras
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500">Sessões Ativas</p>
                            <h3 className="text-3xl font-black text-slate-800">{activeSessionsCount}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500">Fundo de Caixa Total</p>
                            <h3 className="text-3xl font-black text-slate-800">R$ {totalCashInActive.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>

                {/* Placeholder for Sales Card or other metric */}
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                    <Filter size={18} /> Filtros:
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {/* Status Toggle */}
                    <div className="bg-slate-100 p-1 rounded-xl flex">
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'active' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setStatusFilter('closed')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'closed' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Fechados
                        </button>
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'all' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Todos
                        </button>
                    </div>

                    {/* Operator Select */}
                    <div className="relative">
                        <UserIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                        <select
                            value={operatorFilter}
                            onChange={(e) => setOperatorFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 h-full"
                        >
                            <option value="all">Todos Operadores</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Picker */}
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 h-[42px]"
                        />
                        {dateFilter && (
                            <button
                                onClick={() => setDateFilter('')}
                                className="absolute right-2 top-2.5 text-slate-400 hover:text-rose-500"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Sessions Lists */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-slate-400 font-bold animate-pulse">Carregando sessões...</div>
                ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">Nenhuma sessão encontrada com os filtros atuais.</p>
                        <button
                            onClick={() => { setStatusFilter('all'); setOperatorFilter('all'); setDateFilter(''); }}
                            className="mt-4 text-violet-600 font-bold text-sm hover:underline"
                        >
                            Limpar filtros
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredSessions.map(session => {
                            const status = session.status as string;
                            const isOpen = status === 'OPEN' || status === 'open';

                            return (
                                <div key={session.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-violet-100 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {isOpen ? <DollarSign size={20} /> : <CheckCircle size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase">Operador</p>
                                                <h3 className="font-bold text-slate-800 line-clamp-1">{getUserName(session.openedByUserId)}</h3>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                                            {isOpen ? 'Aberto' : 'Fechado'}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Início</span>
                                            <span className="font-bold text-slate-700">{new Date(session.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} <span className="text-xs font-normal text-slate-400">{new Date(session.openedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span></span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Fundo Inicial</span>
                                            <span className="font-bold text-slate-700">R$ {session.initialFund.toFixed(2)}</span>
                                        </div>
                                        {!isOpen && session.closedAt && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Fechado às</span>
                                                <span className="font-bold text-slate-700">{new Date(session.closedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setDetailsSessionId(session.id)}
                                            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                                        >
                                            Detalhes
                                        </button>
                                        {isOpen && (
                                            <button
                                                onClick={() => setClosingSessionId(session.id)}
                                                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                                title="Fechar Caixa"
                                            >
                                                Fechar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            {detailsSessionId && (
                <SessionDetailsModal
                    sessionId={detailsSessionId}
                    tenantId={user.tenantId}
                    onClose={() => setDetailsSessionId(null)}
                />
            )}

            {closingSessionId && (
                <CloseSessionModal
                    sessionId={closingSessionId}
                    tenantId={user.tenantId}
                    onClose={() => setClosingSessionId(null)}
                    onConfirm={handleCloseSession}
                />
            )}
        </div>
    );
};
