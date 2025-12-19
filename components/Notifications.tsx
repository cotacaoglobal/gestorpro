import { Bell, AlertTriangle, Mail, MessageSquare, Save } from 'lucide-react';
import { User } from '../types';
import { EmailService } from '../services/emailService';
import { EmailNotificationSettings } from './EmailNotificationSettings';

interface NotificationSettings {
    lowStockAlert: boolean;
    lowStockThreshold: number;
    emailNotifications: boolean;
    whatsappNotifications: boolean;
    notificationEmail: string;
    notificationPhone: string;
}

interface NotificationsProps {
    user: User;
}

export const Notifications: React.FC<NotificationsProps> = ({ user }) => {
    const [settings, setSettings] = useState<NotificationSettings>({
        lowStockAlert: true,
        lowStockThreshold: 5,
        emailNotifications: false,
        whatsappNotifications: false,
        notificationEmail: '',
        notificationPhone: '',
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        const saved = localStorage.getItem(`notification_settings_${user.tenantId}`);
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    };

    const handleSave = () => {
        localStorage.setItem(`notification_settings_${user.tenantId}`, JSON.stringify(settings));
        alert('✅ Configurações de notificações salvas com sucesso!');
    };

    return (
        <div className="p-2.5 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-800">Notificações</h2>
                        <p className="text-slate-500 font-medium">Configure os alertas e notificações do sistema</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Alertas de Estoque */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Alertas de Estoque Baixo</h3>
                            <p className="text-sm text-slate-500">Receba notificações quando produtos estiverem acabando</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={settings.lowStockAlert}
                                onChange={(e) => setSettings({ ...settings, lowStockAlert: e.target.checked })}
                                className="w-5 h-5 rounded border-2 border-slate-300 text-red-600 focus:ring-2 focus:ring-red-500"
                            />
                            <div className="flex-1">
                                <div className="font-bold text-slate-800">Ativar alertas de estoque baixo</div>
                                <div className="text-xs text-slate-500">Notificar quando produtos atingirem o estoque mínimo</div>
                            </div>
                        </label>

                        {settings.lowStockAlert && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Limite mínimo de estoque</label>
                                <input
                                    type="number"
                                    value={settings.lowStockThreshold}
                                    onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium"
                                    min="0"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Você será notificado quando produtos tiverem {settings.lowStockThreshold} ou menos unidades em estoque
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Configurações de Email (Supabase) */}
                <EmailNotificationSettings user={user} />

                {/* Notificações por E-mail (Local) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Notificações por E-mail</h3>
                            <p className="text-sm text-slate-500">Receba alertas importantes no seu e-mail</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <div className="font-bold text-slate-800">Ativar notificações por e-mail</div>
                                <div className="text-xs text-slate-500">Enviar alertas de estoque e vendas importantes</div>
                            </div>
                        </label>

                        {settings.emailNotifications && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">E-mail para notificações</label>
                                    <input
                                        type="email"
                                        value={settings.notificationEmail}
                                        onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                                        placeholder="seuemail@exemplo.com"
                                    />
                                </div>

                                <button
                                    onClick={async () => {
                                        if (!settings.notificationEmail) {
                                            alert('Insira um email primeiro!');
                                            return;
                                        }
                                        const btn = document.activeElement as HTMLButtonElement;
                                        const originalText = btn.innerText;
                                        btn.innerText = 'Enviando...';
                                        btn.disabled = true;

                                        try {
                                            const result = await EmailService.sendEmail({
                                                to: settings.notificationEmail,
                                                subject: 'Teste de Notificação - Gestor Pro',
                                                html: `
                                                    <h1>Teste de Configuração</h1>
                                                    <p>Este é um email de teste enviado para confirmar que suas notificações estão funcionando corretamente.</p>
                                                    <p>Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
                                                `
                                            });
                                            if (result.success) alert('✅ Email de teste enviado!');
                                            else alert('❌ Falha: ' + result.error);
                                        } finally {
                                            btn.innerText = originalText;
                                            btn.disabled = false;
                                        }
                                    }}
                                    className="py-2.5 px-6 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                                >
                                    <Mail size={18} />
                                    Enviar Email de Teste
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notificações por WhatsApp */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Notificações por WhatsApp</h3>
                            <p className="text-sm text-slate-500">Receba alertas diretamente no WhatsApp</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={settings.whatsappNotifications}
                                onChange={(e) => setSettings({ ...settings, whatsappNotifications: e.target.checked })}
                                className="w-5 h-5 rounded border-2 border-slate-300 text-green-600 focus:ring-2 focus:ring-green-500"
                            />
                            <div className="flex-1">
                                <div className="font-bold text-slate-800">Ativar notificações por WhatsApp</div>
                                <div className="text-xs text-slate-500">Mensagens urgentes sobre estoque e vendas</div>
                            </div>
                        </label>

                        {settings.whatsappNotifications && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Número do WhatsApp</label>
                                <input
                                    type="tel"
                                    value={settings.notificationPhone}
                                    onChange={(e) => setSettings({ ...settings, notificationPhone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 font-medium"
                                    placeholder="(00) 00000-0000"
                                />
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                                    <p className="text-xs text-amber-700">
                                        <strong>Em breve:</strong> A integração com WhatsApp estará disponível nas próximas atualizações.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botão Salvar */}
                <button
                    onClick={handleSave}
                    className="w-full py-5 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 flex items-center justify-center gap-3"
                >
                    <Save size={22} />
                    Salvar Configurações
                </button>
            </div>
        </div>
    );
};
