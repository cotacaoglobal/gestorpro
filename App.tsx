import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Inventory } from './components/Inventory';
import { POS } from './components/POS';
import { Dashboard } from './components/Dashboard';
import { SalesHistory } from './components/SalesHistory';
import { Login } from './components/Login';
import { OperatorHome } from './components/OperatorHome';
import { AdminUsers } from './components/AdminUsers';
import { CashManagement } from './components/CashManagement';
import { ProfileModal } from './components/ProfileModal';
import { RegisterTenant } from './components/RegisterTenant';
import { Product, Sale, ViewState, User } from './types';
import { SupabaseService } from './services/supabaseService';
import { GeminiService } from './services/geminiService';
import { XCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightLowStock, setHighlightLowStock] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Load user from localStorage on initial mount
  useEffect(() => {
    const savedUser = localStorage.getItem('gestorpro_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        const targetView = parsedUser.role === 'admin' ? 'DASHBOARD' : 'OPERATOR_HOME';
        setView(targetView);
        navigate(parsedUser.role === 'admin' ? '/dashboard' : '/operator', { replace: true });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('gestorpro_user');
      }
    }
    setLoading(false);
  }, []);

  const loadData = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      const [productsData, salesData] = await Promise.all([
        SupabaseService.getProducts(user.tenantId),
        SupabaseService.getSales(user.tenantId)
      ]);
      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]); // Dependencies updated to 'user'

  // Sync URL with view state
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/login') {
      setView('LOGIN');
    } else if (path === '/register') {
      setView('REGISTER');
    } else if (path === '/dashboard') {
      setView('DASHBOARD');
    } else if (path === '/inventory') {
      setView('INVENTORY');
    } else if (path === '/history') {
      setView('HISTORY');
    } else if (path === '/users') {
      setView('USERS');
    } else if (path === '/cash') {
      setView('CASH_MANAGEMENT');
    }

    // Force remove dark mode class
    document.body.classList.remove('dark');
  }, [location]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Save user to localStorage for session persistence
    localStorage.setItem('gestorpro_user', JSON.stringify(loggedInUser));
    const targetView = loggedInUser.role === 'admin' ? 'DASHBOARD' : 'OPERATOR_HOME';
    setView(targetView);
    navigate(loggedInUser.role === 'admin' ? '/dashboard' : '/operator');
  };

  const handleLogout = () => {
    setUser(null);
    setView('LOGIN');
    setActiveSessionId(undefined);
    // Remove user from localStorage
    localStorage.removeItem('gestorpro_user');
    navigate('/login');
  };

  const handleProductUpdate = async (product: Product, isNew: boolean = false) => {
    if (!user?.tenantId) return;

    try {
      // Ensure product has tenantId
      const productWithTenant = { ...product, tenantId: user.tenantId };

      if (isNew) {
        await SupabaseService.addProduct(productWithTenant);
      } else {
        await SupabaseService.updateProduct(productWithTenant);
      }
      // Reload to ensure consistency
      await loadData();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    }
  };

  const handleProductDelete = async (productId: string) => {
    try {
      await SupabaseService.deleteProduct(productId);
      await loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erro ao excluir produto. Tente novamente.');
    }
  };

  const handleSaleComplete = () => { loadData(); };

  const handleViewChange = (newView: ViewState) => {
    setView(newView);
    setHighlightLowStock(false);
    // Update URL based on view
    const pathMap: Record<ViewState, string> = {
      'LOGIN': '/login',
      'REGISTER': '/register',
      'DASHBOARD': '/dashboard',
      'INVENTORY': '/inventory',
      'HISTORY': '/history',
      'USERS': '/users',
      'POS': '/pos',
      'OPERATOR_HOME': '/operator',
      'CASH_MANAGEMENT': '/cash'
    };
    navigate(pathMap[newView] || '/dashboard');
  };

  const handleViewLowStock = () => {
    setView('INVENTORY');
    setHighlightLowStock(true);
    navigate('/inventory');
  };

  const handleEnterPOS = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setView('POS');
    navigate('/pos');
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await GeminiService.analyzeBusiness(products, sales);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleEditProfile = () => {
    setIsProfileModalOpen(true);
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    try {
      await SupabaseService.updateUser(updatedUser);
      setUser(updatedUser);
      // Update localStorage with new user data
      localStorage.setItem('gestorpro_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-violet-500 font-bold bg-[#F3F5F9]">Carregando sistema...</div>;

  if (view === 'REGISTER') {
    return (
      <RegisterTenant
        onBack={() => { setView('LOGIN'); navigate('/login'); }}
        onRegisterSuccess={() => {
          setView('LOGIN');
          navigate('/login');
          alert('Conta criada com sucesso! Por favor, faça login.');
        }}
      />
    );
  }

  if (!user || view === 'LOGIN') {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={() => {
          setView('REGISTER');
          navigate('/register');
        }}
      />
    );
  }

  if (view === 'POS') {
    return (
      <div className="h-full w-full bg-[#F3F5F9]">
        <POS
          products={products}
          sessionId={activeSessionId}
          onSaleComplete={handleSaleComplete}
          onExit={() => setView(user.role === 'admin' ? 'DASHBOARD' : 'OPERATOR_HOME')}
          user={user}
        />
      </div>
    );
  }

  if (user.role === 'operator' && view === 'OPERATOR_HOME') {
    return <OperatorHome user={user} onLogout={handleLogout} onEnterPOS={handleEnterPOS} sales={sales} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#F3F5F9] overflow-hidden">
      <Sidebar
        currentView={view}
        setView={handleViewChange}
        onAnalyze={handleAiAnalysis}
        isAnalyzing={isAnalyzing}
        isAdmin={user.role === 'admin'}
        onLogout={handleLogout}
        user={user}
        onEditProfile={handleEditProfile}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 relative scroll-smooth">
        {view === 'DASHBOARD' && <Dashboard sales={sales} products={products} onViewLowStock={handleViewLowStock} />}
        {view === 'INVENTORY' && <Inventory products={products} onUpdate={handleProductUpdate} onDelete={handleProductDelete} initialFilterLowStock={highlightLowStock} />}
        {view === 'HISTORY' && <SalesHistory sales={sales} user={user} />}
        {view === 'USERS' && <AdminUsers user={user} />}
        {view === 'CASH_MANAGEMENT' && <CashManagement user={user} />}
      </main>

      {/* Profile Modal */}
      {isProfileModalOpen && user && (
        <ProfileModal
          user={user}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdate={handleUpdateProfile}
        />
      )}

      {aiAnalysis && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl max-h-[80vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-violet-50">
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Sparkles className="text-violet-600" /> Análise IA
              </h3>
              <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-white rounded-full">
                <XCircle size={28} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto prose prose-slate max-w-none">
              <div className="whitespace-pre-line text-slate-700 leading-relaxed font-medium">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;