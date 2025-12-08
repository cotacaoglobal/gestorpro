import React, { useState, useRef } from 'react';
import { User } from '../types';
import { X, Upload, User as UserIcon, Camera } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState(user.passwordHash);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem é muito grande. Use no máximo 2MB.");
        return;
      }
      try {
        const base64 = await convertToBase64(file);
        setAvatar(base64);
      } catch (err) {
        alert("Erro ao processar a imagem.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...user,
      name,
      email,
      passwordHash: password,
      avatar
    };
    onUpdate(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-extrabold text-slate-800">Editar Perfil</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-32 h-32 rounded-full border-4 border-slate-100 shadow-lg overflow-hidden flex items-center justify-center bg-slate-50">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={48} className="text-slate-300" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
            />
            <p className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-wide">Alterar Foto</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome Completo</label>
              <input 
                required 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-violet-500 font-bold text-slate-800" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
              <input 
                required 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-violet-500 font-bold text-slate-800" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Senha</label>
              <input 
                required 
                type="password"
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-violet-500 font-bold text-slate-800" 
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 transition-transform active:scale-95"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};