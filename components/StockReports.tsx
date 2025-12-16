import React, { useState, useEffect } from 'react';
import { User, StockFilters, StockMetrics, SalesMetrics, CategoryReport, ProductReport, ProductSalesReport } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { TrendingUp, TrendingDown, Package, DollarSign, Layers, BarChart3, Calendar, Filter, Download, Loader } from 'lucide-react';

interface StockReportsProps {
    user: User;
}

export const StockReports: React.FC<StockReportsProps> = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [stockMetrics, setStockMetrics] = useState<StockMetrics | null>(null);
    const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
    const [categoryReports, setCategoryReports] = useState<CategoryReport[]>([]);
    const [productReports, setProductReports] = useState<ProductReport[]>([]);
    const [topProducts, setTopProducts] = useState<ProductSalesReport[]>([]);

    // Filters
    const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'custom'>('30days');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [showAllProducts, setShowAllProducts] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadReports();
    }, [period, selectedCategory, customStartDate, customEndDate]);

    const loadCategories = async () => {
        try {
            const products = await SupabaseService.getProducts(user.tenantId);
            const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const getDateFilters = (): StockFilters => {
        const now = new Date();
        let startDate = '';
        let endDate = now.toISOString();

        if (period === 'today') {
            startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        } else if (period === '7days') {
            startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        } else if (period === '30days') {
            startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
        } else if (period === 'custom' && customStartDate && customEndDate) {
            startDate = new Date(customStartDate).toISOString();
            endDate = new Date(customEndDate).toISOString();
        }

        return {
            startDate,
            endDate,
            category: selectedCategory || undefined,
        };
    };

    const loadReports = async () => {
        setLoading(true);
        try {
            const filters = getDateFilters();

            const [stock, sales, categories, products, top] = await Promise.all([
                SupabaseService.getStockMetrics(user.tenantId, filters),
                SupabaseService.getSalesMetrics(user.tenantId, filters),
                SupabaseService.getStockByCategory(user.tenantId, filters),
                SupabaseService.getStockByProduct(user.tenantId, filters),
                SupabaseService.getTopSellingProducts(user.tenantId, filters, 10),
            ]);

            setStockMetrics(stock);
            setSalesMetrics(sales);
            setCategoryReports(categories);
            setProductReports(products);
            setTopProducts(top);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color }: any) => (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">{title}</h3>
            <p className="text-2xl font-extrabold text-slate-800 mb-1 leading-tight">{value}</p>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
    );

    if (loading && !stockMetrics) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">📊 Relatórios de Estoque</h2>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">Métricas consolidadas e análises detalhadas</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl md:rounded-2xl p-2.5 md:p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <Filter className="w-4 h-4 md:w-5 md:h-5 text-violet-500" />
                    <h3 className="text-base md:text-lg font-bold text-slate-800">Filtros</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {/* Period Filter */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Período</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as any)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-violet-500 focus:outline-none transition-colors"
                        >
                            <option value="today">Hoje</option>
                            <option value="7days">Últimos 7 dias</option>
                            <option value="30days">Últimos 30 dias</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoria</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-violet-500 focus:outline-none transition-colors"
                        >
                            <option value="">Todas as categorias</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Date Range */}
                    {period === 'custom' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data Início</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-violet-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data Fim</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-violet-500 focus:outline-none transition-colors"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <MetricCard
                    title="Valor Total em Estoque"
                    value={formatCurrency(stockMetrics?.totalValue || 0)}
                    subtitle={`${formatNumber(stockMetrics?.totalQuantity || 0)} unidades`}
                    icon={Package}
                    color="from-blue-500 to-blue-600"
                />
                <MetricCard
                    title="Total Vendido"
                    value={formatCurrency(salesMetrics?.totalRevenue || 0)}
                    subtitle={`${formatNumber(salesMetrics?.totalQuantitySold || 0)} unidades`}
                    icon={DollarSign}
                    color="from-green-500 to-green-600"
                />
                <MetricCard
                    title="Valor Total"
                    value={formatCurrency((stockMetrics?.totalValue || 0) + (salesMetrics?.totalRevenue || 0))}
                    subtitle="Estoque + Vendas"
                    icon={Layers}
                    color="from-purple-500 to-purple-600"
                />
                <MetricCard
                    title="Lucro Total"
                    value={formatCurrency(salesMetrics?.totalProfit || 0)}
                    subtitle={`Margem: ${salesMetrics?.profitMargin.toFixed(1)}%`}
                    icon={TrendingUp}
                    color="from-violet-500 to-violet-600"
                />
            </div>

            {/* Category Reports */}
            <div className="bg-white rounded-2xl p-2.5 md:p-6 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-violet-500" />
                    Relatório por Categoria
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Qtd Estoque</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Valor Estoque</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Qtd Vendida</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Valor Vendido</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Qtd Total</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Lucro</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">% Estoque</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryReports.map((cat, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-slate-800">{cat.categoryName}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{formatNumber(cat.stockQuantity)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-800">{formatCurrency(cat.stockValue)}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{formatNumber(cat.salesQuantity)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(cat.salesRevenue)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-blue-600">{formatNumber(cat.stockQuantity + cat.salesQuantity)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-violet-600">{formatCurrency(cat.salesProfit)}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{cat.percentage.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white rounded-2xl p-2.5 md:p-6 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-500" />
                    Top 10 Produtos Mais Vendidos
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Posição</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Produto</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Qtd Vendida</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Receita</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Lucro</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Margem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((product, idx) => (
                                <tr key={product.productId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            idx === 1 ? 'bg-slate-100 text-slate-700' :
                                                idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-slate-50 text-slate-600'
                                            }`}>
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 font-bold text-slate-800">{product.productName}</td>
                                    <td className="py-3 px-4 text-slate-600">{product.category}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-800">{formatNumber(product.quantitySold)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(product.revenue)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-violet-600">{formatCurrency(product.profit)}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{product.profitMargin.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Reports */}
            <div className="bg-white rounded-2xl p-2.5 md:p-6 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-violet-500" />
                    Relatório Detalhado por Produto
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Produto</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Qtd Estoque</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Valor Estoque</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Qtd Vendida</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Receita</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Lucro</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Margem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productReports.slice(0, showAllProducts ? productReports.length : 20).map((product) => (
                                <tr key={product.productId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-slate-800">{product.productName}</td>
                                    <td className="py-3 px-4 text-slate-600">{product.category}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{formatNumber(product.stockQuantity)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-800">{formatCurrency(product.stockValue)}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{formatNumber(product.salesQuantity)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(product.salesRevenue)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-violet-600">{formatCurrency(product.profit)}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{product.profitMargin.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {productReports.length > 20 && (
                        <div className="text-center py-6 border-t border-slate-100">
                            {!showAllProducts ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-500">
                                        Mostrando 20 de {productReports.length} produtos
                                    </p>
                                    <button
                                        onClick={() => setShowAllProducts(true)}
                                        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
                                    >
                                        Mostrar Mais
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-500">
                                        Mostrando todos os {productReports.length} produtos
                                    </p>
                                    <button
                                        onClick={() => setShowAllProducts(false)}
                                        className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Mostrar Menos
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
