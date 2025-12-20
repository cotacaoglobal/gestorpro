import React, { useState } from 'react';
import { SupabaseService } from '../services/supabaseService';
import {
    Building2,
    User,
    Mail,
    Lock,
    ArrowRight,
    ArrowLeft,
    Disc,
    CheckCircle2,
    Shield,
    Zap,
    Clock,
    Star
} from 'lucide-react';

interface RegisterTenantProps {
    onBack: () => void;
    onRegisterSuccess: () => void;
}

export function RegisterTenant({ onBack, onRegisterSuccess }: RegisterTenantProps) {
    const [formData, setFormData] = useState({
        companyName: '',
        ownerName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Company Info, 2: User Info

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const result = await SupabaseService.registerTenant(
                formData.ownerName,
                formData.email,
                formData.password,
                formData.companyName
            );

            if (result.success) {
                onRegisterSuccess();
            } else {
                if (result.error === 'EMAIL_TAKEN') {
                    setError('Este email já está em uso.');
                } else if (result.error === 'SLUG_TAKEN') {
                    setError('O nome da empresa já existe. Tente um nome diferente.');
                } else {
                    setError('Erro ao registrar: ' + (result.error || 'Erro desconhecido'));
                }
            }
        } catch (err) {
            console.error(err);
            setError('Erro de conexão ao registrar.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.companyName.trim() && formData.ownerName.trim()) {
            setStep(2);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F5F9] flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[600px] md:min-h-[650px]">

                {/* Left Side - Branding */}
                <div className="md:w-1/2 bg-slate-900 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-tr from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/50">
                                <Disc size={28} className="md:w-8 md:h-8 animate-spin-slow" style={{ animationDuration: '10s' }} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                                    Gestor<span className="text-violet-400">Pro</span>
                                </h1>
                                <p className="text-xs md:text-sm text-slate-400 font-medium">PDV & Estoque Inteligente</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-xl md:text-2xl font-bold mb-6">
                                Comece sua jornada<br />
                                <span className="text-violet-400">gratuitamente</span>
                            </h2>

                            {/* Benefits */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Zap size={20} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">Pronto em 5 minutos</h3>
                                        <p className="text-sm text-slate-400">Cadastre-se e comece a vender imediatamente</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Clock size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">7 dias grátis</h3>
                                        <p className="text-sm text-slate-400">Teste todas as funcionalidades sem compromisso</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Shield size={20} className="text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">Sem cartão de crédito</h3>
                                        <p className="text-sm text-slate-400">Não pedimos dados de pagamento agora</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Star size={20} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">Suporte humanizado</h3>
                                        <p className="text-sm text-slate-400">Equipe brasileira pronta para ajudar</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="relative z-10 flex items-center gap-2 mt-8">
                        <div className={`w-8 h-2 rounded-full transition-all ${step === 1 ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                        <div className={`w-8 h-2 rounded-full transition-all ${step === 2 ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                        <span className="text-xs text-slate-500 ml-2">Etapa {step} de 2</span>
                    </div>
                </div>

                {/* Right Side - Registration Form */}
                <div className="md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
                    <div className="mb-6 md:mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                            {step === 1 ? 'Criar Nova Conta' : 'Dados de Acesso'}
                        </h2>
                        <p className="text-sm md:text-base text-slate-500">
                            {step === 1 ? 'Informe os dados da sua empresa' : 'Defina seu email e senha'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold border border-rose-100 flex items-center gap-2 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleNextStep} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome da Empresa</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-5 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-violet-500 transition-all"
                                        placeholder="Ex: Padaria do João"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Seu Nome Completo</label>
                                <div className="relative group">
                                    <User className="absolute left-5 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        name="ownerName"
                                        value={formData.ownerName}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-violet-500 transition-all"
                                        placeholder="João da Silva"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 hover:bg-violet-700 hover:shadow-violet-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
                            >
                                Continuar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <div className="text-center pt-4 border-t border-slate-100">
                                <p className="text-sm text-slate-500 mb-2">Já possui uma conta?</p>
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="text-violet-600 font-bold hover:text-violet-700 hover:underline transition-colors flex items-center gap-2 justify-center"
                                >
                                    <ArrowLeft size={16} /> Voltar para Login
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-violet-500 transition-all"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-violet-500 transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Confirmar Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-violet-500 transition-all"
                                        placeholder="Repita a senha"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={18} /> Voltar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] bg-violet-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 hover:bg-violet-700 hover:shadow-violet-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Criando...
                                        </>
                                    ) : (
                                        <>
                                            Criar Conta <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-center text-slate-400 pt-2">
                                Ao criar sua conta, você concorda com nossos{' '}
                                <a href="#" className="text-violet-600 hover:underline">Termos de Uso</a> e{' '}
                                <a href="#" className="text-violet-600 hover:underline">Política de Privacidade</a>.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
