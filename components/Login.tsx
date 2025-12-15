import React, { useState } from 'react';
import { User } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Lock, Mail, ArrowRight, Disc, X, CheckCircle2, TrendingUp, Package, BarChart3, Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // Validar formato de email antes de enviar
    if (!email.includes('@')) {
      setError('Por favor, insira um email válido.');
      return;
    }

    try {
      const user = await SupabaseService.login(email, password);
      // NOTE: With the new flow, SupabaseService.login returns the user profile
      // If null, it means login failed.
      if (user) {
        onLogin(user);
      } else {
        // More specific error based on what usually happens with Auth
        setError('Email ou senha incorretos.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Erro de conexão. Tente novamente.');
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock simulation of success for now
      // In a real multi-tenant system, we'd need a dedicated endpoint to check user by email globally safely
      if (recoveryEmail && recoveryEmail.includes('@')) {
        setRecoverySuccess(true);
        setTimeout(() => {
          setShowRecoveryModal(false);
          setRecoverySuccess(false);
          setRecoveryEmail('');
        }, 3000);
      } else {
        alert('Por favor, insira um email válido.');
      }
    } catch (error) {
      console.error('Recovery error:', error);
      alert('Erro ao processar solicitação.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F9] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

        {/* Left Side - Brand */}
        <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] -ml-32 -mb-32 opacity-50"></div>

          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-900/50">
              <Disc size={32} className="text-white animate-spin-slow" style={{ animationDuration: '10s' }} />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Gestor<span className="text-violet-400">Pro</span></h1>
            <p className="text-slate-400 font-medium mb-8">Sistema de Gestão Inteligente</p>

            {/* Benefits Section */}
            <div className="space-y-4 mt-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={20} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Controle Total de Vendas</h3>
                  <p className="text-sm text-slate-400">Gerencie todas as transações com PDV moderno e intuitivo</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Gestão de Estoque</h3>
                  <p className="text-sm text-slate-400">Controle preciso de produtos com alertas de baixo estoque</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Relatórios Detalhados</h3>
                  <p className="text-sm text-slate-400">Análises completas de desempenho e faturamento</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Inteligência Artificial</h3>
                  <p className="text-sm text-slate-400">Insights automáticos para otimizar seu negócio</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Bem-vindo</h2>
          <p className="text-slate-500 mb-10">Faça login para acessar sua conta.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold border border-rose-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-violet-500 transition-all"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha</label>
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

            <button
              type="submit"
              className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 hover:bg-violet-700 hover:shadow-violet-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
            >
              Acessar Sistema <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="text-center pt-4 space-y-4">
              <button
                type="button"
                onClick={() => setShowRecoveryModal(true)}
                className="text-sm text-slate-500 hover:text-violet-600 transition-colors"
              >
                Esqueceu a senha?
              </button>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500 mb-2">Ainda não tem uma conta?</p>
                <button
                  type="button"
                  onClick={onRegister}
                  className="text-violet-600 font-bold hover:text-violet-700 hover:underline transition-colors"
                >
                  Criar conta para sua empresa
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Password Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Recuperar Senha</h3>
                <p className="text-sm text-slate-500">Apenas para administradores</p>
              </div>
              <button
                onClick={() => {
                  setShowRecoveryModal(false);
                  setRecoverySuccess(false);
                  setRecoveryEmail('');
                }}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {recoverySuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Email Enviado!</h4>
                <p className="text-slate-600">Verifique sua caixa de entrada para redefinir sua senha.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordRecovery} className="p-8 space-y-6">
                <p className="text-sm text-slate-600">
                  Digite seu email de administrador para receber instruções de recuperação de senha.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email do Administrador</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                    <input
                      type="email"
                      required
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-violet-500 transition-all"
                      placeholder="admin@email.com"
                      value={recoveryEmail}
                      onChange={e => setRecoveryEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecoveryModal(false);
                      setRecoveryEmail('');
                    }}
                    className="flex-1 py-3 text-slate-600 hover:bg-slate-50 rounded-2xl font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-violet-600 text-white hover:bg-violet-700 rounded-2xl font-bold shadow-lg shadow-violet-200 transition-all"
                  >
                    Enviar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};