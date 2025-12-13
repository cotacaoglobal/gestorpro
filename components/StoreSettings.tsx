import React, { useState } from 'react';
import { Store, MapPin, Phone, Mail, Globe, Upload, Image as ImageIcon } from 'lucide-react';
import { User } from '../types';

interface StoreSettingsProps {
    user: User;
}

export const StoreSettings: React.FC<StoreSettingsProps> = ({ user }) => {
    const [storeName, setStoreName] = useState(localStorage.getItem('store_name') || 'Minha Loja');
    const [storeAddress, setStoreAddress] = useState(localStorage.getItem('store_address') || '');
    const [storePhone, setStorePhone] = useState(localStorage.getItem('store_phone') || '');
    const [storeEmail, setStoreEmail] = useState(localStorage.getItem('store_email') || '');
    const [storeWebsite, setStoreWebsite] = useState(localStorage.getItem('store_website') || '');
    const [storeLogo, setStoreLogo] = useState(localStorage.getItem('store_logo') || '');

    const handleSave = () => {
        localStorage.setItem('store_name', storeName);
        localStorage.setItem('store_address', storeAddress);
        localStorage.setItem('store_phone', storePhone);
        localStorage.setItem('store_email', storeEmail);
        localStorage.setItem('store_website', storeWebsite);
        localStorage.setItem('store_logo', storeLogo);
        alert('✅ Configurações da loja salvas com sucesso!');
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setStoreLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Store size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-800">Configurações da Loja</h2>
                        <p className="text-slate-500 font-medium">Personalize as informações do seu estabelecimento</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
                {/* Logo da Loja */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Logo da Loja</label>
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                            {storeLogo ? (
                                <img src={storeLogo} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <ImageIcon size={48} className="text-slate-400" />
                            )}
                        </div>
                        <div>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all">
                                <Upload size={20} />
                                Enviar Logo
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                            <p className="text-xs text-slate-500 mt-2">PNG, JPG ou SVG. Máx 2MB.</p>
                        </div>
                    </div>
                </div>

                {/* Nome da Loja */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Loja *</label>
                    <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                        placeholder="Ex: Loja do João"
                    />
                </div>

                {/* Endereço */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <MapPin size={16} className="inline mr-1" />
                        Endereço Completo
                    </label>
                    <textarea
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                        rows={3}
                        placeholder="Rua, número, bairro, cidade, CEP"
                    />
                </div>

                {/* Telefone */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <Phone size={16} className="inline mr-1" />
                        Telefone
                    </label>
                    <input
                        type="tel"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                        placeholder="(00) 00000-0000"
                    />
                </div>

                {/* E-mail */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <Mail size={16} className="inline mr-1" />
                        E-mail
                    </label>
                    <input
                        type="email"
                        value={storeEmail}
                        onChange={(e) => setStoreEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                        placeholder="contato@loja.com"
                    />
                </div>

                {/* Website */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <Globe size={16} className="inline mr-1" />
                        Website / Redes Sociais
                    </label>
                    <input
                        type="url"
                        value={storeWebsite}
                        onChange={(e) => setStoreWebsite(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                        placeholder="https://www.minhaloja.com"
                    />
                </div>

                {/* Botão Salvar */}
                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        <Store size={20} />
                        Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    );
};
