import React, { useState, useMemo, useEffect } from 'react';
import { Sale, User } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Calendar, CreditCard, ChevronDown, ChevronUp, User as UserIcon, Download, FileText, Filter } from 'lucide-react';

interface HistoryProps {
  sales: Sale[];
  user: User;
}

type Period = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL';

export const SalesHistory: React.FC<HistoryProps> = ({ sales, user }) => {
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('TODAY');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (!user?.tenantId) return;
        const usersData = await SupabaseService.getUsers(user.tenantId);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, [user]);

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Usuário Removido';
    return users.find(u => u.id === userId)?.name || 'Desconhecido';
  };

  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      switch (period) {
        case 'TODAY': return saleDate >= startOfDay;
        case 'WEEK':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return saleDate >= startOfWeek;
        case 'MONTH': return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        case 'YEAR': return saleDate.getFullYear() === now.getFullYear();
        default: return true;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, period]);

  const handleExport = () => {
    if (filteredSales.length === 0) return alert("Sem dados.");
    const csvContent = "data:text/csv;charset=utf-8," +
      ["ID;Data;Valor"].concat(filteredSales.map(s => `${s.id};${s.date};${s.total}`)).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vendas.csv");
    document.body.appendChild(link);
    link.click();
  };

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case 'TODAY': return 'Hoje';
      case 'WEEK': return 'Esta Semana';
      case 'MONTH': return 'Este Mês';
      case 'YEAR': return 'Este Ano';
      default: return 'Geral';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Histórico</h2>
          <p className="text-slate-500 font-medium">Registro completo de transações</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          {(['TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${period === p
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>
        <button onClick={handleExport} className="bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm">
          <Download size={18} /> CSV
        </button>
      </div>

      <div className="space-y-4">
        {filteredSales.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FileText size={32} />
            </div>
            <p className="text-slate-400 font-medium">Nenhuma venda encontrada.</p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div key={sale.id} className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all border border-slate-50 overflow-hidden group">
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center font-bold text-xs shadow-sm">
                      {new Date(sale.date).getDate()}
                      <span className="text-[10px] uppercase block -mt-1">{new Date(sale.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        R$ {sale.total.toFixed(2)}
                      </div>
                      <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>#{sale.id.slice(-6)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <UserIcon size={16} /> <span className="font-semibold text-slate-700">{sale.customerName}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      {sale.payments.map((p, i) => (
                        <span key={i} className="text-[10px] uppercase font-bold bg-slate-50 text-slate-500 border border-slate-100 px-2 py-1 rounded-lg">{p.method}</span>
                      ))}
                    </div>
                    {expandedSale === sale.id ? <ChevronUp className="text-violet-500" /> : <ChevronDown className="text-slate-300 group-hover:text-violet-500" />}
                  </div>
                </div>
              </div>

              {expandedSale === sale.id && (
                <div className="bg-slate-50/50 p-6 border-t border-slate-100 animate-in slide-in-from-top-2">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Produtos</h4>
                      <ul className="space-y-2">
                        {sale.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-sm p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <span className="font-medium text-slate-700"><span className="text-violet-600 font-bold">{item.quantity}x</span> {item.name}</span>
                            <span className="font-bold text-slate-800">R$ {(item.priceSell * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Pagamento & Detalhes</h4>
                      <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-2 shadow-sm">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Vendedor</span>
                          <span className="font-bold text-slate-700">{getUserName(sale.userId)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">CPF Cliente</span>
                          <span className="font-bold text-slate-700">{sale.customerCpf || '-'}</span>
                        </div>
                        <div className="border-t border-slate-100 my-2 pt-2">
                          {sale.payments.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-slate-500">{p.method}</span>
                              <span className="font-bold text-slate-800">R$ {p.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};