import React from 'react';
import { LayoutDashboard, Users, CreditCard, Layers, LogOut, Settings, FileText, TrendingUp } from 'lucide-react';
import { ViewState } from '../../types';

interface AdminSidebarProps {
    currentView: ViewState;
    setView: (view: ViewState) => void;
    onLogout: () => void;
    isOpen: boolean;
    onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, setView, onLogout, isOpen, onClose }) => {
    const menuItems = [
        { id: 'ADMIN_DASHBOARD', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'ADMIN_TENANTS', label: 'Clientes (Tenants)', icon: Users },
        { id: 'ADMIN_PLANS', label: 'Planos e Limites', icon: Layers },
        { id: 'ADMIN_FINANCIAL', label: 'Financeiro', icon: CreditCard },
        { id: 'ADMIN_METRICS', label: 'Métricas Avançadas', icon: TrendingUp },
        { id: 'ADMIN_LOGS', label: 'Logs de Auditoria', icon: FileText },
        { id: 'ADMIN_SETTINGS', label: 'Configurações', icon: Settings },
    ];

    return (
        <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-[#1E1E2D] text-white flex flex-col p-4 shadow-xl shrink-0 
            transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-full
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="mb-8 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">SA</div>
                    <div>
                        <h1 className="font-bold text-lg">Super Admin</h1>
                        <p className="text-xs text-gray-400">Gestão SaaS</p>
                    </div>
                </div>
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="md:hidden text-gray-400 hover:text-white p-1"
                >
                    <LogOut size={20} className="rotate-180" /> {/* Using LogOut as back/close icon temporarily or import X */}
                </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setView(item.id as ViewState);
                                onClose(); // Close sidebar on mobile when clicking an item
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-blue-600 text-white shadow-lg translate-x-1'
                                : 'text-gray-400 hover:bg-[#2A2A3C] hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="mt-auto pt-4 border-t border-gray-700">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sair</span>
                </button>
            </div>
        </div>
    );
};
