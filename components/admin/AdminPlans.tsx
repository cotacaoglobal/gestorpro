import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { SaasPlan } from '../../types';

export const AdminPlans: React.FC = () => {
    const [plans, setPlans] = useState<SaasPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<SaasPlan | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const data = await SupabaseService.getPlans();
            setPlans(data);
        } catch (error) {
            console.error('Error loading plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (plan: SaasPlan | Omit<SaasPlan, 'id'>) => {
        try {
            if ('id' in plan) {
                await SupabaseService.updatePlan(plan);
            } else {
                await SupabaseService.createPlan(plan);
            }
            await loadPlans();
            setEditingPlan(null);
            setIsCreating(false);
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('Erro ao salvar plano.');
        }
    };

    const handleDelete = async (planId: string) => {
        if (!confirm('Tem certeza que deseja excluir este plano?')) return;

        try {
            await SupabaseService.deletePlan(planId);
            await loadPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('Erro ao excluir plano.');
        }
    };

    const PlanForm: React.FC<{ plan?: SaasPlan; onSave: (plan: any) => void; onCancel: () => void }> = ({ plan, onSave, onCancel }) => {
        const [formData, setFormData] = useState<Partial<SaasPlan>>(plan || {
            name: '',
            slug: '',
            description: '',
            price: 0,
            limits: { users: 1, products: 100 },
            features: [],
            active: true,
        });

        const [newFeature, setNewFeature] = useState('');

        const addFeature = () => {
            if (newFeature.trim()) {
                setFormData({
                    ...formData,
                    features: [...(formData.features || []), newFeature.trim()]
                });
                setNewFeature('');
            }
        };

        const removeFeature = (index: number) => {
            setFormData({
                ...formData,
                features: formData.features?.filter((_, i) => i !== index) || []
            });
        };

        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold mb-4">{plan ? 'Editar Plano' : 'Novo Plano'}</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border border-gray-200 rounded-lg"
                            placeholder="Ex: Plano Pro"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full p-2 border border-gray-200 rounded-lg"
                            placeholder="pro"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg"
                        rows={2}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                            className="w-full p-2 border border-gray-200 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Limite Usuários</label>
                        <input
                            type="number"
                            value={formData.limits?.users || 0}
                            onChange={e => setFormData({
                                ...formData,
                                limits: { ...formData.limits, users: parseInt(e.target.value) }
                            })}
                            className="w-full p-2 border border-gray-200 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Limite Produtos</label>
                        <input
                            type="number"
                            value={formData.limits?.products || 0}
                            onChange={e => setFormData({
                                ...formData,
                                limits: { ...formData.limits, products: parseInt(e.target.value) }
                            })}
                            className="w-full p-2 border border-gray-200 rounded-lg"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newFeature}
                            onChange={e => setNewFeature(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && addFeature()}
                            className="flex-1 p-2 border border-gray-200 rounded-lg"
                            placeholder="Digite uma feature e pressione Enter"
                        />
                        <button onClick={addFeature} className="px-4 py-2 bg-violet-600 text-white rounded-lg">
                            Adicionar
                        </button>
                    </div>
                    <div className="space-y-1">
                        {formData.features?.map((feature, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm">{feature}</span>
                                <button onClick={() => removeFeature(index)} className="text-red-500">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={e => setFormData({ ...formData, active: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Plano Ativo</span>
                    </label>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onSave(formData)}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                    >
                        <Save size={16} /> Salvar
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        <X size={16} /> Cancelar
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Planos e Limites</h1>
                    <p className="text-gray-500">Gerencie os planos de assinatura do SaaS</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                    <Plus size={20} /> Novo Plano
                </button>
            </div>

            {isCreating && (
                <PlanForm
                    onSave={handleSave}
                    onCancel={() => setIsCreating(false)}
                />
            )}

            {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando planos...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id}>
                            {editingPlan?.id === plan.id ? (
                                <PlanForm
                                    plan={editingPlan}
                                    onSave={handleSave}
                                    onCancel={() => setEditingPlan(null)}
                                />
                            ) : (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                                            <p className="text-sm text-gray-500">{plan.slug}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${plan.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {plan.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <div className="text-3xl font-bold text-violet-600">
                                            R$ {plan.price.toFixed(2)}
                                            <span className="text-sm text-gray-500 font-normal">/mês</span>
                                        </div>
                                    </div>

                                    {plan.description && (
                                        <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                                    )}

                                    <div className="mb-4 space-y-1">
                                        <div className="text-xs text-gray-500">
                                            <strong>Limites:</strong> {plan.limits.users} usuários, {plan.limits.products} produtos
                                        </div>
                                    </div>

                                    {plan.features && plan.features.length > 0 && (
                                        <div className="mb-4">
                                            <div className="text-xs font-semibold text-gray-700 mb-2">Features:</div>
                                            <ul className="space-y-1">
                                                {plan.features.map((feature, idx) => (
                                                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                                        <span className="text-violet-600">✓</span> {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => setEditingPlan(plan)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 text-sm"
                                        >
                                            <Edit2 size={14} /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(plan.id)}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
