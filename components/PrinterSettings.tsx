import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PrinterSettingsModal } from './PrinterSettingsModal';
import { Printer } from 'lucide-react';

export const PrinterSettings: React.FC = () => {
    const navigate = useNavigate();

    const handleClose = () => {
        // Navega de volta para o dashboard
        navigate('/dashboard');
    };

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center">
                        <Printer size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-800">Configurações da Impressora Térmica</h2>
                        <p className="text-slate-500 font-medium">Configure tamanho do papel, fonte e informações do recibo</p>
                    </div>
                </div>
            </div>

            {/* Modal de Configurações */}
            <PrinterSettingsModal
                isOpen={true}
                onClose={handleClose}
            />
        </div>
    );
};
