import React, { useState, useEffect } from 'react';
import { Sale, User } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { DuplicateDetectionService, DuplicateGroup } from '../services/duplicateDetectionService';
import { AlertTriangle, CheckCircle, XCircle, Trash2, Eye, Download, RefreshCw, ShieldAlert, TrendingDown } from 'lucide-react';

interface DuplicateCleanupProps {
    user: User;
    onComplete: () => void;
}

export const DuplicateCleanup: React.FC<DuplicateCleanupProps> = ({ user, onComplete }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
    const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
    const [totalDuplicates, setTotalDuplicates] = useState(0);
    const [estimatedLoss, setEstimatedLoss] = useState(0);
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        loadSales();
    }, [user]);

    const loadSales = async () => {
        try {
            setLoading(true);
            const salesData = await SupabaseService.getSales(user.tenantId);
            setSales(salesData);
        } catch (error) {
            console.error('Error loading sales:', error);
            alert('Erro ao carregar vendas');
        } finally {
            setLoading(false);
        }
    };

    const analyzeDuplicates = async () => {
        try {
            setAnalyzing(true);
            const result = DuplicateDetectionService.detectDuplicates(sales);
            setDuplicateGroups(result.duplicateGroups);
            setTotalDuplicates(result.totalDuplicates);
            setEstimatedLoss(result.estimatedLoss);

            // Seleciona automaticamente grupos com alta confiança
            const highConfidenceGroups = new Set<number>();
            result.duplicateGroups.forEach((group, index) => {
                if (group.confidence === 'high') {
                    highConfidenceGroups.add(index);
                }
            });
            setSelectedGroups(highConfidenceGroups);
        } catch (error) {
            console.error('Error analyzing duplicates:', error);
            alert('Erro ao analisar duplicatas');
        } finally {
            setAnalyzing(false);
        }
    };

    const toggleGroupSelection = (index: number) => {
        const newSelected = new Set(selectedGroups);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedGroups(newSelected);
    };

    const removeDuplicates = async () => {
        if (selectedGroups.size === 0) {
            alert('Selecione pelo menos um grupo de duplicatas para remover');
            return;
        }

        const confirmation = confirm(
            `Você está prestes a remover ${getTotalSelectedDuplicates()} vendas duplicadas.\n\n` +
            `Isso é uma ação IRREVERSÍVEL!\n\n` +
            `Deseja continuar?`
        );

        if (!confirmation) return;

        try {
            setRemoving(true);

            // Coleta todos os IDs das duplicatas selecionadas
            const idsToRemove: string[] = [];
            selectedGroups.forEach(index => {
                const group = duplicateGroups[index];
                group.duplicates.forEach(duplicate => {
                    idsToRemove.push(duplicate.id);
                });
            });

            // Remove cada venda duplicada
            let removedCount = 0;
            for (const id of idsToRemove) {
                try {
                    await SupabaseService.deleteSale(id);
                    removedCount++;
                } catch (error) {
                    console.error(`Erro ao remover venda ${id}:`, error);
                }
            }

            alert(`✅ ${removedCount} vendas duplicadas foram removidas com sucesso!`);

            // Recarrega e reanalisa
            await loadSales();
            setDuplicateGroups([]);
            setSelectedGroups(new Set());
            onComplete();

        } catch (error) {
            console.error('Error removing duplicates:', error);
            alert('Erro ao remover duplicatas');
        } finally {
            setRemoving(false);
        }
    };

    const getTotalSelectedDuplicates = () => {
        let total = 0;
        selectedGroups.forEach(index => {
            total += duplicateGroups[index].duplicates.length;
        });
        return total;
    };

    const getSelectedLoss = () => {
        let total = 0;
        selectedGroups.forEach(index => {
            const group = duplicateGroups[index];
            total += group.duplicates.reduce((sum, dup) => sum + dup.total, 0);
        });
        return total;
    };

    const downloadReport = () => {
        const result = {
            totalSales: sales.length,
            duplicateGroups,
            totalDuplicates,
            estimatedLoss,
        };

        const report = DuplicateDetectionService.formatDuplicateReport(result);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-duplicatas-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getConfidenceLabel = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'Alta';
            case 'medium': return 'Média';
            default: return 'Baixa';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <RefreshCw className="animate-spin mx-auto mb-4 text-violet-600" size={48} />
                    <p className="text-slate-600 font-medium">Carregando vendas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-800">Limpeza de Duplicatas</h2>
                        <p className="text-slate-500 font-medium">Detecte e remova vendas registradas múltiplas vezes</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Total de Vendas</div>
                    <div className="text-2xl font-black text-slate-800">{sales.length}</div>
                </div>

                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                    <div className="text-xs font-bold text-rose-500 uppercase mb-2">Duplicatas</div>
                    <div className="text-2xl font-black text-rose-600">{totalDuplicates}</div>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                    <div className="text-xs font-bold text-amber-600 uppercase mb-2">Valor Inflacionado</div>
                    <div className="text-2xl font-black text-amber-700">R$ {estimatedLoss.toFixed(2)}</div>
                </div>

                <div className="bg-violet-50 p-6 rounded-3xl border border-violet-100">
                    <div className="text-xs font-bold text-violet-600 uppercase mb-2">Grupos Detectados</div>
                    <div className="text-2xl font-black text-violet-700">{duplicateGroups.length}</div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-8">
                <button
                    onClick={analyzeDuplicates}
                    disabled={analyzing || sales.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-violet-200"
                >
                    <RefreshCw size={20} className={analyzing ? 'animate-spin' : ''} />
                    {analyzing ? 'Analisando...' : 'Analisar Duplicatas'}
                </button>

                {duplicateGroups.length > 0 && (
                    <>
                        <button
                            onClick={downloadReport}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg"
                        >
                            <Download size={20} />
                            Baixar Relatório
                        </button>

                        <button
                            onClick={removeDuplicates}
                            disabled={selectedGroups.size === 0 || removing}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-rose-200"
                        >
                            <Trash2 size={20} />
                            {removing ? 'Removendo...' : `Remover Selecionadas (${getTotalSelectedDuplicates()})`}
                        </button>
                    </>
                )}
            </div>

            {/* Selected Summary */}
            {selectedGroups.size > 0 && (
                <div className="bg-violet-50 border border-violet-200 rounded-3xl p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold text-violet-700 mb-1">Seleção Atual</div>
                            <div className="text-2xl font-black text-violet-900">
                                {getTotalSelectedDuplicates()} vendas duplicadas para remover
                            </div>
                            <div className="text-sm text-violet-600 mt-1">
                                Valor a ser corrigido: R$ {getSelectedLoss().toFixed(2)}
                            </div>
                        </div>
                        <TrendingDown size={48} className="text-violet-400" />
                    </div>
                </div>
            )}

            {/* Duplicate Groups */}
            {duplicateGroups.length === 0 && !analyzing ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                        <CheckCircle size={32} />
                    </div>
                    <p className="text-slate-600 font-medium text-lg mb-2">Nenhuma duplicata detectada</p>
                    <p className="text-slate-400">Clique em "Analisar Duplicatas" para verificar</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {duplicateGroups.map((group, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all"
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedGroups.has(index)}
                                        onChange={() => toggleGroupSelection(index)}
                                        className="w-6 h-6 rounded-lg border-2 border-slate-300 text-violet-600 focus:ring-2 focus:ring-violet-500 mt-1"
                                    />

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-slate-800">
                                                    Grupo {index + 1}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${getConfidenceColor(group.confidence)}`}>
                                                    Confiança: {getConfidenceLabel(group.confidence)}
                                                </span>
                                                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                                    {group.duplicates.length} duplicata{group.duplicates.length > 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => setExpandedGroup(expandedGroup === index ? null : index)}
                                                className="text-violet-600 hover:text-violet-700 font-bold text-sm flex items-center gap-2"
                                            >
                                                <Eye size={18} />
                                                {expandedGroup === index ? 'Ocultar' : 'Ver Detalhes'}
                                            </button>
                                        </div>

                                        {/* Original Sale Info */}
                                        <div className="bg-slate-50 rounded-2xl p-4 mb-3">
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Venda Original (Manter)</div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <div className="text-slate-500 text-xs">Cliente</div>
                                                    <div className="font-bold text-slate-800">{group.originalSale.customerName}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs">Valor</div>
                                                    <div className="font-bold text-slate-800">R$ {group.originalSale.total.toFixed(2)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs">Data/Hora</div>
                                                    <div className="font-bold text-slate-800">
                                                        {new Date(group.originalSale.date).toLocaleString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs">ID</div>
                                                    <div className="font-mono text-xs text-slate-600">#{group.originalSale.id.slice(-6)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Criteria Badges */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {group.criteria.sameCustomer && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                                    ✓ Mesmo Cliente
                                                </span>
                                            )}
                                            {group.criteria.sameTotal && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                                    ✓ Mesmo Valor
                                                </span>
                                            )}
                                            {group.criteria.sameItems && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                                    ✓ Mesmos Itens
                                                </span>
                                            )}
                                            {group.criteria.closeTime && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                                    ✓ Horário Próximo (\u003c5min)
                                                </span>
                                            )}
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedGroup === index && (
                                            <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
                                                <div className="text-xs font-bold text-slate-400 uppercase mb-2">
                                                    Duplicatas Detectadas (Serão Removidas)
                                                </div>
                                                {group.duplicates.map((duplicate, dupIndex) => (
                                                    <div key={dupIndex} className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                            <div>
                                                                <div className="text-rose-500 text-xs">Cliente</div>
                                                                <div className="font-bold text-rose-800">{duplicate.customerName}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-rose-500 text-xs">Valor</div>
                                                                <div className="font-bold text-rose-800">R$ {duplicate.total.toFixed(2)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-rose-500 text-xs">Data/Hora</div>
                                                                <div className="font-bold text-rose-800">
                                                                    {new Date(duplicate.date).toLocaleString('pt-BR', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-rose-500 text-xs">ID</div>
                                                                <div className="font-mono text-xs text-rose-600">#{duplicate.id.slice(-6)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
