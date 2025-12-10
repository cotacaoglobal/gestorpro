import React, { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff, Trash2, Clock } from 'lucide-react';
import { OfflineService, OfflineSale } from '../services/offlineService';
import { syncService, SyncProgress } from '../services/syncService';

interface PendingSalesModalProps {
    isOpen: boolean;
    onClose: () => void;
    isOnline: boolean;
}

export const PendingSalesModal: React.FC<PendingSalesModalProps> = ({ isOpen, onClose, isOnline }) => {
    const [pendingSales, setPendingSales] = useState<OfflineSale[]>([]);
    const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPendingSales();
        }
    }, [isOpen]);

    useEffect(() => {
        // Configura callback de progresso
        syncService.onProgress((progress) => {
            setSyncProgress(progress);
            if (!progress.inProgress) {
                // Recarrega lista quando terminar
                setTimeout(() => {
                    loadPendingSales();
                    setSyncProgress(null);
                }, 1000);
            }
        });
    }, []);

    const loadPendingSales = async () => {
        const sales = await OfflineService.getPendingSales();
        setPendingSales(sales);
    };

    const handleSync = async () => {
        if (!isOnline) {
            alert('❌ Sem conexão com a internet. Conecte-se para sincronizar.');
            return;
        }

        setLoading(true);
        try {
            await syncService.syncPendingSales();
        } catch (error) {
            console.error('Erro na sincronização:', error);
            alert('❌ Erro ao sincronizar vendas. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSale = async (tempId: string) => {
        if (confirm('⚠️ Tem certeza que deseja excluir esta venda da fila? Esta ação não pode ser desfeita.')) {
            await OfflineService.removeSale(tempId);
            loadPendingSales();
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-blue-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                {isOnline ? <Wifi size={24} /> : <WifiOff size={24} />}
                            </div>
                            Sincronização de Vendas
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {isOnline ? '🌐 Online - Pronto para sincronizar' : '📴 Offline - Vendas serão sincronizadas quando voltar online'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Sync Progress */}
                {syncProgress && syncProgress.inProgress && (
                    <div className="px-6 py-4 bg-violet-50 border-b border-violet-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-violet-700">
                                Sincronizando... {syncProgress.synced}/{syncProgress.total}
                            </span>
                            <span className="text-xs text-violet-600">
                                {Math.round((syncProgress.synced / syncProgress.total) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-violet-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-violet-600 h-full transition-all duration-300 rounded-full"
                                style={{ width: `${(syncProgress.synced / syncProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {pendingSales.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Tudo sincronizado!</h3>
                            <p className="text-slate-500">Não há vendas pendentes de sincronização.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-700">
                                    {pendingSales.length} {pendingSales.length === 1 ? 'venda pendente' : 'vendas pendentes'}
                                </h3>
                                {isOnline && (
                                    <button
                                        onClick={handleSync}
                                        disabled={loading || syncProgress?.inProgress}
                                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                        Sincronizar Agora
                                    </button>
                                )}
                            </div>

                            {pendingSales.map((sale) => (
                                <div
                                    key={sale.tempId}
                                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-800">
                                                    {sale.data.customerName || 'Cliente'}
                                                </span>
                                                {sale.retryCount > 0 && (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                                                        {sale.retryCount} {sale.retryCount === 1 ? 'tentativa' : 'tentativas'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Clock size={12} />
                                                {formatDate(sale.timestamp)}
                                            </div>
                                            {sale.error && (
                                                <div className="mt-2 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1">
                                                    <AlertCircle size={12} />
                                                    {sale.error}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-violet-600">
                                                R$ {sale.data.total.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {sale.data.items.length} {sale.data.items.length === 1 ? 'item' : 'itens'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 flex-wrap mb-2">
                                        {sale.data.payments.map((payment, idx) => (
                                            <span
                                                key={idx}
                                                className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold text-slate-600"
                                            >
                                                {payment.method}: R$ {payment.amount.toFixed(2)}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDeleteSale(sale.tempId)}
                                            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors"
                                        >
                                            <Trash2 size={12} />
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            {isOnline ? (
                                <>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="font-medium">Conectado</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                    <span className="font-medium">Modo Offline</span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
