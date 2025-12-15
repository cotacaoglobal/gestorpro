import React from 'react';
import { LayoutDashboard, Users, CreditCard, Layers, LogOut } from 'lucide-react';
import { ViewState } from '../../types';

interface AdminSidebarProps {
    currentView: ViewState;
    setView: (view: ViewState) => void;
    onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, setView, onLogout }) => {
    const menuItems = [
        { id: 'ADMIN_DASHBOARD', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'ADMIN_TENANTS', label: 'Clientes (Tenants)', icon: Users },
        { id: 'ADMIN_PLANS', label: 'Planos e Limites', icon: Layers },
        { id: 'ADMIN_FINANCIAL', label: 'Financeiro', icon: CreditCard },
    ];

    return (
        <div className="w-64 h-full bg-[#1E1E2D] text-white flex flex-col p-4 shadow-xl shrink-0">
            <div className="mb-8 flex items-center gap-2 px-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">SA</div>
                <div>
                    <h1 className="font-bold text-lg">Super Admin</h1>
                    <p className="text-xs text-gray-400">Gestão SaaS</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id as ViewState)}
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
