import React, { useState, useEffect } from 'react';
import { X, Printer, Settings, Check } from 'lucide-react';
import { ThermalPrintService, PrinterConfig } from '../services/thermalPrintService';

interface PrinterSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState<PrinterConfig>(ThermalPrintService.getConfig());
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setConfig(ThermalPrintService.loadConfig());
            setSaved(false);
        }
    }, [isOpen]);

    const handleSave = () => {
        ThermalPrintService.saveConfig(config);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 1500);
    };

    const handleTestPrint = async () => {
        const testSale = {
            id: 'TEST-' + Date.now(),
            tenantId: 'test',
            sessionId: 'test',
            userId: 'test',
            customerName: 'Cliente Teste',
            customerCpf: '123.456.789-00',
            date: new Date().toISOString(),
            total: 150.00,
            items: [
                {
                    id: '1',
                    name: 'Produto Teste 1',
                    category: 'Teste',
                    barcode: '123456789',
                    internalCode: 'TEST001',
                    priceSell: 50.00,
                    priceCost: 30.00,
                    stock: 10,
                    minStock: 5,
                    image: '',
                    quantity: 2,
                },
                {
                    id: '2',
                    name: 'Produto Teste 2',
                    category: 'Teste',
                    barcode: '987654321',
                    internalCode: 'TEST002',
                    priceSell: 50.00,
                    priceCost: 30.00,
                    stock: 10,
                    minStock: 5,
                    image: '',
                    quantity: 1,
                },
            ],
            payments: [
                { method: 'DINHEIRO' as any, amount: 150.00 },
            ],
        };

        await ThermalPrintService.printReceipt(testSale);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-blue-50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center">
                            <Printer size={28} className="text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">Configurações de Impressão</h2>
                            <p className="text-sm text-slate-500">Configure sua impressora térmica</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* Paper Width */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Largura do Papel</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setConfig({ ...config, paperWidth: '58mm' })}
                                className={`p-6 rounded-2xl border-2 transition-all ${config.paperWidth === '58mm'
                                        ? 'border-violet-600 bg-violet-50 shadow-lg'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-3xl font-black text-slate-800">58mm</div>
                                    <div className="text-xs text-slate-500 mt-1">Compacto</div>
                                    {config.paperWidth === '58mm' && (
                                        <div className="mt-2">
                                            <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                Selecionado
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </button>

                            <button
                                onClick={() => setConfig({ ...config, paperWidth: '80mm' })}
                                className={`p-6 rounded-2xl border-2 transition-all ${config.paperWidth === '80mm'
                                        ? 'border-violet-600 bg-violet-50 shadow-lg'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-3xl font-black text-slate-800">80mm</div>
                                    <div className="text-xs text-slate-500 mt-1">Padrão</div>
                                    {config.paperWidth === '80mm' && (
                                        <div className="mt-2">
                                            <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                Selecionado
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Font Size */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Tamanho da Fonte</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['small', 'normal', 'large'] as const).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setConfig({ ...config, fontSize: size })}
                                    className={`p-4 rounded-xl border-2 transition-all ${config.fontSize === size
                                            ? 'border-violet-600 bg-violet-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className={`font-bold ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'}`}>
                                            Aa
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 capitalize">{size === 'small' ? 'Pequeno' : size === 'large' ? 'Grande' : 'Normal'}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Opções</label>

                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="text-sm font-bold text-slate-700">Mostrar Logo</div>
                                <div className="text-xs text-slate-500">Cabeçalho da loja</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={config.showLogo}
                                onChange={(e) => setConfig({ ...config, showLogo: e.target.checked })}
                                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="text-sm font-bold text-slate-700">QR Code</div>
                                <div className="text-xs text-slate-500">Código da venda</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={config.showQRCode}
                                onChange={(e) => setConfig({ ...config, showQRCode: e.target.checked })}
                                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="text-sm font-bold text-slate-700">Corte Automático</div>
                                <div className="text-xs text-slate-500">Separar comprovantes</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={config.autoCut}
                                onChange={(e) => setConfig({ ...config, autoCut: e.target.checked })}
                                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500"
                            />
                        </label>
                    </div>

                    {/* Store Info */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Informações da Loja</label>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">Nome da Loja</label>
                            <input
                                type="text"
                                value={config.storeName}
                                onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800"
                                placeholder="GESTOR PRO"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">Endereço</label>
                            <input
                                type="text"
                                value={config.storeAddress}
                                onChange={(e) => setConfig({ ...config, storeAddress: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800"
                                placeholder="Rua Exemplo, 123"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-2">Telefone</label>
                                <input
                                    type="text"
                                    value={config.storePhone}
                                    onChange={(e) => setConfig({ ...config, storePhone: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800"
                                    placeholder="(11) 98765-4321"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-2">CNPJ</label>
                                <input
                                    type="text"
                                    value={config.storeCNPJ}
                                    onChange={(e) => setConfig({ ...config, storeCNPJ: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800"
                                    placeholder="00.000.000/0001-00"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
                    <button
                        onClick={handleTestPrint}
                        className="flex-1 py-4 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <Printer size={20} />
                        Imprimir Teste
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saved}
                        className={`flex-1 py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${saved
                                ? 'bg-emerald-600 text-white'
                                : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200'
                            }`}
                    >
                        {saved ? (
                            <>
                                <Check size={20} />
                                Salvo!
                            </>
                        ) : (
                            <>
                                <Settings size={20} />
                                Salvar Configurações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
