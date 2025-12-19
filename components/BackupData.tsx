import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, Calendar, Check, AlertCircle, FileText, FileSpreadsheet, File } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { User, Product, Sale } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface BackupDataProps {
    user: User;
}

export const BackupData: React.FC<BackupDataProps> = ({ user }) => {
    const [exporting, setExporting] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [importing, setImporting] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [storeName, setStoreName] = useState('Gestor Pro');

    useEffect(() => {
        const saved = localStorage.getItem('last_backup_date');
        if (saved) setLastBackup(saved);
        loadTenantInfo();
    }, []);

    const loadTenantInfo = async () => {
        try {
            const tenant = await SupabaseService.getTenant(user.tenantId);
            if (tenant) setStoreName(tenant.name);
        } catch (error) {
            console.error('Erro ao carregar info da loja:', error);
        }
    };

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
                version: '1.2',
                timestamp: new Date().toISOString(),
                tenantId: user.tenantId,
                storeName: storeName,
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

            updateLastBackupDate();
            alert('✅ Backup JSON exportado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar backup:', error);
            alert('❌ Erro ao exportar backup. Tente novamente.');
        } finally {
            setExporting(false);
        }
    };

    const updateLastBackupDate = () => {
        const now = new Date().toISOString();
        localStorage.setItem('last_backup_date', now);
        setLastBackup(now);
    };

    const handleExportExcel = async () => {
        try {
            setExportingExcel(true);
            const [products, sales, users] = await Promise.all([
                SupabaseService.getProducts(user.tenantId),
                SupabaseService.getSales(user.tenantId),
                SupabaseService.getUsers(user.tenantId),
            ]);

            const wb = XLSX.utils.book_new();

            // Aba Produtos
            const productsSheet = products.map(p => ({
                'Nome': p.name,
                'Categoria': p.category,
                'Cód. Interno': p.internalCode,
                'Cód. Barras': p.barcode,
                'Preço Venda': p.priceSell,
                'Preço Custo': p.priceCost,
                'Estoque': p.stock,
                'Estoque Mínigo': p.minStock,
                'Fornecedor': p.supplier
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsSheet), 'Produtos');

            // Aba Vendas
            const salesSheet = sales.map(s => ({
                'ID': s.id.substring(0, 8),
                'Data': new Date(s.date).toLocaleString('pt-BR'),
                'Cliente': s.customerName,
                'Total': s.total,
                'Itens': s.items.length,
                'Pagamento': s.payments.map(p => `${p.method}: R$${p.amount}`).join(', ')
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesSheet), 'Vendas');

            // Aba Usuários
            const usersSheet = users.map(u => ({
                'Nome': u.name,
                'Email': u.email,
                'Cargo': u.role
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersSheet), 'Usuários');

            XLSX.writeFile(wb, `dados-${storeName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
            updateLastBackupDate();
            alert('✅ Planilha Excel gerada com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
            alert('❌ Erro ao exportar Excel.');
        } finally {
            setExportingExcel(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            setExportingPDF(true);
            const [products, sales] = await Promise.all([
                SupabaseService.getProducts(user.tenantId),
                SupabaseService.getSales(user.tenantId),
            ]);

            const doc = new jsPDF();
            const timestamp = new Date().toLocaleString('pt-BR');

            // Header do PDF
            doc.setFontSize(22);
            doc.setTextColor(124, 58, 237); // Violet
            doc.text(storeName, 14, 20);
            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139);
            doc.text(`Relatório Geral de Dados - Gerado em: ${timestamp}`, 14, 30);

            // Tabela de Produtos
            doc.setFontSize(16);
            doc.setTextColor(30, 41, 59);
            doc.text('Resumo de Estoque', 14, 45);

            (doc as any).autoTable({
                startY: 50,
                head: [['Produto', 'Categoria', 'Preço', 'Estoque']],
                body: products.map(p => [p.name, p.category, `R$ ${p.priceSell.toFixed(2)}`, p.stock]),
                theme: 'striped',
                headStyles: { fillStyle: [124, 58, 237] }
            });

            // Tabela de Vendas (próxima página ou abaixo se houver espaço)
            const finalY = (doc as any).lastAutoTable.finalY + 15;
            doc.text('Últimas Vendas', 14, finalY);

            (doc as any).autoTable({
                startY: finalY + 5,
                head: [['Data', 'Cliente', 'Total']],
                body: sales.slice(-20).map(s => [
                    new Date(s.date).toLocaleDateString('pt-BR'),
                    s.customerName,
                    `R$ ${s.total.toFixed(2)}`
                ]),
                theme: 'striped',
                headStyles: { fillStyle: [124, 58, 237] }
            });

            doc.save(`relatorio-${storeName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
            updateLastBackupDate();
            alert('✅ Relatório PDF gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('❌ Erro ao exportar PDF.');
        } finally {
            setExportingPDF(false);
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
                {/* Exportar para Excel */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                        <FileSpreadsheet size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Planilha Excel</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                        Exporta produtos, vendas e usuários em abas separadas de um arquivo .xlsx.
                    </p>
                    <button
                        onClick={handleExportExcel}
                        disabled={exportingExcel}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:bg-slate-300"
                    >
                        {exportingExcel ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Download size={20} />}
                        Exportar Excel
                    </button>
                </div>

                {/* Exportar para PDF */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                        <File size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Relatório PDF</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                        Gera um documento PDF com resumos de estoque e histórico de vendas recentes.
                    </p>
                    <button
                        onClick={handleExportPDF}
                        disabled={exportingPDF}
                        className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 disabled:bg-slate-300"
                    >
                        {exportingPDF ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Download size={20} />}
                        Gerar PDF
                    </button>
                </div>

                {/* Exportar JSON (Backup Técnico) */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                        <Download size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">Backup JSON</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                        Backup técnico completo para restauração do sistema em outra instância.
                    </p>

                    <button
                        onClick={handleExportData}
                        disabled={exporting}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:bg-slate-300"
                    >
                        {exporting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Database size={20} />}
                        Exportar JSON
                    </button>
                </div>

                {/* Importar Dados */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                        <Upload size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">Importar JSON</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                        Restaure um backup anterior. Esta ação substituirá os dados atuais.
                    </p>

                    <label className={`w-full py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 flex items-center justify-center gap-2 cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {importing ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Upload size={20} />}
                        Selecionar Backup
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
