import React, { useState, useEffect } from 'react';
import { X, Calendar, Zap, Crown, CheckCircle2 } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { SaasPlan, Subscription } from '../../types';

interface ManageSubscriptionModalProps {
    tenantId: string;
    tenantName: string;
    currentSubscription: Subscription | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({
    tenantId,
    tenantName,
    currentSubscription,
    onClose,
    onSuccess,
}) => {
    const [plans, setPlans] = useState<SaasPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [trialDays, setTrialDays] = useState<number>(7);
    const [durationMonths, setDurationMonths] = useState<number>(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const data = await SupabaseService.getPlans();
            setPlans(data.filter(p => p.active));
            if (currentSubscription) {
                setSelectedPlanId(currentSubscription.planId);
            } else if (data.length > 0) {
                setSelectedPlanId(data[0].id);
            }
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    };

    const handleCreateSubscription = async () => {
        if (!selectedPlanId) return;

        setLoading(true);
        try {
            await SupabaseService.createSubscription(tenantId, selectedPlanId, trialDays);
            alert('Assinatura criada com sucesso!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating subscription:', error);
            alert('Erro ao criar assinatura.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePlan = async () => {
        if (!selectedPlanId || !currentSubscription) return;

        setLoading(true);
        try {
            await SupabaseService.updateSubscriptionPlan(tenantId, selectedPlanId);
            alert('Plano alterado com sucesso!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error changing plan:', error);
            alert('Erro ao alterar plano.');
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        setLoading(true);
        try {
            await SupabaseService.activateSubscription(tenantId, durationMonths);
            alert('Assinatura ativada!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error activating subscription:', error);
            alert('Erro ao ativar assinatura.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Deseja realmente cancelar esta assinatura?')) return;

        setLoading(true);
        try {
            await SupabaseService.cancelSubscription(tenantId);
            alert('Assinatura cancelada.');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            alert('Erro ao cancelar assinatura.');
        } finally {
            setLoading(false);
        }
    };

    const handleExtendTrial = async () => {
        const days = parseInt(prompt('Quantos dias deseja estender o trial?') || '0');
        if (days <= 0) return;

        setLoading(true);
        try {
            await SupabaseService.extendTrial(tenantId, days);
            alert(`Trial estendido por ${days} dias!`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error extending trial:', error);
            alert('Erro ao estender trial.');
        } finally {
            setLoading(false);
        }
    };

    const selectedPlan = plans.find(p => p.id === selectedPlanId);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Gerenciar Assinatura</h2>
                        <p className="text-violet-100 text-sm">{tenantName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Current Status */}
                    {currentSubscription && (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-slate-600">Status Atual</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentSubscription.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                        currentSubscription.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                            currentSubscription.status === 'expired' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-700'
                                    }`}>
                                    {currentSubscription.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="text-lg font-bold text-slate-800">
                                {currentSubscription.planName || 'Plano não identificado'}
                            </div>
                            {currentSubscription.trialEndsAt && (
                                <div className="text-sm text-slate-600 mt-2">
                                    Trial termina em: {new Date(currentSubscription.trialEndsAt).toLocaleDateString('pt-BR')}
                                </div>
                            )}
                            {currentSubscription.expiresAt && (
                                <div className="text-sm text-slate-600">
                                    Expira em: {new Date(currentSubscription.expiresAt).toLocaleDateString('pt-BR')}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Plan Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Selecionar Plano
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plans.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`p-4 rounded-2xl border-2 transition-all text-left ${selectedPlanId === plan.id
                                            ? 'border-violet-600 bg-violet-50'
                                            : 'border-slate-200 bg-white hover:border-violet-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-bold text-slate-800">{plan.name}</div>
                                            <div className="text-2xl font-bold text-violet-600 mt-1">
                                                R$ {plan.price.toFixed(2)}<span className="text-sm text-slate-500">/mês</span>
                                            </div>
                                        </div>
                                        {selectedPlanId === plan.id && (
                                            <CheckCircle2 className="text-violet-600" size={24} />
                                        )}
                                    </div>
                                    <ul className="mt-3 space-y-1">
                                        {plan.features.slice(0, 3).map((feature, idx) => (
                                            <li key={idx} className="text-xs text-slate-600 flex items-center gap-1">
                                                <div className="w-1 h-1 bg-violet-600 rounded-full"></div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected Plan Details */}
                    {selectedPlan && (
                        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-4 border border-violet-200">
                            <div className="font-bold text-violet-900 mb-2">Recursos do Plano Selecionado</div>
                            <ul className="grid grid-cols-2 gap-2">
                                {selectedPlan.features.map((feature, idx) => (
                                    <li key={idx} className="text-sm text-violet-800 flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-violet-600" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        {!currentSubscription ? (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Dias de Trial
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="90"
                                        value={trialDays}
                                        onChange={(e) => setTrialDays(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateSubscription}
                                    disabled={loading}
                                    className="w-full bg-violet-600 text-white py-4 rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 transition-all shadow-lg"
                                >
                                    {loading ? 'Criando...' : 'Criar Assinatura'}
                                </button>
                            </>
                        ) : (
                            <>
                                {currentSubscription.status === 'trial' && (
                                    <button
                                        onClick={handleExtendTrial}
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Calendar size={20} />
                                        Estender Trial
                                    </button>
                                )}

                                {(currentSubscription.status === 'trial' || currentSubscription.status === 'expired') && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Duração (meses)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={durationMonths}
                                                onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                            />
                                        </div>
                                        <button
                                            onClick={handleActivate}
                                            disabled={loading}
                                            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Zap size={20} />
                                            {loading ? 'Ativando...' : 'Ativar Assinatura'}
                                        </button>
                                    </>
                                )}

                                {selectedPlanId !== currentSubscription.planId && (
                                    <button
                                        onClick={handleChangePlan}
                                        disabled={loading}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Crown size={20} />
                                        Alterar Plano
                                    </button>
                                )}

                                {currentSubscription.status !== 'cancelled' && (
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition-all"
                                    >
                                        Cancelar Assinatura
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
