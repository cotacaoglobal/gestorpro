import React, { useState, useEffect } from 'react';
import { Folder, Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
import { User } from '../types';

interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
}

interface ManageCategoriesProps {
    user: User;
}

const COLORS = [
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' },
];

const ICONS = ['🍔', '🍕', '🥤', '🍰', '🥗', '🍓', '🥖', '🍖', '📦', '🏷️'];

export const ManageCategories: React.FC<ManageCategoriesProps> = ({ user }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [editing, setEditing] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', color: COLORS[0].value, icon: ICONS[0] });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = () => {
        const saved = localStorage.getItem(`categories_${user.tenantId}`);
        if (saved) {
            setCategories(JSON.parse(saved));
        } else {
            // Categorias padrão
            const defaultCategories: Category[] = [
                { id: '1', name: 'Alimentos', color: '#10B981', icon: '🍔' },
                { id: '2', name: 'Bebidas', color: '#3B82F6', icon: '🥤' },
                { id: '3', name: 'Doces', color: '#EC4899', icon: '🍰' },
                { id: '4', name: 'Outros', color: '#8B5CF6', icon: '📦' },
            ];
            setCategories(defaultCategories);
            saveCategories(defaultCategories);
        }
    };

    const saveCategories = (cats: Category[]) => {
        localStorage.setItem(`categories_${user.tenantId}`, JSON.stringify(cats));
    };

    const handleAdd = () => {
        if (!newCategory.name.trim()) {
            alert('Digite um nome para a categoria');
            return;
        }

        const category: Category = {
            id: Date.now().toString(),
            name: newCategory.name,
            color: newCategory.color,
            icon: newCategory.icon,
        };

        const updated = [...categories, category];
        setCategories(updated);
        saveCategories(updated);
        setNewCategory({ name: '', color: COLORS[0].value, icon: ICONS[0] });
        setAdding(false);
        alert('✅ Categoria adicionada com sucesso!');
    };

    const handleUpdate = (id: string, updates: Partial<Category>) => {
        const updated = categories.map(cat =>
            cat.id === id ? { ...cat, ...updates } : cat
        );
        setCategories(updated);
        saveCategories(updated);
        setEditing(null);
        alert('✅ Categoria atualizada!');
    };

    const handleDelete = (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

        const updated = categories.filter(cat => cat.id !== id);
        setCategories(updated);
        saveCategories(updated);
        alert('✅ Categoria excluída!');
    };

    return (
        <div className="p-2.5 md:p-8 max-w-5xl mx-auto">
            <div className="mb-6 md:mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                            <Folder size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">Categorias</h2>
                            <p className="text-xs md:text-base text-slate-500 font-medium">Organize seus produtos</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setAdding(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                    >
                        <Plus size={20} />
                        Nova Categoria
                    </button>
                </div>
            </div>

            {/* Formulário de Nova Categoria */}
            {adding && (
                <div className="bg-white rounded-3xl shadow-lg border-2 border-purple-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Nova Categoria</h3>
                        <button onClick={() => setAdding(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-3">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Categoria *</label>
                            <input
                                type="text"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
                                placeholder="Ex: Eletrônicos"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Cor</label>
                            <div className="grid grid-cols-4 gap-2">
                                {COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                                        className={`w-10 h-10 rounded-xl transition-all ${newCategory.color === color.value ? 'ring-4 ring-offset-2 ring-purple-500' : ''
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ícone</label>
                            <div className="grid grid-cols-5 gap-2">
                                {ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        onClick={() => setNewCategory({ ...newCategory, icon })}
                                        className={`w-10 h-10 rounded-xl text-2xl transition-all ${newCategory.icon === icon ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-slate-100 hover:bg-slate-200'
                                            }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleAdd}
                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        Salvar Categoria
                    </button>
                </div>
            )}

            {/* Lista de Categorias */}
            <div className="grid md:grid-cols-2 gap-4">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all"
                        style={{ borderLeftWidth: '4px', borderLeftColor: category.color }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                                    style={{ backgroundColor: `${category.color}20` }}
                                >
                                    {category.icon}
                                </div>
                                <div>
                                    {editing === category.id ? (
                                        <input
                                            type="text"
                                            defaultValue={category.name}
                                            onBlur={(e) => handleUpdate(category.id, { name: e.target.value })}
                                            className="px-3 py-2 border-2 border-purple-300 rounded-lg font-bold text-slate-800"
                                            autoFocus
                                        />
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-bold text-slate-800">{category.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Tag size={14} className="text-slate-400" />
                                                <span className="text-xs text-slate-500">Categoria</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditing(editing === category.id ? null : category.id)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(category.id)}
                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {categories.length === 0 && !adding && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <Folder size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium mb-4">Nenhuma categoria criada ainda</p>
                    <button
                        onClick={() => setAdding(true)}
                        className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all inline-flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Criar Primeira Categoria
                    </button>
                </div>
            )}
        </div>
    );
};
