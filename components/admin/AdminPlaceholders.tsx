import React from 'react';

export const AdminTenants: React.FC = () => (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 min-h-[400px]">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Gerenciar Clientes (Tenants)</h1>
        <p className="text-gray-500">Módulo de listagem de clientes e gerenciamento de status em desenvolvimento.</p>
        <div className="mt-8 border-2 border-dashed border-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-400">
            Area reservada para DataGrid de Tenants
        </div>
    </div>
);

export const AdminPlans: React.FC = () => (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 min-h-[400px]">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Planos e Limites</h1>
        <p className="text-gray-500">Configuração dinâmica de planos, preços e features.</p>
    </div>
);

export const AdminFinancial: React.FC = () => (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 min-h-[400px]">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Financeiro</h1>
        <p className="text-gray-500">Histórico de faturas, inadimplência e integrações de pagamento.</p>
    </div>
);
