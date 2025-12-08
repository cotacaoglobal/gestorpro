import React, { useState, useRef, useEffect } from 'react';
import { Product, CartItem, PaymentMethod, Sale, SalePayment, User } from '../types';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, Check, LogOut, Store, X, User as UserIcon, AlertTriangle, ScanBarcode, Printer, ArrowRight, Calculator, Tag, Percent, DollarSign, Volume2, VolumeX, TrendingUp, Clock, Star } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { CalculatorModal, DiscountModal } from './POSModals';

interface POSProps {
  products: Product[];
  sessionId?: string;
  onSaleComplete: () => void;
  onExit?: () => void;
  user: User;
}

interface ClientData {
  name: string;
  cpf: string;
}

export const POS: React.FC<POSProps> = ({ products, sessionId, onSaleComplete, onExit, user }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [splitPayments, setSplitPayments] = useState<SalePayment[]>([]);

  // New States for Receipt Flow
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Quantity Modal State
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState('1');

  // Calculator Modal State
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrevValue, setCalcPrevValue] = useState<number | null>(null);
  const [calcOperation, setCalcOperation] = useState<string | null>(null);

  // Category Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Discount State
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('0');
  const [discountApplied, setDiscountApplied] = useState(0);

  // Sound Feedback State
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('pos-sound-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });



  // Real-time Indicators State
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Barcode Scanner Logic Refs
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  if (!sessionId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 p-8">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center max-w-lg">
          <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Caixa Fechado</h2>
          <p className="mb-8 text-slate-500">É necessário abrir uma sessão financeira antes de iniciar vendas.</p>
          {/* Allow Admin to force open if needed (logic handled in App.tsx mainly, but we can trigger re-check or exit) */}
          <button onClick={onExit} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all w-full">Voltar ao Menu</button>
        </div>
      </div>
    );
  }

  // Auto-focus search on load or when client data is set
  useEffect(() => {
    if (clientData && !checkoutModalOpen && !receiptModalOpen) {
      searchInputRef.current?.focus();
    }
  }, [clientData, checkoutModalOpen, receiptModalOpen]);

  // Load today's sales for indicators
  useEffect(() => {
    const loadTodaySales = async () => {
      try {
        if (!user?.tenantId) return;
        const sales = await SupabaseService.getSales(user.tenantId);
        const today = new Date().toDateString();
        const todayOnly = sales.filter(s => new Date(s.date).toDateString() === today);
        setTodaySales(todayOnly);
      } catch (error) {
        console.error('Error loading sales:', error);
      }
    };

    if (sessionId) {
      loadTodaySales();
      // Refresh every 30 seconds
      const interval = setInterval(loadTodaySales, 30000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  // Sound Functions
  const playSound = (type: 'beep' | 'success' | 'error') => {
    if (!soundEnabled) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'beep':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'success':
        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0.15;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
        setTimeout(() => {
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.value = 1200;
          gain2.gain.value = 0.15;
          osc2.start();
          osc2.stop(audioContext.currentTime + 0.15);
        }, 100);
        break;
      case 'error':
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
    }
  };

  // Toggle Sound
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('pos-sound-enabled', JSON.stringify(newValue));
    if (newValue) playSound('beep');
  };

  // Toggle Dark Mode


  // Calculate favorite products (most sold)
  const getFavoriteProducts = () => {
    const productSales: { [key: string]: number } = {};

    todaySales.forEach(sale => {
      sale.items.forEach(item => {
        productSales[item.id] = (productSales[item.id] || 0) + item.quantity;
      });
    });

    const sorted = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    return sorted
      .map(([id]) => products.find(p => p.id === id))
      .filter(p => p !== undefined) as Product[];
  };

  // Calculate real-time indicators
  const getTodayTotal = () => todaySales.reduce((acc, sale) => acc + sale.total, 0);
  const getAverageTicket = () => todaySales.length > 0 ? getTodayTotal() / todaySales.length : 0;

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) return;
    if (quantity > product.stock) {
      playSound('error');
      alert(`Estoque insuficiente! Disponível: ${product.stock} unidades`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          playSound('error');
          alert(`Estoque insuficiente! Disponível: ${product.stock} unidades`);
          return prev;
        }
        playSound('beep');
        return prev.map(item => item.id === product.id ? { ...item, quantity: newQty } : item);
      }
      playSound('beep');
      return [...prev, { ...product, quantity }];
    });
  };

  const openQuantityModal = (product: Product) => {
    if (product.stock <= 0) return;
    setSelectedProduct(product);
    setQuantityInput('1');
    setQuantityModalOpen(true);
  };

  const handleQuantitySubmit = () => {
    if (!selectedProduct) return;
    const qty = parseInt(quantityInput);
    if (isNaN(qty) || qty < 1) return;
    addToCart(selectedProduct, qty);
    setQuantityModalOpen(false);
    setSelectedProduct(null);
  };

  // --- Keyboard Shortcuts & Barcode Scanner ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in input/textarea
      const isTyping = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';

      // F-key shortcuts (work even when typing)
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === 'F9' && clientData && !checkoutModalOpen && !receiptModalOpen && cart.length > 0) {
        e.preventDefault();
        setDiscountModalOpen(true);
        return;
      }

      if (e.key === 'F12' && clientData && !checkoutModalOpen && !receiptModalOpen) {
        e.preventDefault();
        if (cart.length > 0) openCheckout();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (calculatorOpen) {
          setCalculatorOpen(false);
        } else if (discountModalOpen) {
          setDiscountModalOpen(false);
        } else if (quantityModalOpen) {
          setQuantityModalOpen(false);
        } else if (checkoutModalOpen) {
          setCheckoutModalOpen(false);
        } else if (receiptModalOpen) {
          handleNextClient();
        }
        return;
      }

      // Barcode scanner logic (only when not typing and client identified)
      if (checkoutModalOpen || !clientData || receiptModalOpen || isTyping) return;

      const now = Date.now();

      if (e.key === 'Enter') {
        if (barcodeBuffer.current) {
          const code = barcodeBuffer.current;
          const product = products.find(p => p.barcode === code || p.internalCode === code);

          if (product) {
            addToCart(product);
            setSearchTerm('');
          }

          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        if (now - lastKeyTime.current > 100) {
          barcodeBuffer.current = '';
        }
        barcodeBuffer.current += e.key;
        lastKeyTime.current = now;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products, checkoutModalOpen, clientData, receiptModalOpen, cart, quantityModalOpen]);

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        const product = products.find(p => p.id === id);
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.priceSell * item.quantity), 0);
  const calculateSubtotal = () => calculateTotal();
  const calculateFinalTotal = () => Math.max(0, calculateSubtotal() - discountApplied);
  const calculatePaid = () => splitPayments.reduce((acc, p) => acc + p.amount, 0);
  const calculateRemaining = () => Math.max(0, calculateFinalTotal() - calculatePaid());

  // Calculator Functions
  const handleCalcNumber = (num: string) => {
    setCalcDisplay(prev => prev === '0' ? num : prev + num);
  };

  const handleCalcOperation = (op: string) => {
    setCalcPrevValue(parseFloat(calcDisplay));
    setCalcOperation(op);
    setCalcDisplay('0');
  };

  const handleCalcEquals = () => {
    if (calcPrevValue === null || calcOperation === null) return;
    const current = parseFloat(calcDisplay);
    let result = 0;

    switch (calcOperation) {
      case '+': result = calcPrevValue + current; break;
      case '-': result = calcPrevValue - current; break;
      case '*': result = calcPrevValue * current; break;
      case '/': result = current !== 0 ? calcPrevValue / current : 0; break;
    }

    setCalcDisplay(result.toString());
    setCalcPrevValue(null);
    setCalcOperation(null);
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcPrevValue(null);
    setCalcOperation(null);
  };

  // Discount Functions
  const applyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value < 0) return;

    const subtotal = calculateSubtotal();
    let discount = 0;

    if (discountType === 'percent') {
      discount = (subtotal * value) / 100;
    } else {
      discount = Math.min(value, subtotal); // Can't discount more than total
    }

    setDiscountApplied(discount);
    setDiscountModalOpen(false);
  };

  const removeDiscount = () => {
    setDiscountApplied(0);
    setDiscountValue('0');
  };

  // Get unique categories
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products by category and search
  const getFilteredProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm) ||
        p.internalCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const addPayment = (method: PaymentMethod) => {
    const remaining = calculateRemaining();
    if (remaining <= 0.01) return;
    setSplitPayments(prev => [...prev, { method, amount: remaining }]);
  };

  const removePayment = (index: number) => {
    setSplitPayments(prev => prev.filter((_, i) => i !== index));
  };

  const updatePaymentAmount = (index: number, newAmount: number) => {
    setSplitPayments(prev => prev.map((p, i) => i === index ? { ...p, amount: newAmount } : p));
  };

  const openCheckout = () => {
    setSplitPayments([]);
    setCheckoutModalOpen(true);
  };

  const handleFinalizeSale = async () => {
    const total = calculateFinalTotal(); // Use final total with discount
    const paid = calculatePaid();
    if (Math.abs(total - paid) > 0.05) return;
    if (!clientData) return;

    const sale: Omit<Sale, 'id'> = {
      tenantId: user.tenantId,
      sessionId: sessionId,
      userId: user.id,
      customerName: clientData.name,
      customerCpf: clientData.cpf,
      date: new Date().toISOString(),
      items: cart,
      total: total, // Use final total
      payments: splitPayments
    };

    const success = await SupabaseService.processSale(sale);
    if (success) {
      playSound('success'); // Play success sound
      // Create a complete sale object for the receipt
      const completeSale: Sale = { ...sale, id: Date.now().toString() };
      setCompletedSale(completeSale);
      setCheckoutModalOpen(false);
      setReceiptModalOpen(true);
    }
  };

  const handlePrintReceipt = () => {
    if (!completedSale) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprovante - GestorPro</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; color: #000; }
              .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
              .title { font-size: 16px; font-weight: bold; }
              .info { margin-bottom: 10px; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
              .item-row td { padding: 2px 0; }
              .qty { width: 30px; }
              .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
              .price { text-align: right; }
              .totals { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
              .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
              .payment-row { display: flex; justify-content: space-between; margin-top: 2px; }
              .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">GESTOR PRO</div>
              <div>PDV & Estoque Inteligente</div>
            </div>
            <div class="info">
              Data: ${new Date(completedSale.date).toLocaleString()}<br/>
              Venda: #${completedSale.id.slice(-6)}<br/>
              Cliente: ${completedSale.customerName}<br/>
              ${completedSale.customerCpf ? `CPF: ${completedSale.customerCpf}<br/>` : ''}
              Operador: ${user.name}
            </div>
            <table class="table">
              ${completedSale.items.map(item => `
                <tr class="item-row">
                  <td class="qty">${item.quantity}x</td>
                  <td class="name">${item.name}</td>
                  <td class="price">R$ ${(item.priceSell * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>
            <div class="totals">
              <div class="total-row">
                <span>TOTAL</span>
                <span>R$ ${completedSale.total.toFixed(2)}</span>
              </div>
              <div style="margin-top: 5px;">
                ${completedSale.payments.map(p => `
                  <div class="payment-row">
                    <span>${p.method}</span>
                    <span>R$ ${p.amount.toFixed(2)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="footer">
              Obrigado pela preferência!<br/>
              Volte sempre.
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleNextClient = () => {
    setReceiptModalOpen(false);
    setCompletedSale(null);
    setCart([]);
    setSearchTerm('');
    setSplitPayments([]);
    removeDiscount(); // Reset discount for next sale
    onSaleComplete();
    setClientData(null); // This resets the main flow to the "Identify Client" modal
  };

  const filteredProducts = getFilteredProducts(); // Use filtered products

  return (
    <div className="flex flex-col h-screen bg-[#F3F5F9]">

      {/* Customer Modal - Only show if NO client data AND no other modals are active (to prevent stacking weirdness) */}
      {!clientData && !receiptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center">
            <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-100">
              <UserIcon size={36} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Identificação</h2>
            <p className="text-slate-500 mb-8">Informe o cliente para iniciar</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              if (name) setClientData({ name, cpf: formData.get('cpf') as string });
            }} className="space-y-4">
              <input required name="name" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-center font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500" placeholder="Nome do Cliente" autoFocus />
              <input name="cpf" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-center font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500" placeholder="CPF (Opcional)" />

              <div className="flex gap-4 mt-8">
                {onExit && <button type="button" onClick={onExit} className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">Voltar</button>}
                <button type="submit" className="flex-[2] bg-violet-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-violet-200 hover:bg-violet-700 transition-transform active:scale-95">Iniciar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Header */}
      <div className="px-6 py-4 flex justify-between items-center shadow-sm z-20 sticky top-0 transition-colors bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
            <Store size={24} />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight text-slate-800">Terminal de Vendas</h1>
            <div className="flex items-center gap-4 text-xs font-medium mt-1">
              <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                Op: {user.name}
              </span>
              {clientData && <span className="text-violet-600 flex items-center gap-1"><UserIcon size={12} /> {clientData.name}</span>}

              {/* Real-time Indicators */}
              <span className="px-2 py-1 rounded-lg flex items-center gap-1 bg-emerald-100 text-emerald-700">
                <TrendingUp size={12} />
                R$ {getTodayTotal().toFixed(2)}
              </span>
              <span className="px-2 py-1 rounded-lg flex items-center gap-1 bg-blue-100 text-blue-700">
                Ticket: R$ {getAverageTicket().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* History Button */}
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors bg-slate-50 hover:bg-slate-100 text-slate-600"
            title="Histórico de Vendas"
          >
            <Clock size={18} />
            <span className="hidden sm:inline">{todaySales.length}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors bg-slate-50 hover:bg-slate-100 text-slate-600"
            title={soundEnabled ? 'Desativar Sons' : 'Ativar Sons'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Calculator */}
          <button
            onClick={() => setCalculatorOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors bg-slate-50 hover:bg-slate-100 text-slate-600"
            title="Calculadora"
          >
            <Calculator size={18} />
          </button>

          {/* Exit */}
          {onExit && (
            <button onClick={onExit} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-colors bg-slate-50 hover:bg-slate-100 text-slate-600">
              <LogOut size={18} /> <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 md:p-6 gap-6">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col rounded-[2.5rem] shadow-sm overflow-hidden border bg-white border-slate-100/50">
          <div className="p-6 pb-2 space-y-3">
            {/* Favorite Products */}
            {getFavoriteProducts().length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase mb-2 flex items-center gap-2 text-slate-500">
                  <Star size={14} className="text-amber-500" />
                  Mais Vendidos Hoje
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                  {getFavoriteProducts().map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-3 rounded-xl transition-all border bg-violet-50 hover:bg-violet-100 border-violet-100"
                    >
                      <div className="aspect-square mb-2 bg-slate-100 rounded-lg overflow-hidden">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] font-bold line-clamp-1 text-slate-700">{product.name}</p>
                      <p className="text-violet-600 font-black text-xs">R$ {product.priceSell.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${selectedCategory === cat
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-5 top-4 text-slate-400" size={20} />
              <ScanBarcode className="absolute right-5 top-4 text-violet-400 animate-pulse" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar produto ou escanear..."
                className="w-full pl-14 pr-12 py-4 rounded-3xl border-none focus:ring-2 focus:ring-violet-500 font-bold placeholder:text-slate-400 transition-all bg-slate-50 text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const match = products.find(p => p.barcode === searchTerm || p.internalCode === searchTerm);
                    if (match) { addToCart(match); setSearchTerm(''); }
                  }
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {filteredProducts.map(product => {
              const stockLevel = product.stock <= product.minStock ? 'low' : product.stock <= product.minStock * 2 ? 'medium' : 'high';
              const stockColor = product.stock <= 0 ? 'bg-rose-500 text-white' :
                stockLevel === 'low' ? 'bg-amber-500 text-white' :
                  stockLevel === 'medium' ? 'bg-blue-500 text-white' :
                    'bg-emerald-500 text-white';

              return (
                <div key={product.id} className="relative group">
                  <button
                    onClick={() => addToCart(product)}
                    onContextMenu={(e) => { e.preventDefault(); openQuantityModal(product); }}
                    disabled={product.stock <= 0}
                    className={`w-full text-left p-3 rounded-[1.5rem] transition-all duration-200 border border-transparent ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50' : 'bg-white hover:bg-violet-50 hover:border-violet-100 hover:shadow-lg hover:shadow-violet-100'
                      }`}
                  >
                    <div className="relative aspect-square mb-3 bg-slate-100 rounded-2xl overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />

                      {/* Category Badge */}
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1">
                        <Tag size={10} />
                        {product.category}
                      </div>

                      {/* Stock Badge */}
                      <div className={`absolute top-2 right-2 ${stockColor} px-2 py-1 rounded-lg text-[10px] font-black shadow-sm`}>
                        {product.stock} un
                      </div>

                      {/* Low Stock Warning */}
                      {product.stock <= product.minStock && product.stock > 0 && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-lg text-[9px] font-black shadow-sm">
                          ⚠️ BAIXO
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-700 text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5em]">{product.name}</h3>
                    <p className="text-violet-600 font-black text-lg">R$ {product.priceSell.toFixed(2)}</p>
                  </button>
                  <button
                    onClick={() => openQuantityModal(product)}
                    disabled={product.stock <= 0}
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-violet-600 text-white p-2 rounded-xl shadow-lg hover:bg-violet-700 disabled:opacity-0"
                    title="Adicionar quantidade"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div className="w-full lg:w-[400px] bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden border border-slate-100">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <ShoppingCart size={20} />
              Carrinho
            </h2>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${cart.length > 0 ? 'bg-violet-100 text-violet-700 animate-pulse' : 'bg-slate-100 text-slate-400'
              }`}>
              {cart.reduce((acc, item) => acc + item.quantity, 0)} {cart.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 px-6">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart size={40} strokeWidth={1.5} />
                </div>
                <p className="font-bold text-lg mb-2">Carrinho Vazio</p>
                <p className="text-sm text-center text-slate-400">Escaneie ou clique nos produtos para começar</p>
                <div className="mt-6 flex gap-2 text-xs">
                  <span className="bg-slate-100 px-3 py-1.5 rounded-lg font-bold">F2</span>
                  <span className="text-slate-500">para buscar</span>
                </div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex gap-3 items-center group">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                    <img src={item.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                    <div className="text-xs text-slate-400 font-medium">R$ {item.priceSell.toFixed(2)} un</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="font-black text-slate-800">R$ {(item.priceSell * item.quantity).toFixed(2)}</div>
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all"><Minus size={12} /></button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all"><Plus size={12} /></button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={16} /></button>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-slate-900 text-white rounded-t-[2.5rem] shadow-inner mt-auto space-y-4">
            {/* Discount Section */}
            {discountApplied > 0 && (
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Subtotal:</span>
                  <span>R$ {calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Tag size={14} />
                    Desconto:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">- R$ {discountApplied.toFixed(2)}</span>
                    <button
                      onClick={removeDiscount}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
                      title="Remover desconto"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Discount Button */}
            {cart.length > 0 && discountApplied === 0 && (
              <button
                onClick={() => setDiscountModalOpen(true)}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Tag size={16} />
                Aplicar Desconto <span className="bg-white/20 px-2 py-0.5 rounded text-xs">F9</span>
              </button>
            )}

            {/* Total */}
            <div className="flex justify-between items-end">
              <span className="text-slate-400 font-medium text-sm">Total a Pagar</span>
              <span className="text-4xl font-black tracking-tight">R$ {calculateFinalTotal().toFixed(2)}</span>
            </div>

            {/* Finalize Button */}
            <button
              disabled={cart.length === 0}
              onClick={openCheckout}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-violet-900/20 transition-all flex items-center justify-center gap-3 active:scale-95"
              title={cart.length === 0 ? 'Adicione produtos ao carrinho' : 'Finalizar venda (F12)'}
            >
              Finalizar <span className="bg-white/20 px-2 py-0.5 rounded text-sm">F12</span>
            </button>
          </div>
        </div>

        {/* Quantity Modal */}
        {quantityModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover rounded-2xl" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 mb-1">{selectedProduct.name}</h3>
                <p className="text-slate-500 font-medium">R$ {selectedProduct.priceSell.toFixed(2)} por unidade</p>
                <p className="text-sm text-slate-400 mt-2">Estoque disponível: <span className="font-bold text-slate-600">{selectedProduct.stock} un</span></p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleQuantitySubmit(); }} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 text-center">Quantidade</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantityInput(Math.max(1, parseInt(quantityInput) - 1).toString())}
                      className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-600 transition-colors"
                    >
                      <Minus size={20} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.stock}
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      className="flex-1 text-center text-3xl font-black bg-slate-50 border-none rounded-2xl py-4 focus:ring-2 focus:ring-violet-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setQuantityInput(Math.min(selectedProduct.stock, parseInt(quantityInput) + 1).toString())}
                      className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-600 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-sm text-slate-500">Total</div>
                    <div className="text-2xl font-black text-violet-600">
                      R$ {(selectedProduct.priceSell * parseInt(quantityInput || '1')).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantityModalOpen(false)}
                    className="flex-1 py-4 text-slate-600 hover:bg-slate-50 rounded-2xl font-bold transition-colors"
                  >
                    Cancelar <span className="text-xs text-slate-400">(ESC)</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 bg-violet-600 text-white hover:bg-violet-700 rounded-2xl font-bold shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={20} />
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {checkoutModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-800">Pagamento</h3>
                  <p className="text-slate-500 font-medium">Divida o valor se necessário</p>
                </div>
                <button onClick={() => setCheckoutModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Total</div>
                    <div className="text-xl font-black text-slate-800">R$ {calculateTotal().toFixed(2)}</div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <div className="text-[10px] text-emerald-500 uppercase font-black tracking-wider mb-1">Pago</div>
                    <div className="text-xl font-black text-emerald-600">R$ {calculatePaid().toFixed(2)}</div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${calculateRemaining() > 0 ? 'bg-violet-50 border-violet-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`text-[10px] uppercase font-black tracking-wider mb-1 ${calculateRemaining() > 0 ? 'text-violet-500' : 'text-slate-400'}`}>Falta</div>
                    <div className={`text-xl font-black ${calculateRemaining() > 0 ? 'text-violet-600' : 'text-slate-400'}`}>
                      R$ {calculateRemaining().toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {splitPayments.length === 0 && (
                    <div className="text-center text-slate-400 py-8 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      Selecione uma forma de pagamento abaixo
                    </div>
                  )}
                  {splitPayments.map((payment, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm pl-5 animate-in slide-in-from-bottom-2">
                      <div className="flex-1 font-bold text-slate-700">{payment.method}</div>
                      <input
                        type="number" step="0.01"
                        className="w-32 bg-slate-50 border-none rounded-xl p-2 text-right font-black text-slate-800 focus:ring-2 focus:ring-violet-500"
                        value={payment.amount}
                        onChange={(e) => updatePaymentAmount(idx, parseFloat(e.target.value))}
                      />
                      <button onClick={() => removePayment(idx)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Adicionar Pagamento</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: PaymentMethod.PIX, label: 'PIX', icon: QrCode },
                    { id: PaymentMethod.CREDIT_CARD, label: 'Crédito', icon: CreditCard },
                    { id: PaymentMethod.DEBIT_CARD, label: 'Débito', icon: CreditCard },
                    { id: PaymentMethod.CASH, label: 'Dinheiro', icon: Banknote },
                  ].map((method) => {
                    const Icon = method.icon;
                    const remaining = calculateRemaining();
                    return (
                      <button
                        key={method.id}
                        onClick={() => addPayment(method.id)}
                        disabled={remaining <= 0.01}
                        className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all font-bold
                          ${remaining > 0.01
                            ? 'bg-white border-slate-200 text-slate-600 hover:border-violet-500 hover:text-violet-600 hover:shadow-lg hover:shadow-violet-100 hover:-translate-y-0.5'
                            : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}
                        `}
                      >
                        <Icon size={20} /> {method.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={handleFinalizeSale}
                  disabled={calculateRemaining() > 0.05}
                  className="w-full py-5 bg-violet-600 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-lg rounded-2xl shadow-xl shadow-violet-200 flex items-center justify-center gap-3 hover:bg-violet-700 transition-all active:scale-95"
                >
                  <Check size={24} strokeWidth={3} /> Confirmar Venda
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal (New) */}
        {receiptModalOpen && completedSale && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                <Check size={40} strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-800 mb-2">Venda Concluída!</h3>
              <p className="text-slate-500 mb-8">Deseja imprimir o comprovante?</p>

              <div className="space-y-4">
                <button
                  onClick={handlePrintReceipt}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
                >
                  <Printer size={20} /> Imprimir Nota Fiscal
                </button>
                <button
                  onClick={handleNextClient}
                  className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all flex items-center justify-center gap-3"
                >
                  Novo Cliente <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calculator Modal */}
        <CalculatorModal
          isOpen={calculatorOpen}
          onClose={() => setCalculatorOpen(false)}
          display={calcDisplay}
          onNumber={handleCalcNumber}
          onOperation={handleCalcOperation}
          onEquals={handleCalcEquals}
          onClear={handleCalcClear}
        />

        {/* Discount Modal */}
        <DiscountModal
          isOpen={discountModalOpen}
          onClose={() => setDiscountModalOpen(false)}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          onApply={applyDiscount}
          subtotal={calculateSubtotal()}
        />

        {/* Sales History Modal */}
        {historyOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-violet-600" />
                  <h3 className="text-xl font-bold text-slate-800">Vendas de Hoje</h3>
                  <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-xl text-sm font-bold">
                    {todaySales.length} vendas
                  </span>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {todaySales.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Clock size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold">Nenhuma venda hoje</p>
                  </div>
                ) : (
                  todaySales.slice().reverse().map((sale, index) => (
                    <div
                      key={sale.id}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-800">{sale.customerName || 'Cliente'}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-violet-600">R$ {sale.total.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap mt-2">
                        {sale.payments.map((payment, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-white px-2 py-1 rounded-lg font-bold text-slate-600"
                          >
                            {payment.method === 'CREDIT' ? '💳 Crédito' :
                              payment.method === 'DEBIT' ? '💳 Débito' :
                                payment.method === 'PIX' ? '📱 PIX' : '💵 Dinheiro'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Total do Dia:</span>
                  <span className="text-3xl font-black text-emerald-600">R$ {getTodayTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};