import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { User as UserIcon, Shield, ShieldAlert, Trash2 } from 'lucide-react';

interface AdminUsersProps {
  user: User;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'operator' as Role });

  useEffect(() => {
    const loadUsers = async () => {
      if (!user?.tenantId) return;
      const usersData = await SupabaseService.getUsers(user.tenantId);
      setUsers(usersData);
    };
    loadUsers();
  }, [user]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userToAdd: Omit<User, 'id'> = {
        tenantId: user.tenantId,
        name: newUser.name,
        email: newUser.email,
        passwordHash: newUser.password,
        role: newUser.role
      };
      const createdUser = await SupabaseService.addUser(userToAdd);
      setUsers([...users, createdUser]);
      setNewUser({ name: '', email: '', password: '', role: 'operator' });
      alert('Usuário criado!');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Erro ao criar usuário');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remover usuário?')) {
      try {
        await SupabaseService.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
        alert('Usuário removido com sucesso!');
      } catch (error: any) {
        console.error('Error deleting user:', error);
        const errorMessage = error.message || 'Erro ao remover usuário';
        alert(errorMessage);
      }
    }
  };

  const toggleRole = async (user: User) => {
    try {
      const newRole: Role = user.role === 'admin' ? 'operator' : 'admin';
      const updatedUser = { ...user, role: newRole };
      await SupabaseService.updateUser(updatedUser);
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Erro ao alterar função');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Gerenciar Acessos</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h3 className="text-lg font-bold mb-4">Novo Usuário</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <input required placeholder="Nome" className="w-full border p-2 rounded" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
            <input required placeholder="Email" type="email" className="w-full border p-2 rounded" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            <input required placeholder="Senha" type="password" className="w-full border p-2 rounded" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
            <select className="w-full border p-2 rounded" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}>
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">Criar Usuário</button>
          </form>
        </div>

        {/* User List */}
        <div className="md:col-span-2 space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                  {user.role === 'admin' ? <ShieldAlert size={20} /> : <UserIcon size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{user.name}</h4>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-slate-50 text-slate-700'}`}>
                  {user.role}
                </span>
                <button onClick={() => toggleRole(user)} className="text-xs text-blue-600 hover:underline">
                  Trocar Função
                </button>
                <button onClick={() => handleDelete(user.id)} className="p-2 text-red-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};