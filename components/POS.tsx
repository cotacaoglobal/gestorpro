import React, { useState, useRef, useEffect } from 'react';
import { Product, CartItem, PaymentMethod, Sale, SalePayment, User } from '../types';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, Check, LogOut, Store, X, User as UserIcon, AlertCircle, AlertTriangle, ScanBarcode, Printer, ArrowRight, Calculator, Tag, Percent, DollarSign, Volume2, VolumeX, TrendingUp, Clock, Star, Wifi, WifiOff, CloudOff, Package, ChevronUp, ChevronDown } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { CalculatorModal, DiscountModal } from './POSModals';
import { SaleSuccessModal } from './SaleSuccessModal';
import { PendingSalesModal } from './PendingSalesModal';
import { OfflineService, useOnlineStatus } from '../services/offlineService';
import { syncService } from '../services/syncService';

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
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

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

  // Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Offline Mode State
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingSalesModalOpen, setPendingSalesModalOpen] = useState(false);

  // Estado para prevenir múltiplas execuções de venda
  const [isProcessingSale, setIsProcessingSale] = useState(false);

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

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update pending sales count
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const count = await OfflineService.countPending();
        setPendingCount(count);
      } catch (error) {
        console.warn('Error checking pending sales:', error);
      }
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when comes back online
  useEffect(() => {
    if (isOnline) {
      // Pequeno delay para garantir conexão estável
      const timer = setTimeout(async () => {
        try {
          const pending = await OfflineService.countPending();
          if (pending > 0) {
            console.log(`🔄 Voltou online! Iniciando sincronização de ${pending} vendas...`);
            await syncService.autoSync();
            // Atualiza contador após sync
            const newCount = await OfflineService.countPending();
            setPendingCount(newCount);
          }
        } catch (error) {
          console.warn('Error during auto-sync check:', error);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

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
  }, [sessionId, user?.tenantId]);

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
    // PROTEÇÃO CONTRA MÚLTIPLAS EXECUÇÕES (Previne vendas duplicadas)
    if (isProcessingSale) {
      console.warn('⚠️ Venda já está sendo processada, aguarde...');
      return;
    }

    try {
      setIsProcessingSale(true); // Bloqueia novas tentativas

      const total = calculateFinalTotal();
      const paid = calculatePaid();

      console.log('🔍 DEBUG - Total:', total, 'Pago:', paid);

      if (Math.abs(total - paid) > 0.05) {
        console.warn('⚠️ Pagamento incompleto');
        setIsProcessingSale(false);
        return;
      }
      if (!clientData) {
        console.warn('⚠️ Sem dados do cliente');
        setIsProcessingSale(false);
        return;
      }

      console.log('✅ Iniciando processamento da venda...');

      const sale: Omit<Sale, 'id'> = {
        tenantId: user.tenantId,
        sessionId: sessionId,
        userId: user.id,
        customerName: clientData.name,
        customerCpf: clientData.cpf,
        date: new Date().toISOString(),
        items: cart,
        total: total,
        payments: splitPayments
      };

      console.log('📦 Dados da venda:', sale);

      let saleId = Date.now().toString();
      let vendaSalva = false;

      // Tenta processar venda online
      try {
        if (isOnline) {
          console.log('🌐 Tentando salvar online...');
          const success = await SupabaseService.processSale(sale);

          if (success) {
            console.log('✅ Venda salva no Supabase com sucesso!');
            vendaSalva = true;
          } else {
            console.warn('⚠️ Falha ao salvar no Supabase, tentando offline...');
          }
        } else {
          console.log('📴 Sistema detectado como offline');
        }

        // Se falhou online ou está offline, tenta salvar offline
        if (!vendaSalva) {
          try {
            console.log('💾 Salvando venda offline...');
            saleId = await OfflineService.addPendingSale(sale);
            console.log('✅ Venda salva offline! ID:', saleId);
            vendaSalva = true;
          } catch (offlineError) {
            console.error('❌ Erro ao salvar offline:', offlineError);
            // Mesmo assim continua com venda
            vendaSalva = true; // Permite continuar
          }
        }

        // Atualiza contador de pendentes (com proteção)
        try {
          const newCount = await OfflineService.countPending();
          setPendingCount(newCount);
          console.log('📊 Vendas pendentes:', newCount);
        } catch (countError) {
          console.error('⚠️ Erro ao contar pendentes:', countError);
          // Não bloqueia se falhar
        }

      } catch (saveError) {
        console.error('❌ Erro ao processar venda:', saveError);
        setIsProcessingSale(false); // Libera para nova tentativa em caso de erro
        alert('Erro ao processar venda. Por favor, tente novamente.');
        return;
      }

      // Sempre continua o fluxo se chegou até aqui
      if (vendaSalva) {
        playSound('success');

        const completeSale: Sale = { ...sale, id: saleId };
        setCompletedSale(completeSale);
        setCheckoutModalOpen(false);
        setReceiptModalOpen(true);
        setIsProcessingSale(false); // Libera após sucesso

        console.log('🎉 Venda finalizada! Modal aberto.');
      } else {
        console.error('❌ Falha crítica ao salvar venda');
        setIsProcessingSale(false);
        alert('Erro ao processar venda. Por favor, tente novamente.');
      }

    } catch (error) {
      console.error('💥 ERRO CRÍTICO inesperado:', error);
      setIsProcessingSale(false); // Libera em caso de erro crítico
      alert('Erro crítico ao processar venda: ' + (error as Error).message);
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
      <div className="px-4 md:px-6 py-3 md:py-4 flex justify-between items-center shadow-sm z-20 sticky top-0 transition-colors bg-white">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-violet-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
            <Store size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="font-extrabold text-base md:text-lg leading-tight text-slate-800">Terminal de Vendas</h1>
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-100">
                <Clock size={14} className="text-violet-600" />
                <span className="text-xs font-bold text-slate-700">
                  {currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-sm font-black text-violet-600 tabular-nums">
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 text-xs font-medium mt-0.5 md:mt-1">
              <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] md:text-xs">
                Op: {user.name}
              </span>
              {clientData && <span className="text-violet-600 flex items-center gap-1 text-[10px] md:text-xs"><UserIcon size={10} className="md:w-3 md:h-3" /> {clientData.name}</span>}

              {/* Real-time Indicators */}
              <span className="hidden sm:flex px-2 py-1 rounded-lg items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] md:text-xs">
                <TrendingUp size={10} className="md:w-3 md:h-3" />
                R$ {getTodayTotal().toFixed(2)}
              </span>
              <span className="hidden md:flex px-2 py-1 rounded-lg items-center gap-1 bg-blue-100 text-blue-700 text-xs">
                Ticket: R$ {getAverageTicket().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          {/* History Button */}
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-colors bg-slate-50 hover:bg-slate-100 text-slate-600"
            title="Histórico de Vendas"
          >
            <Clock size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">{todaySales.length}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-colors bg-slate-50 hover:bg-slate-100 text-slate-600"
            title={soundEnabled ? 'Desativar Sons' : 'Ativar Sons'}
          >
            {soundEnabled ? <Volume2 size={16} className="md:w-[18px] md:h-[18px]" /> : <VolumeX size={16} className="md:w-[18px] md:h-[18px]" />}
          </button>

          {/* Offline/Online Status Badge */}
          <button
            onClick={() => setPendingSalesModalOpen(true)}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all ${isOnline
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 animate-pulse'
              }`}
            title={isOnline ? 'Sistema Online' : `Modo Offline - ${pendingCount} vendas pendentes`}
          >
            {isOnline ? <Wifi size={16} className="md:w-[18px] md:h-[18px]" /> : <WifiOff size={16} className="md:w-[18px] md:h-[18px]" />}
            {pendingCount > 0 && (
              <span className="bg-violet-600 text-white px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-black min-w-[16px] md:min-w-[20px] text-center">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Calculator */}
          <button
            onClick={() => setCalculatorOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors bg-slate-50 hover:bg-slate-100 text-slate-600"
            title="Calculadora"
          >
            <Calculator size={18} />
          </button>

          {/* Exit */}
          {onExit && (
            <button onClick={onExit} className="flex items-center gap-1 md:gap-2 px-2 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-colors bg-slate-50 hover:bg-slate-100 text-slate-600">
              <LogOut size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2.5 gap-2.5">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col rounded-2xl shadow-sm overflow-hidden border bg-white border-slate-100/50">
          <div className="p-4 md:p-6 pb-2 space-y-2 md:space-y-3">
            {/* Favorite Products */}
            {getFavoriteProducts().length > 0 && (
              <div>
                <h3 className="text-[10px] md:text-xs font-bold uppercase mb-2 flex items-center gap-2 text-slate-500">
                  <Star size={12} className="md:w-3.5 md:h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Mais Vendidos Hoje</span>
                  <span className="sm:hidden">Vendidos</span>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 md:gap-2 mb-2 md:mb-3">
                  {getFavoriteProducts().map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-2 md:p-3 rounded-lg md:rounded-xl transition-all border bg-violet-50 hover:bg-violet-100 border-violet-100"
                    >
                      <div className="aspect-square mb-1 md:mb-2 bg-slate-100 rounded-md md:rounded-lg overflow-hidden">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[9px] md:text-[10px] font-bold line-clamp-1 text-slate-700">{product.name}</p>
                      <p className="text-violet-600 font-black text-[10px] md:text-xs">R$ {product.priceSell.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm whitespace-nowrap transition-all ${selectedCategory === cat
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
              <Search className="absolute left-3 md:left-5 top-2.5 md:top-4 text-slate-400 w-[18px] h-[18px] md:w-5 md:h-5" />
              <ScanBarcode className="absolute right-3 md:right-5 top-2.5 md:top-4 text-violet-400 animate-pulse w-[18px] h-[18px] md:w-5 md:h-5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar ou escanear..."
                className="w-full pl-10 md:pl-14 pr-10 md:pr-12 py-2.5 md:py-4 rounded-2xl md:rounded-3xl border-none focus:ring-2 focus:ring-violet-500 font-bold placeholder:text-slate-400 transition-all bg-slate-50 text-slate-700 text-sm md:text-base"
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

          <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 lg:gap-4 content-start pb-32 md:pb-6">
            {filteredProducts.map(product => {
              const stockLevel = product.stock <= product.minStock ? 'low' : product.stock <= product.minStock * 2 ? 'medium' : 'high';
              const stockColor = product.stock <= 0 ? 'bg-rose-500 text-white' :
                stockLevel === 'low' ? 'bg-amber-500 text-white' :
                  stockLevel === 'medium' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white';

              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`group relative bg-white rounded-xl md:rounded-2xl p-2 md:p-3 lg:p-4 border border-slate-100 transition-all duration-300 flex flex-col ${product.stock <= 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-violet-200 hover:shadow-xl hover:-translate-y-1 active:scale-95'
                    }`}
                >
                  {/* Product Image */}
                  <div className="aspect-square mb-2 md:mb-3 bg-slate-50 rounded-lg md:rounded-xl overflow-hidden relative">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={32} className="md:w-10 md:h-10 lg:w-12 lg:h-12" />
                      </div>
                    )}
                    {/* Stock Badge */}
                    <div className={`absolute top-1 md:top-2 right-1 md:right-2 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black ${stockColor}`}>
                      {product.stock}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-[11px] md:text-xs lg:text-sm text-slate-800 mb-1 line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-auto">{product.category}</p>
                    <div className="mt-2">
                      <p className="text-violet-600 font-black text-sm md:text-base lg:text-lg">R$ {product.priceSell.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Hover Effect */}
                  {product.stock > 0 && (
                    <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/5 rounded-xl md:rounded-2xl transition-colors pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart - Desktop: Sidebar / Mobile: Hidden until items added */}
        <div className={`
          hidden lg:flex
          w-[400px] bg-white rounded-2xl
          shadow-xl shadow-slate-200/50
          flex-col overflow-hidden border border-slate-100
        `}>
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
                    <button onClick={removeDiscount} className="text-rose-400 hover:text-rose-300 transition-colors" title="Remover desconto">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {cart.length > 0 && discountApplied === 0 && (
              <button onClick={() => setDiscountModalOpen(true)} className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                <Tag size={16} />
                Aplicar Desconto <span className="bg-white/20 px-2 py-0.5 rounded text-xs">F9</span>
              </button>
            )}

            <div className="flex justify-between items-end">
              <span className="text-slate-400 font-medium text-sm">Total a Pagar</span>
              <span className="text-4xl font-black tracking-tight">R$ {calculateFinalTotal().toFixed(2)}</span>
            </div>

            <button disabled={cart.length === 0} onClick={openCheckout} className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-violet-900/20 transition-all flex items-center justify-center gap-3 active:scale-95" title={cart.length === 0 ? 'Adicione produtos ao carrinho' : 'Finalizar venda (F12)'}>
              Finalizar <span className="bg-white/20 px-2 py-0.5 rounded text-sm">F12</span>
            </button>
          </div>
        </div>

        {/* Mobile Cart Drawer & Bottom Bar */}
        {cart.length > 0 && (
          <>
            {/* Backdrop */}
            {mobileCartOpen && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setMobileCartOpen(false)}
              />
            )}

            <div className={`
                lg:hidden fixed left-0 right-0 bg-slate-900 z-50 transition-all duration-300 ease-in-out shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]
                ${mobileCartOpen ? 'top-[15%] bottom-0 rounded-t-[2.5rem] flex flex-col' : 'bottom-0 rounded-t-3xl'}
              `}>
              {/* Drag Handle / Header */}
              <div
                className="p-4 cursor-pointer border-b border-slate-800"
                onClick={() => setMobileCartOpen(!mobileCartOpen)}
              >
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-white">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total a Pagar</div>
                    <div className="text-3xl font-black">R$ {calculateFinalTotal().toFixed(2)}</div>
                    <div className="text-sm text-slate-400 mt-1">{cart.reduce((acc, item) => acc + item.quantity, 0)} itens no carrinho</div>
                  </div>

                  {!mobileCartOpen && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openCheckout(); }}
                      className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-bold text-base shadow-lg shadow-violet-600/50 transition-all active:scale-95 flex items-center gap-2"
                    >
                      Finalizar <ArrowRight size={18} />
                    </button>
                  )}

                  <button
                    className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 transition-transform ${mobileCartOpen ? 'rotate-180' : ''}`}
                  >
                    <ChevronUp size={24} />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {mobileCartOpen && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 rounded-t-[2.5rem] mt-2 h-full">
                  <h3 className="text-slate-800 font-bold px-2 pt-2 pb-1">Itens do Pedido</h3>

                  {/* Items List - Mobile Optimized */}
                  {cart.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                        <img src={item.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-base truncate">{item.name}</h4>
                        <div className="text-sm text-slate-500 font-medium mb-2">R$ {item.priceSell.toFixed(2)} un</div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-2 bg-white rounded-md shadow-sm text-slate-600"><Minus size={14} /></button>
                            <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-2 bg-white rounded-md shadow-sm text-slate-600"><Plus size={14} /></button>
                          </div>
                          <div className="font-black text-violet-600 text-lg ml-auto">
                            R$ {(item.priceSell * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 p-2"><Trash2 size={20} /></button>
                    </div>
                  ))}

                  {/* Padding bottom for checkout button space */}
                  <div className="h-24"></div>
                </div>
              )}

              {/* Fixed Checkout Button when Open */}
              {mobileCartOpen && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 pb-8 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                  <button
                    onClick={openCheckout}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-violet-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Finalizar Venda <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold">R$ {calculateFinalTotal().toFixed(2)}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
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
      )
      }

      {/* Checkout Modal */}
      {
        checkoutModalOpen && (
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
                        type="number" step="0.01" inputMode="decimal"
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
                  disabled={calculateRemaining() > 0.05 || isProcessingSale}
                  className="w-full py-5 bg-violet-600 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-lg rounded-2xl shadow-xl shadow-violet-200 flex items-center justify-center gap-3 hover:bg-violet-700 transition-all active:scale-95"
                >
                  <Check size={24} strokeWidth={3} />
                  {isProcessingSale ? 'Processando...' : 'Confirmar Venda'}
                </button>
              </div>
            </div>
          </div>
        )
      }

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
      {
        historyOpen && (
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
                            {payment.method === PaymentMethod.CREDIT_CARD ? '💳 Crédito' :
                              payment.method === PaymentMethod.DEBIT_CARD ? '💳 Débito' :
                                payment.method === PaymentMethod.PIX ? '📱 PIX' : '💵 Dinheiro'}
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
        )
      }

      {/* Sale Success Modal */}
      {
        receiptModalOpen && completedSale && (
          <SaleSuccessModal
            sale={completedSale}
            onClose={handleNextClient}
            onNewClient={handleNextClient}
          />
        )
      }

      {/* Pending Sales Modal */}
      <PendingSalesModal
        isOnline={isOnline}
        isOpen={pendingSalesModalOpen}
        onClose={() => setPendingSalesModalOpen(false)}
      />
    </div>
  );
};