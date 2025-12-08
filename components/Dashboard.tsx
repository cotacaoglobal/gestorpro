import React, { useState, useEffect } from 'react';
import { Sale, Product, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, AlertCircle, DollarSign, Package, ChevronRight, Users, ArrowUpRight, ShoppingCart, Activity } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  onViewLowStock: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ sales, products, onViewLowStock }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await SupabaseService.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  // Load active sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessions = await SupabaseService.getSessions();
        const active = sessions.filter(s => s.status === 'OPEN');
        setActiveSessions(active);
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };
    loadSessions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSessions();
      setRefreshKey(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Stats Calculation
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);

  const totalCost = sales.reduce((acc, sale) => {
    return acc + sale.items.reduce((itemAcc, item) => itemAcc + (item.priceCost * item.quantity), 0);
  }, 0);


  const profit = totalRevenue - totalCost;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Chart Data
  const salesByDate = sales.reduce((acc: any, sale) => {
    const date = new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    acc[date] = (acc[date] || 0) + sale.total;
    return acc;
  }, {});

  const lineChartData = Object.keys(salesByDate).map(date => ({
    name: date,
    vendas: salesByDate[date]
  })).slice(-7);

  const categoryData = products.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.keys(categoryData).map(cat => ({
    name: cat,
    value: categoryData[cat]
  }));

  const employeePerformance = users.map(user => {
    const userSales = sales.filter(s => s.userId === user.id);
    const totalSold = userSales.reduce((acc, s) => acc + s.total, 0);
    const saleCount = userSales.length;
    const ticketAvg = saleCount > 0 ? totalSold / saleCount : 0;

    const payments = userSales.flatMap(s => s.payments);
    const paymentBreakdown = payments.reduce((acc: any, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {});

    return {
      name: user.name,
      role: user.role,
      totalSold,
      saleCount,
      ticketAvg,
      paymentBreakdown
    };
  }).sort((a, b) => b.totalSold - a.totalSold);

  const COLORS = ['#8b5cf6', '#c4b5fd', '#a78bfa', '#7c3aed', '#6d28d9']; // Violet shades

  const StatCard = ({ title, value, icon: Icon, color, subValue, onClick, actionLabel }: any) => (
    <div
      className={`bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${onClick ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3.5 rounded-2xl ${color.bg} ${color.text}`}>
          <Icon size={26} strokeWidth={2.5} />
        </div>
        {actionLabel && (
          <div className="bg-slate-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight size={18} className="text-slate-400" />
          </div>
        )}
      </div>

      <div>
        <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        {subValue && (
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${color.tagBg} ${color.text}`}>
              {subValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Calculate today's stats
  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
  const todayTotal = todaySales.reduce((acc, s) => acc + s.total, 0);
  const avgTicket = todaySales.length > 0 ? todayTotal / todaySales.length : 0;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="mt-2 text-slate-500">
            Visão geral do seu negócio • Atualizado agora
          </p>
        </div>
      </div>

      {/* Real-time Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Vendas Hoje"
          value={`R$ ${todayTotal.toFixed(2)}`}
          icon={TrendingUp}
          color={{ bg: 'bg-emerald-100', text: 'text-emerald-600', tagBg: 'bg-emerald-50' }}
          subValue={`${todaySales.length} vendas`}
        />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${avgTicket.toFixed(2)}`}
          icon={DollarSign}
          color={{ bg: 'bg-blue-100', text: 'text-blue-600', tagBg: 'bg-blue-50' }}
          subValue="Hoje"
        />
        <StatCard
          title="Sessões Ativas"
          value={activeSessions.length}
          icon={ShoppingCart}
          color={{ bg: 'bg-violet-100', text: 'text-violet-600', tagBg: 'bg-violet-50' }}
          subValue={`${activeSessions.length} ${activeSessions.length === 1 ? 'operador' : 'operadores'}`}
        />
        <StatCard
          title="Estoque Baixo"
          value={lowStockCount}
          icon={AlertCircle}
          color={{ bg: 'bg-amber-100', text: 'text-amber-600', tagBg: 'bg-amber-50' }}
          onClick={onViewLowStock}
          actionLabel="Ver Produtos"
          subValue={lowStockCount > 0 ? 'Requer atenção' : 'Tudo OK'}
        />
      </div>

      {/* Original Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Faturamento Total"
          value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color={{ bg: 'bg-emerald-50', text: 'text-emerald-600', tagBg: 'bg-emerald-100' }}
        />
        <StatCard
          title="Lucro Estimado"
          value={`R$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color={{ bg: 'bg-violet-50', text: 'text-violet-600', tagBg: 'bg-violet-100' }}
          subValue={`${totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0}% Margem`}
        />
        <StatCard
          title="Produtos Críticos"
          value={lowStockCount}
          icon={AlertCircle}
          color={{ bg: 'bg-rose-50', text: 'text-rose-600', tagBg: 'bg-rose-100' }}
          subValue="Repor Estoque"
          onClick={onViewLowStock}
          actionLabel="Ver"
        />
        <StatCard
          title="Total em Estoque"
          value={products.reduce((acc, p) => acc + p.stock, 0)}
          icon={Package}
          color={{ bg: 'bg-blue-50', text: 'text-blue-600', tagBg: 'bg-blue-100' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800">Vendas Recentes</h3>
            <button className="text-violet-600 font-semibold text-sm hover:bg-violet-50 px-3 py-1 rounded-xl transition-colors">Ver Detalhes</button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineChartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ stroke: '#ddd6fe', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Area type="monotone" dataKey="vendas" stroke="#7c3aed" strokeWidth={4} fillOpacity={1} fill="url(#colorVendas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Categorias</h3>
          <p className="text-sm text-slate-400 mb-6">Distribuição do mix de produtos</p>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  cornerRadius={8}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="block text-2xl font-bold text-slate-800">{products.length}</span>
                <span className="text-xs text-slate-400 uppercase font-bold">Total</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {pieChartData.slice(0, 4).map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-lg">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden p-2">
        <div className="p-6 pb-2 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-violet-100 text-violet-600 rounded-xl">
              <Users size={20} />
            </div>
            Desempenho da Equipe
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs uppercase text-slate-400 font-bold tracking-wider">
              <tr>
                <th className="px-8 py-4">Colaborador</th>
                <th className="px-8 py-4 text-center">Vendas</th>
                <th className="px-8 py-4 text-right">Faturamento</th>
                <th className="px-8 py-4 text-right">Ticket Médio</th>
                <th className="px-8 py-4">Mix de Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employeePerformance.map((emp) => (
                <tr key={emp.name} className="hover:bg-violet-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{emp.name}</div>
                        <div className="text-xs text-slate-400 capitalize">{emp.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="bg-white border border-slate-100 shadow-sm px-3 py-1 rounded-lg text-slate-700 font-bold">
                      {emp.saleCount}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-slate-800">
                    R$ {emp.totalSold.toFixed(2)}
                  </td>
                  <td className="px-8 py-5 text-right text-slate-500 font-medium">
                    R$ {emp.ticketAvg.toFixed(2)}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(emp.paymentBreakdown).map(([method, amount]: any) => (
                        amount > 0 && (
                          <span key={method} className="text-[10px] font-bold border border-slate-100 bg-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm text-slate-500">
                            {method} <span className="text-violet-600">{((amount / emp.totalSold) * 100).toFixed(0)}%</span>
                          </span>
                        )
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};