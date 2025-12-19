import React, { useState } from 'react';
import { Lock, ArrowRight, CheckCircle2, XCircle, Disc } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';

interface ResetPasswordProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onSuccess, onCancel }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            const { success, error: resetError } = await SupabaseService.updatePassword(password);
            if (success) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                }, 3000);
            } else {
                setError(resetError || 'Erro ao atualizar senha.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError('Erro inesperado ao atualizar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F5F9] flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-md overflow-hidden p-8 md:p-12">

                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className="w-12 h-12 bg-gradient-to-tr from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/50">
                        <Disc size={28} className="text-white animate-spin-slow" style={{ animationDuration: '10s' }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-800">
                            Gestor<span className="text-violet-600">Pro</span>
                        </h1>
                    </div>
                </div>

                {success ? (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} className="text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Senha Atualizada!</h2>
                        <p className="text-slate-600 mb-8">Sua senha foi alterada com sucesso. Você será redirecionado para o login.</p>
                        <button
                            onClick={onSuccess}
                            className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold hover:bg-violet-700 transition-all"
                        >
                            Ir para Login
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Nova Senha</h2>
                            <p className="text-slate-500">Crie uma nova senha segura para sua conta</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold border border-rose-100 flex items-center gap-2">
                                    <XCircle size={18} /> {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nova Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-violet-500 transition-all"
                                        placeholder="••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Confirmar Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-violet-500 transition-all"
                                        placeholder="••••••"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 hover:bg-violet-700 hover:shadow-violet-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? 'Atualizando...' : (
                                    <>
                                        Atualizar Senha <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={onCancel}
                                className="w-full text-sm text-slate-500 font-bold hover:text-slate-700 transition-colors mt-4"
                            >
                                Voltar para Login
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
