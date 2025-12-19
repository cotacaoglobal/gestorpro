import React, { useState, useEffect } from 'react';
import { Mail, Bell, Check, Loader2, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { User, Tenant } from '../types';

interface EmailNotificationSettingsProps {
    user: User;
}

export const EmailNotificationSettings: React.FC<EmailNotificationSettingsProps> = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchTenantSettings();
    }, [user.tenantId]);

    const fetchTenantSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await SupabaseService.getTenant(user.tenantId);
            setTenant(data);
        } catch (err: any) {
            console.error('Erro ao buscar configurações:', err);
            setError('Não foi possível carregar as configurações de notificação.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEmails = async () => {
        if (!tenant) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        const newValue = !tenant.emailNotificationsEnabled;

        try {
            await SupabaseService.updateTenantSettings(tenant.id, {
                email_notifications_enabled: newValue
            });

            setTenant({
                ...tenant,
                emailNotificationsEnabled: newValue
            });

            setSuccessMessage('Preferências salvas com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setError('Erro ao salvar as configurações. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-slate-100">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden shadow-sm">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Notificações por Email</h3>
                        <p className="text-sm text-slate-500">Configure como sua loja envia emails automáticos</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-2 text-sm">
                        <Check size={18} />
                        {successMessage}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100/50">
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-700">Emails de Confirmação de Venda</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Enviar automaticamente um comprovante por email quando uma venda for finalizada.
                            </p>
                        </div>
                        <button
                            onClick={handleToggleEmails}
                            disabled={saving}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${tenant?.emailNotificationsEnabled ? 'bg-violet-500' : 'bg-slate-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${tenant?.emailNotificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                            {saving && (
                                <div className="absolute inset-x-0 flex justify-center">
                                    <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                                </div>
                            )}
                        </button>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="flex gap-3">
                            <Bell className="text-amber-500 shrink-0" size={20} />
                            <div>
                                <h4 className="font-bold text-amber-800 text-sm">Aviso Adicional</h4>
                                <p className="text-xs text-amber-700 mt-1">
                                    Notificações críticas do sistema (vencimento de fatura, alertas de segurança) serão enviadas independentemente desta configuração.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
