import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Smartphone,
    X,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';
import { TefTransactionType, TefPaymentResponse, CardBrand } from '../types/tef';
import { TefService } from '../services/tefService';

interface TefPaymentModalProps {
    tenantId: string;
    amount: number;
    saleId?: string;
    onSuccess: (response: TefPaymentResponse) => void;
    onCancel: () => void;
}

type PaymentStep = 'SELECT_TYPE' | 'SELECT_INSTALLMENTS' | 'PROCESSING' | 'WAITING_PIX' | 'SUCCESS' | 'ERROR';

const TefPaymentModal: React.FC<TefPaymentModalProps> = ({
    tenantId,
    amount,
    saleId,
    onSuccess,
    onCancel,
}) => {
    const [step, setStep] = useState<PaymentStep>('SELECT_TYPE');
    const [selectedType, setSelectedType] = useState<TefTransactionType | null>(null);
    const [installments, setInstallments] = useState(1);
    const [maxInstallments] = useState(12);
    const [response, setResponse] = useState<TefPaymentResponse | null>(null);
    const [pixChecking, setPixChecking] = useState(false);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleSelectType = (type: TefTransactionType) => {
        setSelectedType(type);

        if (type === 'CREDIT_INST') {
            setStep('SELECT_INSTALLMENTS');
        } else if (type === 'PIX') {
            processPixPayment();
        } else {
            processCardPayment(type);
        }
    };

    const processCardPayment = async (type: TefTransactionType, numInstallments: number = 1) => {
        setStep('PROCESSING');

        try {
            const result = await TefService.startPayment(tenantId, {
                amount,
                type,
                installments: numInstallments,
                saleId,
            });

            setResponse(result);

            if (result.success) {
                setStep('SUCCESS');
                setTimeout(() => {
                    onSuccess(result);
                }, 2000);
            } else {
                setStep('ERROR');
            }
        } catch (error) {
            setResponse({
                success: false,
                error: { code: 'ERROR', message: 'Erro de comunicação com o terminal' },
            });
            setStep('ERROR');
        }
    };

    const processPixPayment = async () => {
        setStep('PROCESSING');

        try {
            const result = await TefService.startPixPayment(tenantId, amount, saleId);
            setResponse(result);

            if (result.success && result.requiresConfirmation) {
                setStep('WAITING_PIX');
            } else if (result.success) {
                setStep('SUCCESS');
                onSuccess(result);
            } else {
                setStep('ERROR');
            }
        } catch (error) {
            setResponse({
                success: false,
                error: { code: 'ERROR', message: 'Erro ao gerar QR Code PIX' },
            });
            setStep('ERROR');
        }
    };

    const confirmInstallments = () => {
        if (selectedType) {
            processCardPayment(selectedType, installments);
        }
    };

    // Simular verificação de pagamento PIX (em produção seria webhook)
    const checkPixPayment = async () => {
        if (!response?.transaction) return;

        setPixChecking(true);

        // Simular verificação
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 80% de chance de confirmar (simulação)
        if (Math.random() < 0.8) {
            const confirmResult = await TefService.confirmPixPayment(response.transaction.id);
            if (confirmResult.success) {
                setStep('SUCCESS');
                setTimeout(() => {
                    onSuccess(confirmResult);
                }, 2000);
            }
        }

        setPixChecking(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Pagamento TEF</h2>
                        {step !== 'PROCESSING' && (
                            <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div className="text-4xl font-black">{formatCurrency(amount)}</div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* SELECT TYPE */}
                    {step === 'SELECT_TYPE' && (
                        <div className="space-y-3">
                            <p className="text-slate-500 text-sm mb-4">Selecione a forma de pagamento:</p>

                            <button
                                onClick={() => handleSelectType('CREDIT')}
                                className="w-full p-4 bg-violet-50 hover:bg-violet-100 border-2 border-violet-200 rounded-xl flex items-center gap-4 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                                    <CreditCard className="w-6 h-6 text-violet-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-slate-800">Crédito à Vista</div>
                                    <div className="text-sm text-slate-500">Pagamento em 1x no cartão</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-violet-400" />
                            </button>

                            <button
                                onClick={() => handleSelectType('CREDIT_INST')}
                                className="w-full p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl flex items-center gap-4 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                    <CreditCard className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-slate-800">Crédito Parcelado</div>
                                    <div className="text-sm text-slate-500">Parcelamento até {maxInstallments}x</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-purple-400" />
                            </button>

                            <button
                                onClick={() => handleSelectType('DEBIT')}
                                className="w-full p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl flex items-center gap-4 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-slate-800">Débito</div>
                                    <div className="text-sm text-slate-500">Débito na conta</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-blue-400" />
                            </button>

                            <button
                                onClick={() => handleSelectType('PIX')}
                                className="w-full p-4 bg-teal-50 hover:bg-teal-100 border-2 border-teal-200 rounded-xl flex items-center gap-4 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                                    <Smartphone className="w-6 h-6 text-teal-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-slate-800">Pix</div>
                                    <div className="text-sm text-slate-500">Pagamento instantâneo via QR Code</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-teal-400" />
                            </button>
                        </div>
                    )}

                    {/* SELECT INSTALLMENTS */}
                    {step === 'SELECT_INSTALLMENTS' && (
                        <div className="space-y-4">
                            <p className="text-slate-500 text-sm">Selecione o número de parcelas:</p>

                            <div className="grid grid-cols-3 gap-2">
                                {Array.from({ length: maxInstallments }, (_, i) => i + 1).map(n => {
                                    const installmentValue = amount / n;
                                    return (
                                        <button
                                            key={n}
                                            onClick={() => setInstallments(n)}
                                            className={`p-3 rounded-xl border-2 transition-all ${installments === n
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-slate-200 hover:border-purple-300'
                                                }`}
                                        >
                                            <div className={`text-lg font-bold ${installments === n ? 'text-purple-600' : 'text-slate-700'}`}>
                                                {n}x
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {formatCurrency(installmentValue)}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="bg-purple-50 rounded-xl p-4 text-center">
                                <div className="text-slate-500 text-sm">Total parcelado</div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {installments}x de {formatCurrency(amount / installments)}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('SELECT_TYPE')}
                                    className="flex-1 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={confirmInstallments}
                                    className="flex-[2] py-3 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                >
                                    Confirmar {installments}x
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PROCESSING */}
                    {step === 'PROCESSING' && (
                        <div className="text-center py-12">
                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Processando...</h3>
                            <p className="text-slate-500">
                                {selectedType === 'PIX' ? 'Gerando QR Code...' : 'Aguardando autorização...'}
                            </p>
                            <p className="text-sm text-slate-400 mt-4">
                                Não feche esta janela
                            </p>
                        </div>
                    )}

                    {/* WAITING PIX */}
                    {step === 'WAITING_PIX' && response && (
                        <div className="text-center space-y-4">
                            <div className="bg-teal-50 rounded-2xl p-6">
                                {response.qrCodeBase64 ? (
                                    <img
                                        src={response.qrCodeBase64}
                                        alt="QR Code PIX"
                                        className="w-48 h-48 mx-auto mb-4 bg-white p-2 rounded-lg"
                                    />
                                ) : (
                                    <div className="w-48 h-48 mx-auto mb-4 bg-white rounded-lg flex items-center justify-center">
                                        <Smartphone className="w-16 h-16 text-teal-300" />
                                    </div>
                                )}

                                <p className="text-teal-700 font-semibold">
                                    Escaneie o QR Code no app do seu banco
                                </p>
                            </div>

                            <div className="text-center text-sm text-slate-500">
                                <p>Ou copie o código:</p>
                                <div className="mt-2 bg-slate-100 rounded-lg p-3 text-xs font-mono break-all">
                                    {response.qrCode?.substring(0, 50)}...
                                </div>
                            </div>

                            <button
                                onClick={checkPixPayment}
                                disabled={pixChecking}
                                className="w-full py-3 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {pixChecking ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-5 h-5" />
                                        Já paguei! Verificar
                                    </>
                                )}
                            </button>

                            <button
                                onClick={onCancel}
                                className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {step === 'SUCCESS' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-black text-emerald-600 mb-2">Pagamento Aprovado!</h3>
                            <p className="text-slate-500">
                                Transação concluída com sucesso
                            </p>
                            {response?.transaction && (
                                <div className="mt-4 bg-slate-50 rounded-xl p-4">
                                    <div className="text-sm text-slate-600">
                                        <span className="font-semibold">Autorização:</span> {response.transaction.authorizationCode}
                                    </div>
                                    {response.transaction.cardBrand && (
                                        <div className="text-sm text-slate-600 mt-1">
                                            <span className="font-semibold">Cartão:</span> {response.transaction.cardBrand} ****{response.transaction.cardLastDigits}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ERROR */}
                    {step === 'ERROR' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-red-600 mb-2">Pagamento Recusado</h3>
                            <p className="text-slate-500 mb-4">
                                {response?.error?.message || 'Transação não autorizada'}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => setStep('SELECT_TYPE')}
                                    className="flex-[2] py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                    Tentar Novamente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TefPaymentModal;
