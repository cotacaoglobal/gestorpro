import React from 'react';
import { LayoutDashboard, Package, History, Sparkles, Users, LogOut, Disc, UserCircle, DollarSign } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isAdmin: boolean;
  onLogout: () => void;
  user?: User | null;
  onEditProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  onAnalyze,
  isAnalyzing,
  isAdmin,
  onLogout,
  user,
  onEditProfile
}) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    // { id: 'POS', label: 'PDV (Caixa)', icon: ShoppingCart }, // Removed as requested
    { id: 'INVENTORY', label: 'Estoque', icon: Package },
    { id: 'HISTORY', label: 'Histórico', icon: History },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'CASH_MANAGEMENT', label: 'Caixa', icon: DollarSign });
    menuItems.push({ id: 'USERS', label: 'Usuários', icon: Users });
  }

  return (
    <div className="w-20 md:w-72 bg-white flex flex-col h-screen sticky top-0 border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
      {/* Logo Area */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
          <Disc size={24} className="animate-spin-slow" style={{ animationDuration: '10s' }} />
        </div>
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 hidden md:block tracking-tight">
          Gestor<span className="text-violet-600">Pro</span>
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 translate-x-1'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-violet-600'
                }`}
            >
              <Icon size={22} className={`min-w-[22px] transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className={`ml-4 font-semibold hidden md:block ${isActive ? 'font-bold' : ''}`}>{item.label}</span>

              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full hidden md:block opacity-50"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 space-y-4">
        {/* User Profile Widget */}
        {user && (
          <button
            onClick={onEditProfile}
            className="w-full bg-slate-50 hover:bg-violet-50 p-3 rounded-2xl flex items-center gap-3 transition-colors group border border-slate-100 hover:border-violet-100"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={24} className="text-slate-400 group-hover:text-violet-500 transition-colors" />
              )}
            </div>
            <div className="hidden md:flex flex-col items-start overflow-hidden">
              <span className="font-bold text-sm text-slate-700 truncate w-full text-left">{user.name}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Editar Perfil</span>
            </div>
          </button>
        )}

        {/* AI Button */}
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full relative overflow-hidden bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center md:justify-start gap-3 transition-all hover:shadow-xl hover:-translate-y-0.5 group"
        >
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-violet-500/20 rounded-full -ml-4 -mb-4 blur-lg"></div>

          {isAnalyzing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mx-auto md:mx-0"></div>
          ) : (
            <Sparkles size={20} className="text-violet-300 group-hover:text-white transition-colors" />
          )}
          <div className="hidden md:flex flex-col text-left z-10">
            <span className="font-bold text-sm leading-tight">Análise IA</span>
            <span className="text-[10px] text-slate-400">Gerar insights</span>
          </div>
        </button>

        <button
          onClick={onLogout}
          className="w-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-4 rounded-2xl flex items-center justify-center md:justify-start gap-3 transition-all font-medium"
        >
          <LogOut size={20} />
          <span className="hidden md:block">Sair da conta</span>
        </button>
      </div>
    </div>
  );
};