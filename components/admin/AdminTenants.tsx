import React, { useEffect, useState } from 'react';
import { Search, Ban, CheckCircle, MoreVertical, Trash2, Power, CreditCard } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { Tenant, Subscription } from '../../types';
import { ManageSubscriptionModal } from './ManageSubscriptionModal';

export const AdminTenants: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [subscriptions, setSubscriptions] = useState<Map<string, Subscription>>(new Map());
    const [selectedTenant, setSelectedTenant] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        loadTenants();
        // Close dropdown when clicking outside
        const handleClick = () => setOpenDropdown(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const loadTenants = async () => {
        try {
            setLoading(true);
            const data = await SupabaseService.getTenants();
            setTenants(data);

            // Load subscriptions for each tenant
            const subsMap = new Map<string, Subscription>();
            await Promise.all(data.map(async (tenant) => {
                try {
                    const sub = await SupabaseService.getSubscription(tenant.id);
                    if (sub) subsMap.set(tenant.id, sub);
                } catch (err) {
                    // Ignore errors for individual subscriptions
                }
            }));
            setSubscriptions(subsMap);
        } catch (error) {
            console.error('Error loading tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        const action = newStatus === 'suspended' ? 'suspender' : 'reativar';

        if (!confirm(`Tem certeza que deseja ${action} este cliente?`)) return;

        try {
            await SupabaseService.updateTenantStatus(tenantId, newStatus);
            await loadTenants();
            setOpenDropdown(null);
        } catch (error) {
            console.error('Error updating tenant status:', error);
            alert('Erro ao atualizar status.');
        }
    };

    const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
        const confirmation = prompt(
            `⚠️ ATENÇÃO: Você está prestes a EXCLUIR permanentemente a empresa "${tenantName}".\n\n` +
            `Esta ação é IRREVERSÍVEL e removerá todos os dados associados.\n\n` +
            `Digite "EXCLUIR" para confirmar:`
        );

        if (confirmation !== 'EXCLUIR') return;

        try {
            await SupabaseService.deleteTenant(tenantId);
            await loadTenants();
            setOpenDropdown(null);
            alert('Empresa excluída com sucesso.');
        } catch (error) {
            console.error('Error deleting tenant:', error);
            alert('Erro ao excluir empresa. Verifique se não há dados dependentes.');
        }
    };

    const filteredTenants = tenants.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || t.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-[10px] md:p-6 space-y-6 animate-in fade-in duration-500 w-full overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Gerenciar Clientes</h1>
                    <p className="text-sm text-gray-500">Listagem completa de inquilinos do SaaS</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="p-2 border border-gray-200 rounded-lg bg-white w-full sm:w-auto"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value as any)}
                    >
                        <option value="all">Todos</option>
                        <option value="active">Ativos</option>
                        <option value="suspended">Suspensos</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Empresa</th>
                                <th className="p-4 font-semibold text-gray-600">Responsável</th>
                                <th className="p-4 font-semibold text-gray-600">Assinatura</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-gray-600">Data Cadastro</th>
                                <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Carregando dados...</td>
                                </tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Nenhum cliente encontrado.</td>
                                </tr>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{tenant.name}</div>
                                            <div className="text-xs text-gray-400">ID: {tenant.slug}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700">{tenant.ownerName || '---'}</div>
                                            <div className="text-xs text-gray-400">{tenant.ownerEmail}</div>
                                        </td>
                                        <td className="p-4">
                                            {subscriptions.get(tenant.id) ? (
                                                <div>
                                                    <div className="font-medium text-gray-800">
                                                        {subscriptions.get(tenant.id)!.planName || tenant.plan.toUpperCase()}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <span className={`w-2 h-2 rounded-full ${subscriptions.get(tenant.id)!.status === 'active' ? 'bg-emerald-500' :
                                                            subscriptions.get(tenant.id)!.status === 'trial' ? 'bg-blue-500' :
                                                                subscriptions.get(tenant.id)!.status === 'expired' ? 'bg-red-500' :
                                                                    'bg-gray-400'
                                                            }`}></span>
                                                        {subscriptions.get(tenant.id)!.status}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Sem assinatura</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {tenant.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold">
                                                    <CheckCircle size={12} /> Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold">
                                                    <Ban size={12} /> Suspenso
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">
                                            {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('pt-BR') : '---'}
                                        </td>
                                        <td className="p-4 text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdown(openDropdown === tenant.id ? null : tenant.id);
                                                }}
                                                className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openDropdown === tenant.id && (
                                                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTenant({ id: tenant.id, name: tenant.name });
                                                            setOpenDropdown(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-violet-50 transition-colors text-sm text-violet-600"
                                                    >
                                                        <CreditCard size={16} />
                                                        <span>Gerenciar Assinatura</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleStatus(tenant.id, tenant.status);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                                                    >
                                                        <Power size={16} className={tenant.status === 'active' ? 'text-orange-500' : 'text-green-500'} />
                                                        <span>{tenant.status === 'active' ? 'Suspender' : 'Reativar'}</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTenant(tenant.id, tenant.name);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-red-50 transition-colors text-sm text-red-600 border-t border-gray-100"
                                                    >
                                                        <Trash2 size={16} />
                                                        <span>Excluir Empresa</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedTenant && (
                <ManageSubscriptionModal
                    tenantId={selectedTenant.id}
                    tenantName={selectedTenant.name}
                    currentSubscription={subscriptions.get(selectedTenant.id) || null}
                    onClose={() => setSelectedTenant(null)}
                    onSuccess={() => {
                        loadTenants();
                        setSelectedTenant(null);
                    }}
                />
            )}
        </div>
    );
};
