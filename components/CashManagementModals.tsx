import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, TrendingUp, TrendingDown, CreditCard, AlertTriangle, FileText, Banknote, List, Clock, User, CheckCircle } from 'lucide-react';
import { CashSession, CashMovement, Sale, PaymentMethod } from '../types';
import { SupabaseService } from '../services/supabaseService';

// --- Session Details Modal ---

interface SessionDetailsModalProps {
    sessionId: string;
    tenantId: string;
    onClose: () => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ sessionId, tenantId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<CashSession | null>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [movements, setMovements] = useState<CashMovement[]>([]);
    const [activeTab, setActiveTab] = useState<'sales' | 'movements'>('sales');

    useEffect(() => {
        loadDetails();
    }, [sessionId, tenantId]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            const [salesData, movementsData, sessionsData] = await Promise.all([
                SupabaseService.getSalesBySession(sessionId),
                SupabaseService.getMovements(sessionId),
                SupabaseService.getSessions(tenantId)
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

    const totalSalesCash = sales.flatMap(s => s.payments).filter(p => p.method === PaymentMethod.CASH).reduce((a, b) => a + b.amount, 0);
    const totalSalesCard = sales.flatMap(s => s.payments).filter(p => p.method === PaymentMethod.CREDIT_CARD || p.method === PaymentMethod.DEBIT_CARD).reduce((a, b) => a + b.amount, 0);
    const totalSalesPix = sales.flatMap(s => s.payments).filter(p => p.method === PaymentMethod.PIX).reduce((a, b) => a + b.amount, 0);

    const totalIn = movements.filter(m => m.type === 'ADD_FUND').reduce((a, b) => a + b.amount, 0);
    const totalOut = movements.filter(m => m.type === 'WITHDRAW').reduce((a, b) => a + b.amount, 0);

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-100">
                                <FileText size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">Detalhes da Sessão</h2>
                                <p className="text-slate-500 font-medium">ID: {session.id.substring(0, 8)}...</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Session Info */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-bold">Início:</span>
                                <span className="font-medium">{new Date(session.openedAt).toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-bold">Fim:</span>
                                <span className="font-medium">{session.closedAt ? new Date(session.closedAt).toLocaleString('pt-BR') : 'Em andamento'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-bold">Fundo Inicial:</span>
                                <span className="font-medium">R$ {session.initialFund.toFixed(2)}</span>
                            </div>
                            {session.reportedTotals?.[PaymentMethod.CASH] && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-bold">Caixa Contado:</span>
                                    <span className="font-medium">R$ {session.reportedTotals[PaymentMethod.CASH].toFixed(2)}</span>
                                </div>
                            )}
                            {(session.reportedTotals?.[PaymentMethod.CREDIT_CARD] || session.reportedTotals?.[PaymentMethod.DEBIT_CARD]) && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-bold">Cartão Contado:</span>
                                    <span className="font-medium">R$ {((session.reportedTotals[PaymentMethod.CREDIT_CARD] || 0) + (session.reportedTotals[PaymentMethod.DEBIT_CARD] || 0)).toFixed(2)}</span>
                                </div>
                            )}
                            {session.reportedTotals?.[PaymentMethod.PIX] && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-bold">Pix Contado:</span>
                                    <span className="font-medium">R$ {session.reportedTotals[PaymentMethod.PIX].toFixed(2)}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-slate-200 flex justify-between text-base">
                                <span className="font-black text-slate-700">Total Vendas:</span>
                                <span className="font-black text-slate-800">R$ {(totalSalesCash + totalSalesCard + totalSalesPix).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-100 rounded-xl p-1">
                            <button
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'sales' ? 'bg-white text-violet-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setActiveTab('sales')}
                            >
                                Vendas ({sales.length})
                            </button>
                            <button
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'movements' ? 'bg-white text-violet-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setActiveTab('movements')}
                            >
                                Movimentações ({movements.length})
                            </button>
                        </div>

                        {/* Tab Content */}
                        <>
                            {activeTab === 'sales' && (
                                <div className="space-y-3">
                                    {sales.map(sale => (
                                        <div key={sale.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center">
                                                    <DollarSign size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">Venda #{sale.id.substring(0, 8)}</p>
                                                    <p className="text-xs text-slate-400">{new Date(sale.date).toLocaleTimeString('pt-BR')}</p>
                                                </div>
                                            </div>
                                            <span className="font-black text-emerald-600">R$ {sale.payments.reduce((a, b) => a + b.amount, 0).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {sales.length === 0 && <p className="text-center py-8 text-slate-400">Nenhuma venda.</p>}
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
                                                    {mov.type === 'CLOSING' && <CheckCircle size={18} />}
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
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Close Session Modal ---

interface CloseSessionModalProps {
    sessionId: string;
    tenantId: string;
    onClose: () => void;
    onConfirm: (sessionId: string, totals: any) => Promise<void>;
}

export const CloseSessionModal: React.FC<CloseSessionModalProps> = ({ sessionId, tenantId, onClose, onConfirm }) => {
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
    }, [sessionId, tenantId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesData, movementsData, sessionsData] = await Promise.all([
                SupabaseService.getSalesBySession(sessionId),
                SupabaseService.getMovements(sessionId),
                SupabaseService.getSessions(tenantId)
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
    const totalSalesCash = sales.flatMap(s => s.payments).filter(p => p.method === PaymentMethod.CASH).reduce((a, b) => a + b.amount, 0);
    const totalSalesCard = sales.flatMap(s => s.payments).filter(p => p.method === PaymentMethod.CREDIT_CARD || p.method === PaymentMethod.DEBIT_CARD).reduce((a, b) => a + b.amount, 0);
    const totalSalesPix = sales.flatMap(s => s.payments).filter(p => p.method === PaymentMethod.PIX).reduce((a, b) => a + b.amount, 0);

    const totalIn = movements.filter(m => m.type === 'ADD_FUND').reduce((a, b) => a + b.amount, 0);
    const totalOut = movements.filter(m => m.type === 'WITHDRAW').reduce((a, b) => a + b.amount, 0);

    // Expected Cash in Drawer
    const expectedCash = session.initialFund + totalSalesCash + totalIn - totalOut;

    const handleConfirm = async () => {
        setCalculating(true);
        try {
            const totals = {
                [PaymentMethod.CASH]: parseFloat(countedCash) || 0,
                [PaymentMethod.CREDIT_CARD]: parseFloat(countedCard) || 0, // Simplified, combining card types
                [PaymentMethod.PIX]: parseFloat(countedPix) || 0
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
