import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { ViewState, User } from '../../types';
import { Menu } from 'lucide-react';

interface AdminLayoutProps {
    currentView: ViewState;
    setView: (view: ViewState) => void;
    onLogout: () => void;
    user: User;
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    currentView,
    setView,
    onLogout,
    user,
    children
}) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-[#f4f7fe] overflow-hidden font-sans">
            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <AdminSidebar
                currentView={currentView}
                setView={setView}
                onLogout={onLogout}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">SA</div>
                        <span className="font-bold text-slate-800">Super Admin</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-gray-50/50">
                    <div className="max-w-[1600px] mx-auto min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
