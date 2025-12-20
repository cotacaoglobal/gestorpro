import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ShoppingCart,
  Package,
  History,
  Users,
  CreditCard,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import './LandingPage.css';

// Image paths from the user uploads
const IMAGES = {
  hero: '/landing_dashboard.png', // Novo Dashboard
  pos: '/landing_pos.png', // Novo Terminal de Vendas
  inventory: '/landing_inventory.png', // Novo Estoque
  history: '/uploaded_image_2_1766192507437.png', // Mantido
  cash: '/uploaded_image_3_1766192507437.png', // Mantido
  users: '/uploaded_image_4_1766192507437.png', // Mantido
  plans: '/uploaded_image_0_1766192938105.png', // Mantido
  paymentModal: '/uploaded_image_4_1766192938105.png' // Mantido
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="lp-container">
      {/* Navbar */}
      <nav className="lp-navbar">
        <div className="lp-nav-content">
          <div className="lp-logo">
            <div className="lp-logo-icon">
              <Package className="text-white w-6 h-6" />
            </div>
            <span className="lp-logo-text">Gestor<span>Pro</span></span>
          </div>

          <button
            className="lp-mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>

          <div className={`lp-nav-links ${isMenuOpen ? 'open' : ''}`}>
            <a href="#features" onClick={() => setIsMenuOpen(false)}>Funcionalidades</a>
            <a href="#plans" onClick={() => setIsMenuOpen(false)}>Planos</a>
            <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            <button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="lp-btn-secondary">Login</button>
            <button onClick={() => { navigate('/register'); setIsMenuOpen(false); }} className="lp-btn-primary">Começar Agora</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-badge">A Solução Completa para seu Negócio</div>
          <h1 className="lp-hero-title">
            Domine suas Vendas e <br />
            <span>Gestão em um só lugar</span>
          </h1>
          <p className="lp-hero-subtitle">
            O Gestor Pro é o sistema definitivo para PDV, controle de estoque e gestão financeira.
            Projetado para ser simples, rápido e extremamente eficiente.
          </p>
          <div className="lp-hero-actions">
            <button onClick={() => navigate('/register')} className="lp-btn-primary lg">
              Experimente Grátis <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="lp-btn-outline lg">Ver Demonstração</button>
          </div>

          <div className="lp-hero-image-wrapper">
            <div className="lp-hero-image-shadow"></div>
            <img
              src={IMAGES.hero}
              alt="Dashboard Gestor Pro"
              className="lp-hero-image"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="lp-stats">
        <div className="lp-stats-grid">
          <div className="lp-stat-item">
            <h3>+10k</h3>
            <p>Vendas Processadas</p>
          </div>
          <div className="lp-stat-item">
            <h3>99.9%</h3>
            <p>Disponibilidade</p>
          </div>
          <div className="lp-stat-item">
            <h3>5 Estrelas</h3>
            <p>Suporte ao Cliente</p>
          </div>
          <div className="lp-stat-item">
            <h3>Seguro</h3>
            <p>Dados Criptografados</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="lp-features">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Tudo o que você precisa para crescer</h2>
          <p className="lp-section-subtitle">Funcionalidades pensadas na praticidade do dia a dia do seu comércio.</p>
        </div>

        <div className="lp-feature-highlight right">
          <div className="lp-feature-info">
            <div className="lp-feature-icon-wrapper purple">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3>PDV Caixa Ágil e Intuitivo</h3>
            <p>
              Realize vendas em segundos. Nosso checkout é otimizado para velocidade,
              suportando múltiplos métodos de pagamento e integração total com o estoque.
            </p>
            <ul className="lp-feature-list">
              <li><CheckCircle2 className="w-5 h-5 text-violet-500" /> Vendas via Código de Barras</li>
              <li><CheckCircle2 className="w-5 h-5 text-violet-500" /> Diversas formas de pagamento (Pix, Cartão, Dinheiro)</li>
              <li><CheckCircle2 className="w-5 h-5 text-violet-500" /> Histórico em tempo real</li>
            </ul>
          </div>
          <div className="lp-feature-image-wrapper">
            <img src={IMAGES.pos} alt="PDV Caixa" className="lp-feature-image" />
          </div>
        </div>

        <div className="lp-feature-highlight left">
          <div className="lp-feature-image-wrapper">
            <img src={IMAGES.inventory} alt="Controle de Estoque" className="lp-feature-image" />
          </div>
          <div className="lp-feature-info">
            <div className="lp-feature-icon-wrapper blue">
              <Package className="w-6 h-6" />
            </div>
            <h3>Controle de Estoque Inteligente</h3>
            <p>
              Nunca mais perca uma venda por falta de produto. Receba alertas de estoque baixo
              e gerencie categorias de forma organizada.
            </p>
            <ul className="lp-feature-list">
              <li><CheckCircle2 className="w-5 h-5 text-blue-500" /> Gestão de Categorias</li>
              <li><CheckCircle2 className="w-5 h-5 text-blue-500" /> Alertas de Reposição Crítica</li>
              <li><CheckCircle2 className="w-5 h-5 text-blue-500" /> Relatórios de Valor Patrimonial</li>
            </ul>
          </div>
        </div>

        <div className="lp-feature-grid">
          <div className="lp-feature-card">
            <div className="lp-card-icon green">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4>Dashboard Completo</h4>
            <p>Visão clara do seu faturamento, ticket médio e lucros em tempo real.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-card-icon orange">
              <History className="w-6 h-6" />
            </div>
            <h4>Histórico Detalhado</h4>
            <p>Consulte cada venda realizada com detalhes de itens e pagamentos.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-card-icon red">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4>Gestão de Caixa</h4>
            <p>Controle entradas, saídas e fechamentos de turno com segurança.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-card-icon violet">
              <Users className="w-6 h-6" />
            </div>
            <h4>Controle de Acessos</h4>
            <p>Gerencie quem pode acessar cada área do sistema (Admin vs Operador).</p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="lp-plans">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Encontre o plano ideal para você</h2>
          <p className="lp-section-subtitle">Escolha a opção que melhor se adapta às necessidades do seu negócio.</p>
        </div>

        <div className="lp-plans-grid">
          <div className="lp-plan-card">
            <h3>Grátis</h3>
            <div className="lp-plan-price">R$ 0<span>/mês</span></div>
            <p>Ideal para testar e pequenos negócios começando.</p>
            <ul className="lp-plan-features">
              <li><CheckCircle2 className="w-4 h-4" /> 2 usuários</li>
              <li><CheckCircle2 className="w-4 h-4" /> 50 produtos</li>
              <li><CheckCircle2 className="w-4 h-4" /> Relatórios básicos</li>
              <li><CheckCircle2 className="w-4 h-4" /> Suporte via comunidade</li>
            </ul>
            <button onClick={() => navigate('/register')} className="lp-btn-outline full">Em breve</button>
          </div>

          <div className="lp-plan-card popular">
            <div className="lp-plan-popular-tag">Mais Popular</div>
            <h3>Básico</h3>
            <div className="lp-plan-price">R$ 69,90<span>/mês</span></div>
            <p>Perfeito para lojas em crescimento com fluxo constante.</p>
            <ul className="lp-plan-features">
              <li><CheckCircle2 className="w-4 h-4" /> 5 usuários</li>
              <li><CheckCircle2 className="w-4 h-4" /> 500 produtos</li>
              <li><CheckCircle2 className="w-4 h-4" /> 5000 vendas/mês</li>
              <li><CheckCircle2 className="w-4 h-4" /> Suporte Prioritário</li>
              <li><CheckCircle2 className="w-4 h-4" /> Auditoria e Logs</li>
            </ul>
            <button onClick={() => navigate('/register')} className="lp-btn-primary full">Assinar Agora</button>
          </div>

          <div className="lp-plan-card">
            <div className="lp-plan-premium-tag">Premium</div>
            <h3>Profissional</h3>
            <div className="lp-plan-price">R$ 99,90<span>/mês</span></div>
            <p>Para empresas que precisam de controle total e escala.</p>
            <ul className="lp-plan-features">
              <li><CheckCircle2 className="w-4 h-4" /> 15 usuários</li>
              <li><CheckCircle2 className="w-4 h-4" /> Produtos Ilimitados</li>
              <li><CheckCircle2 className="w-4 h-4" /> Vendas Ilimitadas</li>
              <li><CheckCircle2 className="w-4 h-4" /> Gestão de Multitenancy</li>
              <li><CheckCircle2 className="w-4 h-4" /> Suporte 24/7</li>
            </ul>
            <button onClick={() => navigate('/register')} className="lp-btn-outline full">Falar com Consultor</button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="lp-faq">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Dúvidas Frequentes</h2>
          <p className="lp-section-subtitle">Tudo o que você precisa saber sobre o Gestor Pro.</p>
        </div>

        <div className="lp-faq-container">
          <div className="lp-faq-item">
            <h4>O Gestor Pro funciona offline?</h4>
            <p>O sistema é baseado em nuvem para garantir que seus dados estejam sempre seguros e acessíveis de qualquer lugar, exigindo conexão com a internet para sincronização em tempo real.</p>
          </div>
          <div className="lp-faq-item">
            <h4>Posso cancelar minha assinatura a qualquer momento?</h4>
            <p>Sim, você tem total liberdade para cancelar sua assinatura quando desejar, sem multas ou fidelidade. Seus dados permanecerão acessíveis até o fim do período já pago.</p>
          </div>
          <div className="lp-faq-item">
            <h4>Como funciona o suporte técnico?</h4>
            <p>Oferecemos suporte via chat e e-mail para todos os planos pagos, com tempos de resposta prioritários para os planos Básico e Profissional.</p>
          </div>
          <div className="lp-faq-item">
            <h4>Meus dados estão seguros no Gestor Pro?</h4>
            <p>Utilizamos criptografia de ponta e infraestrutura do Supabase para garantir que suas informações de vendas, estoque e usuários estejam sempre protegidas.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp-cta">
        <div className="lp-cta-card">
          <div className="lp-cta-glow"></div>
          <h2>Pronto para elevar o nível do seu negócio?</h2>
          <p>Junte-se a centenas de lojistas que já simplificaram sua gestão com o Gestor Pro.</p>
          <button onClick={() => navigate('/register')} className="lp-btn-primary lg white">
            Começar Agora Grátis <ChevronRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <div className="lp-logo-icon small">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                </svg>
              </div>
              <span className="lp-logo-text small">Gestor<span>Pro</span></span>
            </div>
            <p>© 2025 Gestor Pro. Todos os direitos reservados.</p>
          </div>
          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <h5>Produto</h5>
              <a href="#features">Funcionalidades</a>
              <a href="#plans">Planos</a>
            </div>
            <div className="lp-footer-col">
              <h5>Legal</h5>
              <a href="#">Privacidade</a>
              <a href="#">Termos</a>
            </div>
            <div className="lp-footer-col">
              <h5>Contato</h5>
              <a href="#">Suporte</a>
              <a href="#">Sales</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
