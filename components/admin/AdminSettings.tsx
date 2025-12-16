import React, { useState } from 'react';
import { Settings, Mail, Bell, Key, Activity, Save } from 'lucide-react';

export const AdminSettings: React.FC = () => {
    const [platformConfig, setPlatformConfig] = useState({
        platformName: 'GestorPro SaaS',
        supportEmail: 'suporte@gestorpro.com',
        logoUrl: '',
    });

    const [notifications, setNotifications] = useState({
        newSignups: true,
        paymentFailures: true,
        monthlyReports: false,
    });

    const [apiKeys, setApiKeys] = useState({
        stripeKey: 'sk_test_*********************',
        sendgridKey: 'SG.*********************',
    });

    const handleSavePlatform = () => {
        // TODO: Implement save to database
        alert('Configurações da plataforma salvas com sucesso!');
    };

    const handleSaveNotifications = () => {
        // TODO: Implement save to database
        alert('Preferências de notificação salvas com sucesso!');
    };

    return (
        <div className="p-[10px] md:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
                <p className="text-gray-500">Gerencie configurações globais da plataforma</p>
            </div>

            {/* Platform Configuration */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-violet-50 rounded-lg">
                        <Settings className="text-violet-600" size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Configuração da Plataforma</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Plataforma</label>
                        <input
                            type="text"
                            value={platformConfig.platformName}
                            onChange={e => setPlatformConfig({ ...platformConfig, platformName: e.target.value })}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email de Suporte</label>
                        <input
                            type="email"
                            value={platformConfig.supportEmail}
                            onChange={e => setPlatformConfig({ ...platformConfig, supportEmail: e.target.value })}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL do Logo</label>
                        <input
                            type="text"
                            value={platformConfig.logoUrl}
                            onChange={e => setPlatformConfig({ ...platformConfig, logoUrl: e.target.value })}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="https://exemplo.com/logo.png"
                        />
                    </div>

                    <button
                        onClick={handleSavePlatform}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                    >
                        <Save size={16} /> Salvar Configurações
                    </button>
                </div>
            </div>

            {/* Email Templates */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Mail className="text-blue-600" size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Templates de Email</h2>
                </div>

                <div className="space-y-3">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-violet-300 cursor-pointer transition-colors">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800">Email de Boas-vindas</h3>
                                <p className="text-sm text-gray-500">Enviado quando um novo cliente se cadastra</p>
                            </div>
                            <button className="text-violet-600 hover:text-violet-700 text-sm font-medium">
                                Editar
                            </button>
                        </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg hover:border-violet-300 cursor-pointer transition-colors">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800">Fatura Gerada</h3>
                                <p className="text-sm text-gray-500">Enviado quando uma nova fatura é criada</p>
                            </div>
                            <button className="text-violet-600 hover:text-violet-700 text-sm font-medium">
                                Editar
                            </button>
                        </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg hover:border-violet-300 cursor-pointer transition-colors">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800">Pagamento Falhou</h3>
                                <p className="text-sm text-gray-500">Enviado quando um pagamento não é processado</p>
                            </div>
                            <button className="text-violet-600 hover:text-violet-700 text-sm font-medium">
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                        <Bell className="text-yellow-600" size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Preferências de Notificação</h2>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <div>
                            <div className="font-medium text-gray-800">Novos Cadastros</div>
                            <div className="text-sm text-gray-500">Receber email quando um novo cliente se cadastrar</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.newSignups}
                            onChange={e => setNotifications({ ...notifications, newSignups: e.target.checked })}
                            className="w-5 h-5 text-violet-600"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <div>
                            <div className="font-medium text-gray-800">Falhas de Pagamento</div>
                            <div className="text-sm text-gray-500">Receber alerta quando um pagamento falhar</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.paymentFailures}
                            onChange={e => setNotifications({ ...notifications, paymentFailures: e.target.checked })}
                            className="w-5 h-5 text-violet-600"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <div>
                            <div className="font-medium text-gray-800">Relatórios Mensais</div>
                            <div className="text-sm text-gray-500">Receber resumo mensal de métricas</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.monthlyReports}
                            onChange={e => setNotifications({ ...notifications, monthlyReports: e.target.checked })}
                            className="w-5 h-5 text-violet-600"
                        />
                    </label>

                    <button
                        onClick={handleSaveNotifications}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                    >
                        <Save size={16} /> Salvar Preferências
                    </button>
                </div>
            </div>

            {/* API Keys */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-full overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-50 rounded-lg">
                        <Key className="text-green-600" size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Chaves de API</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stripe API Key</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="password"
                                value={apiKeys.stripeKey}
                                readOnly
                                className="flex-1 p-2 border border-gray-200 rounded-lg bg-gray-50 min-w-0"
                            />
                            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 w-full sm:w-auto">
                                Regenerar
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SendGrid API Key</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="password"
                                value={apiKeys.sendgridKey}
                                readOnly
                                className="flex-1 p-2 border border-gray-200 rounded-lg bg-gray-50 min-w-0"
                            />
                            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 w-full sm:w-auto">
                                Regenerar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <Activity className="text-purple-600" size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Logs de Auditoria</h2>
                </div>

                <div className="text-center py-8 text-gray-400">
                    <Activity size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>Sistema de logs em desenvolvimento</p>
                    <p className="text-xs mt-1">Em breve você poderá visualizar todas as atividades do sistema</p>
                </div>
            </div>
        </div>
    );
};
