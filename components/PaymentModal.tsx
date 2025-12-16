import React, { useState } from 'react';
import { X, CreditCard, QrCode, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';

interface PaymentModalProps {
    planId: string;
    planName: string;
    planPrice: number;
    tenantId: string;
    subscriptionId?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    planId,
    planName,
    planPrice,
    tenantId,
    subscriptionId,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [paymentLink, setPaymentLink] = useState<string | null>(null);

    const handleCreatePayment = async () => {
        setLoading(true);
        try {
            const { paymentLink: link } = await SupabaseService.createPayment(
                tenantId,
                planId,
                subscriptionId
            );

            // Abrir link de pagamento em nova aba
            window.open(link, '_blank');
            setPaymentLink(link);

            // Informar usuário
            alert('Redirecionado para pagamento! Após concluir, a assinatura será ativada automaticamente.');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Erro ao gerar link de pagamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Finalizar Pagamento</h2>
                        <p className="text-violet-100 text-sm">{planName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Resumo do Valor */}
                    <div className="bg-violet-50 rounded-2xl p-4 border border-violet-200">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-semibold">Total a Pagar:</span>
                            <span className="text-3xl font-bold text-violet-600">
                                R$ {planPrice.toFixed(2)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            Cobrança mensal • Cancele quando quiser
                        </p>
                    </div>

                    {/* Métodos de Pagamento */}
                    {!paymentLink && (
                        <div>
                            <h3 className="font-bold text-gray-800 mb-3">Formas de Pagamento Disponíveis:</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <QrCode className="text-emerald-600" size={24} />
                                    <div>
                                        <div className="font-semibold text-gray-800">PIX</div>
                                        <div className="text-xs text-gray-600">Aprovação instantânea</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <CreditCard className="text-blue-600" size={24} />
                                    <div>
                                        <div className="font-semibold text-gray-800">Cartão de Crédito</div>
                                        <div className="text-xs text-gray-600">Parcelamento disponível</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <FileText className="text-orange-600" size={24} />
                                    <div>
                                        <div className="font-semibold text-gray-800">Boleto Bancário</div>
                                        <div className="text-xs text-gray-600">Vence em 3 dias úteis</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botão de Ação */}
                    <button
                        onClick={handleCreatePayment}
                        disabled={loading}
                        className="w-full bg-violet-600 text-white py-4 rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Gerando pagamento...
                            </>
                        ) : (
                            <>
                                <ExternalLink size={20} />
                                Ir para Pagamento
                            </>
                        )}
                    </button>

                    {paymentLink && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                            <p className="text-sm text-emerald-800 mb-2">
                                Link de pagamento gerado! Se não abriu automaticamente:
                            </p>
                            <a
                                href={paymentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 font-bold underline hover:text-emerald-700"
                            >
                                Clique aqui para pagar
                            </a>
                        </div>
                    )}

                    {/* Informações */}
                    <div className="bg-slate-50 rounded-2xl p-4 text-sm text-gray-600">
                        <p className="font-semibold text-gray-800 mb-2">ℹ️ Como funciona:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• Você será redirecionado para o Mercado Pago</li>
                            <li>• Escolha a forma de pagamento (PIX, cartão ou boleto)</li>
                            <li>• Após aprovação, sua assinatura é ativada automaticamente</li>
                            <li>• Processo 100% seguro e criptografado</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
