import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, Calendar, Check, AlertCircle, FileText } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { User } from '../types';

interface BackupDataProps {
    user: User;
}

export const BackupData: React.FC<BackupDataProps> = ({ user }) => {
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('last_backup_date');
        if (saved) setLastBackup(saved);
    }, []);

    const handleExportData = async () => {
        try {
            setExporting(true);

            // Busca todos os dados
            const [products, sales, users, sessions] = await Promise.all([
                SupabaseService.getProducts(user.tenantId),
                SupabaseService.getSales(user.tenantId),
                SupabaseService.getUsers(user.tenantId),
                SupabaseService.getSessions(user.tenantId),
            ]);

            const backupData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                tenantId: user.tenantId,
                data: {
                    products,
                    sales,
                    users,
                    sessions,
                },
            };

            // Cria arquivo JSON
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `backup-gestorpro-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Salva data do último backup
            const now = new Date().toISOString();
            localStorage.setItem('last_backup_date', now);
            setLastBackup(now);

            alert('✅ Backup exportado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar backup:', error);
            alert('❌ Erro ao exportar backup. Tente novamente.');
        } finally {
            setExporting(false);
        }
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                setImporting(true);
                const content = event.target?.result as string;
                const backupData = JSON.parse(content);

                // Validação básica
                if (!backupData.data || !backupData.tenantId) {
                    throw new Error('Formato de backup inválido');
                }

                const confirmation = confirm(
                    `⚠️ ATENÇÃO: Importar dados substituirá os dados atuais.\n\n` +
                    `Backup de: ${new Date(backupData.timestamp).toLocaleString('pt-BR')}\n` +
                    `Produtos: ${backupData.data.products?.length || 0}\n` +
                    `Vendas: ${backupData.data.sales?.length || 0}\n\n` +
                    `Deseja continuar?`
                );

                if (!confirmation) {
                    setImporting(false);
                    return;
                }

                // Aqui você implementaria a lógica de importação real
                // Por enquanto, apenas mostra aviso
                alert('⚠️ Funcionalidade de importação em desenvolvimento.\nPor segurança, consulte um administrador para restaurar backups.');

            } catch (error) {
                console.error('Erro ao importar backup:', error);
                alert('❌ Erro ao importar backup. Verifique se o arquivo é válido.');
            } finally {
                setImporting(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-2.5 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-800">Backup de Dados</h2>
                        <p className="text-slate-500 font-medium">Exporte e importe seus dados com segurança</p>
                    </div>
                </div>
            </div>

            {/* Último Backup */}
            {lastBackup && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
                    <Check className="text-green-600" size={20} />
                    <div>
                        <div className="font-bold text-green-800 text-sm">Último backup realizado</div>
                        <div className="text-green-600 text-xs">
                            {new Date(lastBackup).toLocaleString('pt-BR')}
                        </div>
                    </div>
                </div>
            )}

            {/* Cards de Ação */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Exportar Dados */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                        <Download size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">Exportar Dados</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                        Faça download de todos os seus dados (produtos, vendas, usuários) em formato JSON.
                    </p>

                    <ul className="space-y-2 mb-6 text-sm">
                        <li className="flex items-center gap-2 text-slate-600">
                            <Check size={16} className="text-green-600" />
                            Todos os produtos
                        </li>
                        <li className="flex items-center gap-2 text-slate-600">
                            <Check size={16} className="text-green-600" />
                            Histórico de vendas
                        </li>
                        <li className="flex items-center gap-2 text-slate-600">
                            <Check size={16} className="text-green-600" />
                            Usuários e sessões
                        </li>
                        <li className="flex items-center gap-2 text-slate-600">
                            <Check size={16} className="text-green-600" />
                            Configurações
                        </li>
                    </ul>

                    <button
                        onClick={handleExportData}
                        disabled={exporting}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        {exporting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                Exportando...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Exportar Agora
                            </>
                        )}
                    </button>
                </div>

                {/* Importar Dados */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                        <Upload size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">Importar Dados</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                        Restaure um backup anterior. Esta ação substituirá os dados atuais.
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <div className="flex gap-2">
                            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold text-amber-800 text-xs uppercase mb-1">Atenção</div>
                                <div className="text-amber-700 text-xs">
                                    A importação substituirá todos os dados atuais. Faça um backup antes de prosseguir.
                                </div>
                            </div>
                        </div>
                    </div>

                    <label className={`w-full py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2 cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {importing ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                Importando...
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                Selecionar Backup
                            </>
                        )}
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            disabled={importing}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            {/* Informações Adicionais */}
            <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-start gap-3">
                    <FileText size={20} className="text-slate-400 mt-1" />
                    <div className="text-sm text-slate-600 space-y-2">
                        <p className="font-bold text-slate-800">📌 Recomendações:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Faça backups regularmente (semanalmente ou mensalmente)</li>
                            <li>Armazene os arquivos de backup em local seguro (nuvem ou HD externo)</li>
                            <li>Teste a restauração periodicamente para garantir integridade</li>
                            <li>Mantenha múltiplas versões de backup (últimas 3-5)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
