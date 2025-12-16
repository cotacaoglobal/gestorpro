import React, { useState, useEffect } from 'react';
import { Product, User } from '../types';
import { Plus, Search, Trash2, Edit, AlertTriangle, Upload, X, Image as ImageIcon, Printer, Filter, MoreHorizontal, Copy, ChevronDown, SlidersHorizontal, XCircle, ArrowUpDown, BarChart3 } from 'lucide-react';
import { StockReports } from './StockReports';

interface InventoryProps {
  products: Product[];
  onUpdate: (product: Product, isNew: boolean) => Promise<void>;
  onDelete: (productId: string) => Promise<void>;
  initialFilterLowStock?: boolean;
  user: User;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onUpdate, onDelete, initialFilterLowStock = false, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterLowStock, setFilterLowStock] = useState(initialFilterLowStock);
  const [showReports, setShowReports] = useState(false);

  // Advanced Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'normal' | 'high'>('all');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setFilterLowStock(initialFilterLowStock);
    if (initialFilterLowStock) {
      setStockFilter('low');
    }
  }, [initialFilterLowStock]);

  const [formData, setFormData] = useState<Partial<Product>>({});

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        category: 'Geral',
        stock: 0,
        minStock: 5,
        priceSell: 0,
        priceCost: 0,
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await onDelete(id);
    }
  };

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
      if (file.size > 1024 * 1024) {
        alert("A imagem é muito grande. Por favor, use uma imagem menor que 1MB.");
        return;
      }
      try {
        const base64 = await convertToBase64(file);
        setFormData({ ...formData, image: base64 });
      } catch (err) {
        alert("Erro ao processar a imagem.");
      }
    }
  };

  const handlePrintBarcode = (product: Product) => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Etiqueta - ${product.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .label-container { text-align: center; width: 300px; }
              .product-name { font-size: 16px; font-weight: 700; margin-bottom: 5px; text-transform: uppercase; }
              .price { font-size: 24px; font-weight: 800; margin: 10px 0; }
              .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 60px; line-height: 1; margin: 10px 0; }
              .barcode-text { font-family: monospace; font-size: 14px; letter-spacing: 2px; }
            </style>
          </head>
          <body>
            <div class="label-container">
              <div class="product-name">${product.name}</div>
              <div class="price">R$ ${product.priceSell.toFixed(2)}</div>
              <div class="barcode">*${product.barcode}*</div>
              <div class="barcode-text">${product.barcode}</div>
            </div>
            <script>document.fonts.ready.then(() => window.print());</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleBulkPrint = (product: Product) => {
    if (product.stock <= 0) {
      alert("O estoque deste produto é 0. Não há etiquetas para imprimir.");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (printWindow) {
      const labelsHTML = Array(product.stock).fill(0).map(() => `
        <div class="label">
          <div class="name">${product.name}</div>
          <div class="price">R$ ${product.priceSell.toFixed(2)}</div>
          <div class="barcode-font">*${product.barcode}*</div>
          <div class="barcode-num">${product.barcode}</div>
        </div>
      `).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Impressão em Massa - ${product.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #fff; }
              .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
              .label { 
                border: 1px dashed #ccc; 
                border-radius: 8px; 
                padding: 10px; 
                text-align: center; 
                height: 120px; 
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                align-items: center; 
                page-break-inside: avoid;
              }
              .name { font-size: 10px; font-weight: 700; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
              .price { font-size: 16px; font-weight: 800; margin: 2px 0; }
              .barcode-font { font-family: 'Libre Barcode 39', cursive; font-size: 40px; line-height: 1; }
              .barcode-num { font-family: monospace; font-size: 10px; letter-spacing: 1px; }
              @media print {
                body { padding: 0; }
                .label { border: none; outline: 1px dashed #eee; }
              }
            </style>
          </head>
          <body>
            <div class="sheet">
              ${labelsHTML}
            </div>
            <script>document.fonts.ready.then(() => window.print());</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.priceSell) return;

    const finalImage = formData.image || 'https://via.placeholder.com/200?text=Sem+Imagem';

    try {
      if (editingProduct) {
        // Update existing product
        const updatedProduct = { ...editingProduct, ...formData, image: finalImage } as Product;
        await onUpdate(updatedProduct, false);
      } else {
        // Create new product
        const newProduct = {
          id: Date.now().toString(),
          internalCode: `COD${Date.now().toString().slice(-4)}`,
          barcode: formData.barcode || Math.floor(Math.random() * 10000000).toString(),
          name: formData.name!,
          category: formData.category || 'Geral',
          priceSell: formData.priceSell!,
          priceCost: formData.priceCost || 0,
          stock: formData.stock || 0,
          minStock: formData.minStock || 5,
          image: finalImage
        } as Product;
        await onUpdate(newProduct, true);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  // Get unique categories
  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.category)))];

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('Todas');
    setStockFilter('all');
    setPriceMin('');
    setPriceMax('');
    setFilterLowStock(false);
    setSearchTerm('');
  };

  // Check if any filter is active
  const hasActiveFilters = selectedCategory !== 'Todas' || stockFilter !== 'all' || priceMin !== '' || priceMax !== '' || filterLowStock;

  // Advanced filtering and sorting
  const filteredProducts = products
    .filter(p => {
      // Search filter
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm) ||
        p.internalCode.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;

      // Stock filter
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = p.stock <= p.minStock;
      } else if (stockFilter === 'normal') {
        matchesStock = p.stock > p.minStock && p.stock <= p.minStock * 3;
      } else if (stockFilter === 'high') {
        matchesStock = p.stock > p.minStock * 3;
      }

      // Price filter
      const minPrice = priceMin ? parseFloat(priceMin) : 0;
      const maxPrice = priceMax ? parseFloat(priceMax) : Infinity;
      const matchesPrice = p.priceSell >= minPrice && p.priceSell <= maxPrice;

      return matchesSearch && matchesCategory && matchesStock && matchesPrice;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        comparison = a.priceSell - b.priceSell;
      } else if (sortBy === 'stock') {
        comparison = a.stock - b.stock;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // If showing reports, render StockReports component
  if (showReports) {
    return (
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Estoque</h2>
            <p className="text-slate-500 font-medium">Relatórios e análises detalhadas</p>
          </div>
          <button
            onClick={() => setShowReports(false)}
            className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-sm border border-slate-200 transition-all"
          >
            ← Voltar para Produtos
          </button>
        </div>
        <StockReports user={user} />
      </div>
    );
  }

  return (
    <div className="p-2.5 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Estoque</h2>
          <p className="text-sm md:text-base text-slate-500 font-medium">
            Gerencie seus produtos e preços • {filteredProducts.length} de {products.length} produtos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowReports(true)}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-violet-200 transition-all text-sm md:text-base"
          >
            <BarChart3 size={18} className="md:w-5 md:h-5" />
            <span>📊 Relatórios</span>
          </button>
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 md:left-4 top-2.5 md:top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produto..."
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-violet-500 text-slate-700 placeholder:text-slate-400 font-medium text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 md:px-5 py-2.5 md:py-3 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-sm text-sm md:text-base ${hasActiveFilters || showFilters
              ? 'bg-violet-100 text-violet-700 shadow-violet-100'
              : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <SlidersHorizontal size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="bg-violet-600 text-white px-2 py-0.5 rounded-full text-xs font-black min-w-[20px] text-center">
                {[selectedCategory !== 'Todas', stockFilter !== 'all', priceMin !== '', priceMax !== ''].filter(Boolean).length}
              </span>
            )}
            <ChevronDown size={14} className={`md:w-4 md:h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-violet-200 transition-transform active:scale-95 text-sm md:text-base"
          >
            <Plus size={18} className="md:w-5 md:h-5" /> <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoria</label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 pr-10 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800 appearance-none cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status Estoque</label>
              <div className="relative">
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 pr-10 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800 appearance-none cursor-pointer"
                >
                  <option value="all">Todos</option>
                  <option value="low">🔴 Baixo Estoque</option>
                  <option value="normal">🟡 Estoque Normal</option>
                  <option value="high">🟢 Estoque Alto</option>
                </select>
                <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Faixa de Preço</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-slate-400 text-xs font-bold">Min</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-2 py-3 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800 text-sm"
                  />
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-slate-400 text-xs font-bold">Max</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="999.99"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-2 py-3 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ordenar Por</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 pr-10 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800 appearance-none cursor-pointer text-sm"
                  >
                    <option value="name">Nome</option>
                    <option value="price">Preço</option>
                    <option value="stock">Estoque</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16} />
                </div>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                  title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                >
                  <ArrowUpDown size={18} className={`text-slate-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
              >
                <XCircle size={16} />
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <div className="overflow-y-auto flex-1 pb-20 md:pb-0">
            {/* Desktop Table View */}
            <table className="w-full text-left text-sm text-slate-600 hidden md:table">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-8 py-5">Produto</th>
                  <th className="px-8 py-5">Categoria</th>
                  <th className="px-8 py-5">Preço</th>
                  <th className="px-8 py-5">Estoque</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-violet-50/30 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shadow-sm">
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-base">{product.name}</div>
                          <div className="text-xs text-slate-400 font-medium tracking-wide">{product.barcode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="font-bold text-slate-800 text-base">R$ {product.priceSell.toFixed(2)}</div>
                      <div className="text-xs text-slate-400">Custo: R$ {product.priceCost.toFixed(2)}</div>
                    </td>
                    <td className="px-8 py-4">
                      {product.stock <= product.minStock ? (
                        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl w-fit font-bold text-xs">
                          <AlertTriangle size={14} /> {product.stock} un
                        </div>
                      ) : (
                        <div className="text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-xl w-fit text-xs">
                          {product.stock} un
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleBulkPrint(product)}
                          title="Imprimir Etiquetas (Estoque)"
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => handlePrintBarcode(product)}
                          title="Imprimir Etiqueta Única"
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          <Printer size={18} />
                        </button>
                        <button onClick={() => handleOpenModal(product)} className="p-2 text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-colors">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile List View (Cards) */}
            <div className="md:hidden space-y-4 p-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shadow-sm flex-shrink-0">
                      <img src={product.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-2">{product.name}</h4>
                        {product.stock <= product.minStock && (
                          <AlertTriangle size={16} className="text-rose-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-medium tracking-wide mt-1">{product.barcode}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase">
                          {product.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${product.stock <= product.minStock ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'
                          }`}>
                          Estoque: {product.stock}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div>
                      <div className="text-xs text-slate-400">Preço Venda</div>
                      <div className="font-black text-violet-600 text-lg">R$ {product.priceSell.toFixed(2)}</div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePrintBarcode(product)}
                        className="p-2.5 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <Printer size={20} />
                      </button>
                      <button onClick={() => handleOpenModal(product)} className="p-2.5 text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors shadow-lg shadow-violet-200">
                        <Edit size={20} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={24} className="opacity-50" />
                </div>
                <p className="font-medium">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{editingProduct ? 'Editar Produto' : 'Adicionar Produto'}</h3>
                <p className="text-slate-500 text-sm">Preencha os detalhes do item abaixo</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group hover:border-violet-400 transition-colors">
                      {formData.image ? (
                        <img src={formData.image} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-slate-300" size={32} />
                      )}
                      <label htmlFor="img-up" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="text-white" size={24} />
                      </label>
                      <input id="img-up" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Foto do Produto</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do Produto</label>
                  <input required className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Coca Cola 350ml" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Código de Barras</label>
                  <input className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800" value={formData.barcode || ''} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="789..." />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoria</label>
                  <input className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Bebidas" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço Custo</label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400 font-bold">R$</span>
                    <input required type="number" step="0.01" inputMode="decimal" className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-4 focus:ring-2 focus:ring-violet-500 font-bold text-slate-800" value={formData.priceCost || ''} onChange={e => setFormData({ ...formData, priceCost: parseFloat(e.target.value) })} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço Venda</label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400 font-bold">R$</span>
                    <input required type="number" step="0.01" inputMode="decimal" className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-4 focus:ring-2 focus:ring-violet-500 font-bold text-slate-800" value={formData.priceSell || ''} onChange={e => setFormData({ ...formData, priceSell: parseFloat(e.target.value) })} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estoque</label>
                  <input required type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800" value={formData.stock !== undefined ? formData.stock : ''} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mínimo</label>
                  <input required type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-violet-500 font-medium text-slate-800" value={formData.minStock !== undefined ? formData.minStock : ''} onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="flex gap-4 pt-4 mt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-600 hover:bg-slate-50 rounded-2xl font-bold transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-4 bg-violet-600 text-white hover:bg-violet-700 rounded-2xl font-bold shadow-lg shadow-violet-200 transition-transform active:scale-95">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};