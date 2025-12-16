import React, { useState, useEffect } from 'react';
import { Crown, Calendar, CheckCircle2, AlertCircle, Zap, ArrowRight, Sparkles, CreditCard } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { Subscription, SaasPlan, User, PaymentTransaction } from '../types';
import { PaymentModal } from './PaymentModal';

interface TenantSubscriptionPanelProps {
    user: User;
}

export const TenantSubscriptionPanel: React.FC<TenantSubscriptionPanelProps> = ({ user }) => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<SaasPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SaasPlan | null>(null);
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

    useEffect(() => {
        loadData();
    }, [user.tenantId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [subData, plansData, txData] = await Promise.all([
                SupabaseService.getSubscription(user.tenantId),
                SupabaseService.getPlans(),
                SupabaseService.getPaymentTransactions(user.tenantId),
            ]);
            setSubscription(subData);
            setPlans(plansData.filter(p => p.active));
            setTransactions(txData);
        } catch (error) {
            console.error('Error loading subscription data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        if (!subscription) {
            alert('Você não possui uma assinatura ativa. Entre em contato com o suporte.');
            return;
        }

        if (planId === subscription.planId) {
            alert('Este já é o seu plano atual.');
            return;
        }

        if (!confirm('Deseja realmente alterar seu plano? A mudança será aplicada imediatamente.')) {
            return;
        }

        try {
            await SupabaseService.updateSubscriptionPlan(user.tenantId, planId);
            alert('Plano alterado com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error upgrading plan:', error);
            alert('Erro ao alterar plano. Entre em contato com o suporte.');
        }
    };

    const getDaysRemaining = (): number | null => {
        if (!subscription) return null;

        const now = new Date();
        let targetDate: Date | null = null;

        if (subscription.status === 'trial' && subscription.trialEndsAt) {
            targetDate = new Date(subscription.trialEndsAt);
        } else if (subscription.status === 'active' && subscription.expiresAt) {
            targetDate = new Date(subscription.expiresAt);
        }

        if (!targetDate) return null;

        const diffTime = targetDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500';
            case 'trial': return 'bg-blue-500';
            case 'expired': return 'bg-red-500';
            case 'cancelled': return 'bg-gray-500';
            default: return 'bg-gray-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Ativo';
            case 'trial': return 'Período de Teste';
            case 'expired': return 'Expirado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    const daysRemaining = getDaysRemaining();

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-slate-500">Carregando dados da assinatura...</div>
            </div>
        );
    }

    return (
        <div className="p-2.5 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Crown className="text-violet-600" size={28} />
                    Minha Assinatura
                </h1>
                <p className="text-gray-500">Gerencie seu plano e recursos</p>
            </div>

            {/* Current Subscription Card */}
            {subscription ? (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border-2 border-violet-200 p-6 md:p-8 shadow-lg">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-3 h-3 rounded-full ${getStatusColor(subscription.status)} shadow-lg`}></div>
                                <span className="text-sm font-bold text-violet-700 uppercase tracking-wider">
                                    {getStatusLabel(subscription.status)}
                                </span>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">
                                {subscription.planName || 'Plano Atual'}
                            </h2>
                            {subscription.planPrice !== undefined && (
                                <p className="text-2xl font-bold text-violet-600 mt-2">
                                    R$ {subscription.planPrice.toFixed(2)}<span className="text-sm text-gray-500">/mês</span>
                                </p>
                            )}
                        </div>

                        {daysRemaining !== null && (
                            <div className="bg-white rounded-2xl p-4 shadow-md border border-violet-200 text-center min-w-[120px]">
                                <Calendar className="text-violet-600 mx-auto mb-2" size={24} />
                                <div className="text-3xl font-bold text-gray-900">{daysRemaining}</div>
                                <div className="text-xs text-gray-600 font-semibold">
                                    {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    {subscription.planFeatures && subscription.planFeatures.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                            {subscription.planFeatures.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-gray-700">
                                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Limits */}
                    {subscription.planLimits && (
                        <div className="flex flex-wrap gap-4 bg-white/60 rounded-2xl p-4 border border-violet-100">
                            {subscription.planLimits.users && subscription.planLimits.users !== -1 && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-violet-600">{subscription.planLimits.users}</div>
                                    <div className="text-xs text-gray-600">Usuários</div>
                                </div>
                            )}
                            {subscription.planLimits.products && subscription.planLimits.products !== -1 && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-violet-600">{subscription.planLimits.products}</div>
                                    <div className="text-xs text-gray-600">Produtos</div>
                                </div>
                            )}
                            {subscription.planLimits.sales_per_month && subscription.planLimits.sales_per_month !== -1 && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-violet-600">{subscription.planLimits.sales_per_month}</div>
                                    <div className="text-xs text-gray-600">Vendas/mês</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Alerts */}
                    {daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
                        <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                            <div className="text-sm text-amber-800">
                                <p className="font-bold mb-1">Atenção!</p>
                                <p>Sua assinatura expira em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}. Renove para continuar usando o sistema.</p>
                            </div>
                        </div>
                    )}

                    {(subscription.status === 'expired' || subscription.status === 'cancelled') && (
                        <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                            <div className="text-sm text-red-800">
                                <p className="font-bold mb-1">Assinatura Inativa</p>
                                <p>Escolha um plano abaixo para reativar seu acesso.</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-8 text-center">
                    <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma Assinatura Ativa</h3>
                    <p className="text-gray-500">Escolha um plano abaixo para começar.</p>
                </div>
            )}

            {/* Available Plans */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Sparkles className="text-violet-600" size={24} />
                    Planos Disponíveis
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => {
                        const isCurrentPlan = subscription?.planId === plan.id;
                        const isPremium = plan.slug === 'enterprise' || plan.slug === 'pro';

                        return (
                            <div
                                key={plan.id}
                                className={`rounded-2xl p-6 border-2 transition-all ${isCurrentPlan
                                    ? 'bg-violet-50 border-violet-600 shadow-lg'
                                    : isPremium
                                        ? 'bg-gradient-to-br from-slate-900 to-violet-900 text-white border-violet-600 shadow-xl'
                                        : 'bg-white border-gray-200 hover:border-violet-300 hover:shadow-lg'
                                    }`}
                            >
                                {isPremium && (
                                    <div className="mb-3">
                                        <span className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                                            ⭐ PREMIUM
                                        </span>
                                    </div>
                                )}

                                <h3 className={`text-2xl font-bold mb-2 ${isPremium ? 'text-white' : 'text-gray-900'}`}>
                                    {plan.name}
                                </h3>

                                <div className="mb-4">
                                    <span className={`text-4xl font-bold ${isPremium ? 'text-white' : 'text-violet-600'}`}>
                                        R$ {plan.price.toFixed(2)}
                                    </span>
                                    <span className={`text-sm ${isPremium ? 'text-gray-300' : 'text-gray-500'}`}>/mês</span>
                                </div>

                                <p className={`text-sm mb-6 ${isPremium ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {plan.description}
                                </p>

                                <ul className="space-y-2 mb-6">
                                    {plan.features.slice(0, 4).map((feature, idx) => (
                                        <li key={idx} className={`text-sm flex items-center gap-2 ${isPremium ? 'text-gray-200' : 'text-gray-700'}`}>
                                            <CheckCircle2 size={16} className={isPremium ? 'text-green-400' : 'text-emerald-500'} />
                                            {feature}
                                        </li>
                                    ))}
                                    {plan.features.length > 4 && (
                                        <li className={`text-xs ${isPremium ? 'text-gray-400' : 'text-gray-500'}`}>
                                            +{plan.features.length - 4} outros recursos
                                        </li>
                                    )}
                                </ul>

                                <button
                                    onClick={() => {
                                        setSelectedPlan(plan);
                                        setShowPaymentModal(true);
                                    }}
                                    disabled={isCurrentPlan}
                                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isCurrentPlan
                                        ? 'bg-violet-200 text-violet-700 cursor-not-allowed'
                                        : isPremium
                                            ? 'bg-white text-violet-900 hover:bg-gray-100 shadow-lg'
                                            : 'bg-violet-600 text-white hover:bg-violet-700 shadow-md'
                                        }`}
                                >
                                    {isCurrentPlan ? (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Plano Atual
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={18} />
                                            Assinar Agora
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedPlan && (
                <PaymentModal
                    planId={selectedPlan.id}
                    planName={selectedPlan.name}
                    planPrice={selectedPlan.price}
                    tenantId={user.tenantId}
                    subscriptionId={subscription?.id}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedPlan(null);
                    }}
                    onSuccess={() => {
                        loadData();
                    }}
                />
            )}

            {/* Help Section */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-gray-800 mb-2">Precisa de Ajuda?</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Entre em contato com nosso suporte para dúvidas sobre planos, pagamentos ou cancelamentos.
                </p>
                <button className="text-violet-600 font-bold text-sm hover:text-violet-700 transition-colors">
                    Falar com Suporte →
                </button>
            </div>
        </div>
    );
};
