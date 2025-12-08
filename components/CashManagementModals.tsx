import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, TrendingUp, TrendingDown, CreditCard, AlertTriangle, FileText, Banknote, List, Clock, User } from 'lucide-react';
import { CashSession, CashMovement, Sale } from '../types';
import { SupabaseService } from '../services/supabaseService';

// --- Session Details Modal ---

interface SessionDetailsModalProps {
    sessionId: string;
    onClose: () => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ sessionId, onClose }) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'sales' | 'movements'>('summary');
    const [sales, setSales] = useState<Sale[]>([]);
    const [movements, setMovements] = useState<CashMovement[]>([]);
    const [session, setSession] = useState<CashSession | null>(null); // Should fetch session details too if needed, but we can assume we might pass it or fetch it.
    // Fetching session again to be safe and get fresh reportedTotals if closed
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDetails();
    }, [sessionId]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            const [salesData, movementsData, sessionsData] = await Promise.all([
                SupabaseService.getSalesBySession(sessionId),
                SupabaseService.getMovements(sessionId),
                SupabaseService.getSessions() // Optimally we should have getSessionById, but filter works for now
            ]);
            setSales(salesData);
            setMovements(movementsData);
            const currentSession = sessionsData.find(s => s.id === sessionId);
            if (currentSession) setSession(currentSession);
        } catch (error) {
            console.error('Error loading session details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!session && !loading) return null;

    // Calculations
    const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
    const totalMovementsIn = movements.filter(m => m.type === 'ADD_FUND').reduce((acc, m) => acc + m.amount, 0);
    const totalMovementsOut = movements.filter(m => m.type === 'WITHDRAW').reduce((acc, m) => acc + m.amount, 0);
    const expectedCash = (session?.initialFund || 0) +
        sales.reduce((acc, s) => acc + s.payments.filter(p => p.method === 'CASH').reduce((pa, p) => pa + p.amount, 0), 0) +
        totalMovementsIn - totalMovementsOut;

    const salesByMethod = sales.flatMap(s => s.payments).reduce((acc: any, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
    }, {});

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Detalhes da Sessão</h2>
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                <span className={`px-2 py-0.5 rounded-md text-xs ${session?.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {session?.status === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                                </span>
                                <span>ID: {sessionId.slice(0, 8)}...</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-white border-b border-slate-100">
                    <button onClick={() => setActiveTab('summary')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <TrendingUp size={18} /> Resumo
                    </button>
                    <button onClick={() => setActiveTab('sales')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'sales' ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <List size={18} /> Vendas ({sales.length})
                    </button>
                    <button onClick={() => setActiveTab('movements')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'movements' ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <Banknote size={18} /> Movimentações ({movements.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-400 font-bold animate-pulse">Carregando dados...</div>
                    ) : (
                        <>
                            {activeTab === 'summary' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Vendido</p>
                                            <p className="text-2xl font-black text-slate-800">R$ {totalSales.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ticket Médio</p>
                                            <p className="text-2xl font-black text-slate-800">R$ {(sales.length > 0 ? totalSales / sales.length : 0).toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Saldo em Caixa (Est.)</p>
                                            <p className="text-2xl font-black text-emerald-600">R$ {expectedCash.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-violet-500" /> Vendas por Pagamento</h3>
                                        <div className="space-y-3">
                                            {Object.entries(salesByMethod).map(([method, amount]: [string, any]) => (
                                                <div key={method} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                                    <span className="font-bold text-slate-600 text-sm">{method}</span>
                                                    <span className="font-black text-slate-800">R$ {amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            {Object.keys(salesByMethod).length === 0 && <p className="text-slate-400 text-sm text-center py-4">Nenhuma venda registrada.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sales' && (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-xs">
                                            <tr>
                                                <th className="p-4">Hora</th>
                                                <th className="p-4">Cliente</th>
                                                <th className="p-4">Itens</th>
                                                <th className="p-4 bg-slate-100 text-center">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {sales.map(sale => (
                                                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-medium text-slate-600">
                                                        {new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="p-4 text-slate-800">
                                                        <div className="font-bold">{sale.customerName || 'Consumidor Final'}</div>
                                                        <div className="text-xs text-slate-400">{sale.customerCpf}</div>
                                                    </td>
                                                    <td className="p-4 text-slate-500">{sale.items.reduce((acc, i) => acc + i.quantity, 0)} itens</td>
                                                    <td className="p-4 font-black text-slate-800 text-right bg-slate-50/50">R$ {sale.total.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {sales.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-400">Nenhuma venda nesta sessão.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'movements' && (
                                <div className="space-y-3">
                                    {movements.map(mov => (
                                        <div key={mov.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mov.type === 'OPENING' ? 'bg-emerald-100 text-emerald-600' :
                                                    mov.type === 'CLOSING' ? 'bg-slate-100 text-slate-600' :
                                                        mov.type === 'ADD_FUND' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-rose-100 text-rose-600'
                                                    }`}>
                                                    {mov.type === 'OPENING' && <Clock size={18} />}
                                                    {mov.type === 'CLOSING' && <CheckCircle size={18} />} // CheckCircle need import
                                                    {mov.type === 'ADD_FUND' && <TrendingUp size={18} />}
                                                    {mov.type === 'WITHDRAW' && <TrendingDown size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">
                                                        {mov.type === 'OPENING' && 'Abertura de Caixa'}
                                                        {mov.type === 'CLOSING' && 'Fechamento de Caixa'}
                                                        {mov.type === 'ADD_FUND' && 'Suprimento'}
                                                        {mov.type === 'WITHDRAW' && 'Sangria'}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{new Date(mov.timestamp).toLocaleTimeString('pt-BR')}</p>
                                                </div>
                                            </div>
                                            <span className={`font-black ${['OPENING', 'ADD_FUND'].includes(mov.type) ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                {['OPENING', 'ADD_FUND'].includes(mov.type) ? '+' : '-'} R$ {mov.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                    {movements.length === 0 && <p className="text-center py-8 text-slate-400">Nenhuma movimentação.</p>}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Close Session Modal ---

interface CloseSessionModalProps {
    sessionId: string;
    onClose: () => void;
    onConfirm: (sessionId: string, totals: any) => Promise<void>;
}

export const CloseSessionModal: React.FC<CloseSessionModalProps> = ({ sessionId, onClose, onConfirm }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    // Data
    const [sales, setSales] = useState<Sale[]>([]);
    const [movements, setMovements] = useState<CashMovement[]>([]);
    const [session, setSession] = useState<CashSession | null>(null);

    // Inputs
    const [countedCash, setCountedCash] = useState('');
    const [countedCard, setCountedCard] = useState('');
    const [countedPix, setCountedPix] = useState('');

    useEffect(() => {
        loadData();
    }, [sessionId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesData, movementsData, sessionsData] = await Promise.all([
                SupabaseService.getSalesBySession(sessionId),
                SupabaseService.getMovements(sessionId),
                SupabaseService.getSessions()
            ]);
            setSales(salesData);
            setMovements(movementsData);
            const s = sessionsData.find(x => x.id === sessionId);
            if (s) setSession(s);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !session) return <div className="fixed inset-0 bg-white z-[60] flex items-center justify-center">Carregando...</div>;

    // Computed Expected Values
    const totalSalesCash = sales.flatMap(s => s.payments).filter(p => p.method === 'CASH').reduce((a, b) => a + b.amount, 0);
    const totalSalesCard = sales.flatMap(s => s.payments).filter(p => p.method === 'CREDIT' || p.method === 'DEBIT').reduce((a, b) => a + b.amount, 0);
    const totalSalesPix = sales.flatMap(s => s.payments).filter(p => p.method === 'PIX').reduce((a, b) => a + b.amount, 0);

    const totalIn = movements.filter(m => m.type === 'ADD_FUND').reduce((a, b) => a + b.amount, 0);
    const totalOut = movements.filter(m => m.type === 'WITHDRAW').reduce((a, b) => a + b.amount, 0);

    // Expected Cash in Drawer
    const expectedCash = session.initialFund + totalSalesCash + totalIn - totalOut;

    const handleConfirm = async () => {
        setCalculating(true);
        try {
            const totals = {
                CASH: parseFloat(countedCash) || 0,
                CARD: parseFloat(countedCard) || 0, // Simplified, ideally separate Credit/Debit
                PIX: parseFloat(countedPix) || 0
            };
            await onConfirm(sessionId, totals);
            onClose();
        } catch (error) {
            alert('Erro ao fechar caixa');
        } finally {
            setCalculating(false);
        }
    };

    const differenceCash = (parseFloat(countedCash) || 0) - expectedCash;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-rose-100">
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">Fechamento de Caixa</h2>
                            <p className="text-slate-500 font-medium">Conferência de valores</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Summary of Expected */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-bold">Saldo Inicial:</span>
                                <span className="font-medium">R$ {session.initialFund.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-bold">Vendas em Dinheiro:</span>
                                <span className="font-medium text-emerald-600">+ R$ {totalSalesCash.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-bold">Movimentações:</span>
                                <span className="font-medium text-slate-700">R$ {(totalIn - totalOut).toFixed(2)}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-200 flex justify-between text-base">
                                <span className="font-black text-slate-700">Esperado em Gaveta:</span>
                                <span className="font-black text-slate-800">R$ {expectedCash.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor em Dinheiro (Gaveta)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={countedCash}
                                        onChange={e => setCountedCash(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 font-bold text-lg outline-none transition-colors ${differenceCash < -0.1 ? 'border-rose-200 bg-rose-50 text-rose-700' : differenceCash > 0.1 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:border-violet-500'}`}
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                                {Math.abs(differenceCash) > 0.01 && (
                                    <p className={`text-xs font-bold mt-1 text-right ${differenceCash < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {differenceCash < 0 ? 'Falta' : 'Sobra'}: R$ {Math.abs(differenceCash).toFixed(2)}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cartão (Maquininha)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={countedCard}
                                        onChange={e => setCountedCard(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-violet-500 bg-slate-50 focus:bg-white transition-all text-sm"
                                        placeholder={`Esp: ${totalSalesCard.toFixed(2)}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Pix (Confirmado)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={countedPix}
                                        onChange={e => setCountedPix(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-violet-500 bg-slate-50 focus:bg-white transition-all text-sm"
                                        placeholder={`Esp: ${totalSalesPix.toFixed(2)}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={onClose} className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={calculating}
                            className="flex-[2] py-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50"
                        >
                            {calculating ? 'Fechando...' : 'Confirmar Fechamento'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
