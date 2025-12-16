import React, { useState } from 'react';
import { LayoutDashboard, Package, History, Users, LogOut, Disc, UserCircle, DollarSign, ShieldAlert, Settings, ChevronDown, ChevronRight, Store, Printer, Database, Folder, Bell, Crown, Menu, X } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isAdmin: boolean;
  onLogout: () => void;
  user?: User | null;
  onEditProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  isAdmin,
  onLogout,
  user,
  onEditProfile
}) => {
  const [configExpanded, setConfigExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'INVENTORY', label: 'Estoque', icon: Package },
    { id: 'HISTORY', label: 'Histórico', icon: History },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'CASH_MANAGEMENT', label: 'Caixa', icon: DollarSign });
    menuItems.push({ id: 'USERS', label: 'Usuários', icon: Users });
    menuItems.push({ id: 'SUBSCRIPTION', label: 'Assinatura', icon: Crown });
  }

  const configItems = [
    { id: 'STORE_SETTINGS', label: 'Configurações da Loja', icon: Store },
    { id: 'PRINTER_SETTINGS', label: 'Impressora Térmica', icon: Printer },
    { id: 'MANAGE_CATEGORIES', label: 'Gerenciar Categorias', icon: Folder },
    { id: 'NOTIFICATIONS', label: 'Notificações', icon: Bell },
    { id: 'BACKUP_DATA', label: 'Backup de Dados', icon: Database },
    { id: 'DUPLICATE_CLEANUP', label: 'Limpar Duplicatas', icon: ShieldAlert },
  ];

  const handleViewChange = (view: ViewState) => {
    setView(view);
    setMobileOpen(false); // Auto-close on mobile
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:sticky top-0 h-screen z-50
        w-72 md:w-20 lg:w-72
        bg-white flex flex-col
        border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Logo Area */}
        <div className="p-8 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
            <Disc size={24} className="animate-spin-slow" style={{ animationDuration: '10s' }} />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 md:hidden lg:block tracking-tight">
            Gestor<span className="text-violet-600">Pro</span>
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
          {/* Menu Items Principais */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id as ViewState)}
                className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 translate-x-1'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-violet-600'
                  }`}
              >
                <Icon size={22} className={`min-w-[22px] transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`ml-4 font-semibold md:hidden lg:block ${isActive ? 'font-bold' : ''}`}>{item.label}</span>

                {/* Active Indicator Dot */}
                {isActive && (
                  <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full md:hidden lg:block opacity-50"></div>
                )}
              </button>
            );
          })}

          {/* Configurações (apenas para admin) */}
          {isAdmin && (
            <div className="space-y-1">
              {/* Botão Principal de Configurações */}
              <button
                onClick={() => setConfigExpanded(!configExpanded)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${configExpanded || configItems.some(item => currentView === item.id)
                  ? 'bg-slate-100 text-violet-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-violet-600'
                  }`}
              >
                <div className="flex items-center">
                  <Settings size={22} className="min-w-[22px] transition-transform duration-300 group-hover:rotate-90" />
                  <span className="ml-4 font-semibold md:hidden lg:block">Configurações</span>
                </div>
                <div className="md:hidden lg:block">
                  {configExpanded ?
                    <ChevronDown size={18} className="transition-transform" /> :
                    <ChevronRight size={18} className="transition-transform" />
                  }
                </div>
              </button>

              {/* Submenu de Configurações */}
              {configExpanded && (
                <div className="ml-2 md:ml-0 lg:ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {configItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleViewChange(item.id as ViewState)}
                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 text-sm ${isActive
                          ? 'bg-violet-100 text-violet-700 font-bold'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-violet-600'
                          }`}
                      >
                        <Icon size={18} className="min-w-[18px]" />
                        <span className="ml-3 md:hidden lg:block">{item.label}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 bg-violet-600 rounded-full md:hidden lg:block"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="p-6 space-y-4 flex-shrink-0 border-t border-slate-100">
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
              <div className="md:hidden lg:flex flex-col items-start overflow-hidden">
                <span className="font-bold text-sm text-slate-700 truncate w-full text-left">{user.name}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Editar Perfil</span>
              </div>
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-4 rounded-2xl flex items-center justify-center md:justify-center lg:justify-start gap-3 transition-all font-medium"
          >
            <LogOut size={20} />
            <span className="md:hidden lg:block">Sair da conta</span>
          </button>
        </div>
      </div>
    </>
  );
};