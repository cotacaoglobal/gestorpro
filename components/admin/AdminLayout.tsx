import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { ViewState, User } from '../../types';

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
    return (
        <div className="flex h-screen w-full bg-[#f4f7fe] overflow-hidden font-sans">
            <AdminSidebar currentView={currentView} setView={setView} onLogout={onLogout} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 relative scroll-smooth bg-gray-50/50">
                <div className="max-w-[1600px] mx-auto min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
};
