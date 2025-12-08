import React, { useState, useMemo, useEffect } from 'react';
import { User, Sale, PaymentMethod } from '../types';
import { Play, LogOut, DollarSign, FileText, Lock, ShoppingCart, User as UserIcon, Calendar, TrendingUp } from 'lucide-react';
import { OpenBoxModal, RegisterTotalsModal, AddFundModal } from './CashModals';
import { SupabaseService } from '../services/supabaseService';

interface OperatorHomeProps {
  user: User;
  onLogout: () => void;
  onEnterPOS: (sessionId: string) => void;
  sales: Sale[];
}

export const OperatorHome: React.FC<OperatorHomeProps> = ({ user, onLogout, onEnterPOS, sales }) => {
  const [activeModal, setActiveModal] = useState<'OPEN' | 'FUND' | 'TOTALS' | null>(null);

  const [activeSession, setActiveSession] = useState<any>(null);

  useEffect(() => {
    const loadSession = async () => {
      const session = await SupabaseService.getActiveSession(user.id);
      setActiveSession(session);
    };
    loadSession();
  }, [user.id]);

  // Handler when session is opened successfully
  const handleOpenSession = async (sessionId: string) => {
    setActiveModal(null);
    const session = await SupabaseService.getActiveSession(user.id);
    setActiveSession(session);
  };

  const handleCloseSessionAttempt = async () => {
    if (!activeSession) return;

    if (window.confirm('Tem certeza que deseja encerrar o caixa?')) {
      try {
        await SupabaseService.closeSession(activeSession.id, activeSession.reportedTotals);
        setActiveSession(undefined);
      } catch (error) {
        console.error('Error closing session:', error);
        alert('Erro ao fechar caixa');
      }
    }
  };

  const handleTotalsSuccess = async () => {
    setActiveModal(null);
    const session = await SupabaseService.getActiveSession(user.id);
    setActiveSession(session);
  };

  // Daily Report Logic (Persistent)
  const dailySales = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-BR');
    return sales.filter(s =>
      s.userId === user.id &&
      new Date(s.date).toLocaleDateString('pt-BR') === today
    );
  }, [sales, user.id]);

  const totalRevenue = dailySales.reduce((acc, s) => acc + s.total, 0);
  const totalSalesCount = dailySales.length;
  const paymentBreakdown = dailySales.flatMap(s => s.payments).reduce((acc: any, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {});

  const ActionWidget = ({ icon: Icon, title, desc, onClick, disabled, theme }: any) => {
    const themes: any = {
      blue: { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', iconBg: 'bg-blue-500', iconColor: 'text-white', border: 'border-blue-100' },
      emerald: { bg: 'bg-emerald-50', hover: 'hover:bg-emerald-100', iconBg: 'bg-emerald-500', iconColor: 'text-white', border: 'border-emerald-100' },
      violet: { bg: 'bg-violet-50', hover: 'hover:bg-violet-100', iconBg: 'bg-violet-500', iconColor: 'text-white', border: 'border-violet-100' },
      rose: { bg: 'bg-rose-50', hover: 'hover:bg-rose-100', iconBg: 'bg-rose-500', iconColor: 'text-white', border: 'border-rose-100' },
      disabled: { bg: 'bg-slate-50', hover: '', iconBg: 'bg-slate-200', iconColor: 'text-slate-400', border: 'border-slate-100' }
    };
    const t = disabled ? themes.disabled : themes[theme];

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-8 rounded-[2rem] border-2 text-left transition-all duration-300 relative overflow-hidden group w-full h-full flex flex-col justify-between ${t.bg} ${t.border} ${disabled ? 'cursor-not-allowed opacity-70' : `${t.hover} hover:-translate-y-1 hover:shadow-xl`}`}
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110 ${t.iconBg} ${t.iconColor}`}>
          <Icon size={32} />
        </div>
        <div>
          <h3 className={`text-2xl font-bold mb-2 ${disabled ? 'text-slate-400' : 'text-slate-800'}`}>{title}</h3>
          <p className={`text-sm font-medium ${disabled ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
        </div>
        {/* Decorator */}
        {!disabled && <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F5F9] p-6 md:p-12 pb-24">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white overflow-hidden relative">
              {user.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={32} className="text-slate-300" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Olá, {user.name}</h1>
              <p className="text-slate-500 font-medium">Painel de Operações</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-colors shadow-sm"
          >
            <LogOut size={20} /> Sair
          </button>
        </header>

        {activeSession ? (
          <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] mb-12 flex flex-col md:flex-row justify-between items-center shadow-xl shadow-emerald-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <span className="font-bold flex items-center gap-3 text-lg mb-1">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>
                Sessão Financeira Ativa
              </span>
              <span className="text-emerald-100 font-medium">Iniciada às {new Date(activeSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {activeSession.reportedTotals && <span className="block mt-2 text-xs bg-emerald-700/50 px-2 py-1 rounded w-fit">Conferência Realizada</span>}
            </div>
            <button
              onClick={() => onEnterPOS(activeSession.id)}
              className="mt-6 md:mt-0 bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-emerald-50 shadow-lg transition-transform active:scale-95 flex items-center gap-3 relative z-10"
            >
              <ShoppingCart size={24} /> Abrir PDV
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 text-slate-300 p-8 rounded-[2.5rem] mb-12 flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-slate-700 rounded-xl"><Lock size={24} /></div>
            <div>
              <span className="font-bold text-white block text-lg">Caixa Fechado</span>
              <span className="text-sm">Abra uma nova sessão para começar a operar.</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <ActionWidget
            icon={Play}
            title="Abrir Caixa (PDV)"
            desc="Iniciar dia"
            theme="blue"
            disabled={!!activeSession}
            onClick={() => setActiveModal('OPEN')}
          />

          <ActionWidget
            icon={DollarSign}
            title="Suprimento"
            desc="Adicionar fundo"
            theme="emerald"
            disabled={!activeSession}
            onClick={() => setActiveModal('FUND')}
          />

          <ActionWidget
            icon={FileText}
            title="Registrar Totais"
            desc="Conferência"
            theme="violet"
            disabled={!activeSession}
            onClick={() => setActiveModal('TOTALS')}
          />

          <ActionWidget
            icon={Lock}
            title="Fechar Caixa"
            desc="Encerrar dia"
            theme="rose"
            disabled={!activeSession}
            onClick={handleCloseSessionAttempt}
          />
        </div>

        {/* Daily Report Section */}
        <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Relatório de Vendas do Dia</h3>
              <p className="text-sm text-slate-500 font-medium">Resumo da sua produtividade hoje ({new Date().toLocaleDateString('pt-BR')})</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Vendido</div>
              <div className="text-2xl font-black text-slate-800 flex items-center gap-2">
                R$ {totalRevenue.toFixed(2)}
                <TrendingUp size={20} className="text-emerald-500" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Volume de Vendas</div>
              <div className="text-2xl font-black text-slate-800">{totalSalesCount} <span className="text-sm font-medium text-slate-400">transações</span></div>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Formas de Pagamento</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(paymentBreakdown).map(([method, amount]: any) => (
                  <span key={method} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold text-slate-600">
                    {method}: R${amount.toFixed(0)}
                  </span>
                ))}
                {Object.keys(paymentBreakdown).length === 0 && <span className="text-sm text-slate-400 font-medium">-</span>}
              </div>
            </div>
          </div>
        </div>

      </div>

      {activeModal === 'OPEN' && <OpenBoxModal userId={user.id} onClose={() => setActiveModal(null)} onSuccess={handleOpenSession} />}
      {activeModal === 'FUND' && activeSession && <AddFundModal sessionId={activeSession.id} onClose={() => setActiveModal(null)} />}
      {activeModal === 'TOTALS' && activeSession && (
        <RegisterTotalsModal
          session={activeSession}
          onClose={() => setActiveModal(null)}
          onSuccess={handleTotalsSuccess}
        />
      )}
    </div>
  );
};