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
  X,
  Star,
  Zap,
  Shield,
  Clock,
  Smartphone,
  Cloud,
  Printer,
  Bell,
  FileText,
  PieChart,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Receipt,
  Wallet,
  Link,
  RefreshCw,
  Building2
} from 'lucide-react';

import './LandingPage.css';

// Image paths
const IMAGES = {
  hero: '/landing_dashboard.png',
  pos: '/landing_pos.png',
  inventory: '/landing_inventory.png',
};

// Testimonials data
const TESTIMONIALS = [
  {
    name: 'Maria Silva',
    role: 'Proprietária - Padaria Doce Sabor',
    avatar: '👩‍🍳',
    rating: 5,
    text: 'O Gestor Pro transformou minha padaria! Antes eu perdia horas contando estoque, agora tudo é automático. O PDV é super rápido e meus funcionários aprenderam em minutos.',
  },
  {
    name: 'João Oliveira',
    role: 'Gerente - Mercadinho Central',
    avatar: '👨‍💼',
    rating: 5,
    text: 'Finalmente um sistema que entende a realidade do pequeno comerciante. O preço é justo, o suporte é excelente e nunca mais tive problemas com controle de caixa.',
  },
  {
    name: 'Ana Costa',
    role: 'Dona - Loja de Roupas Elegance',
    avatar: '👩‍💻',
    rating: 5,
    text: 'Consegui controlar melhor minhas vendas e saber exatamente quais produtos mais vendem. Os relatórios são claros e me ajudam a tomar decisões melhores.',
  },
];

// All features for the badges section
const FEATURE_BADGES = [
  { icon: ShoppingCart, label: 'PDV Completo' },
  { icon: Package, label: 'Controle de Estoque' },
  { icon: Receipt, label: 'Emissor NF-e/NFC-e' },
  { icon: Wallet, label: 'Integração TEF' },
  { icon: BarChart3, label: 'Relatórios' },
  { icon: Users, label: 'Multi-usuários' },
  { icon: CreditCard, label: 'Múltiplos Pagamentos' },
  { icon: Printer, label: 'Impressão Térmica' },
  { icon: Bell, label: 'Alertas Automáticos' },
  { icon: Cloud, label: '100% na Nuvem' },
  { icon: Smartphone, label: 'Acesso Mobile' },
  { icon: Shield, label: 'Dados Seguros' },
  { icon: FileText, label: 'Histórico Completo' },
  { icon: PieChart, label: 'Dashboard Inteligente' },
];


const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      question: 'O Gestor Pro funciona offline?',
      answer: 'O sistema é baseado em nuvem para garantir que seus dados estejam sempre seguros e acessíveis de qualquer lugar. Isso significa que você precisa de conexão com a internet para usar o sistema, mas em contrapartida seus dados ficam protegidos e você pode acessar de qualquer dispositivo.',
    },
    {
      question: 'Posso cancelar minha assinatura a qualquer momento?',
      answer: 'Sim, você tem total liberdade para cancelar sua assinatura quando desejar, sem multas ou fidelidade. Seus dados permanecerão acessíveis até o fim do período já pago e você pode exportá-los a qualquer momento.',
    },
    {
      question: 'Como funciona o suporte técnico?',
      answer: 'Oferecemos suporte via chat, e-mail e WhatsApp para todos os planos pagos. Os planos Básico e Profissional têm atendimento prioritário com tempo de resposta reduzido. Também disponibilizamos uma central de ajuda com tutoriais e vídeos.',
    },
    {
      question: 'Meus dados estão seguros no Gestor Pro?',
      answer: 'Utilizamos criptografia de ponta a ponta e infraestrutura do Supabase (mesma tecnologia usada por grandes empresas) para garantir que suas informações de vendas, estoque e usuários estejam sempre protegidas. Fazemos backups automáticos diariamente.',
    },
    {
      question: 'Preciso instalar algum programa no computador?',
      answer: 'Não! O Gestor Pro funciona 100% no navegador. Basta acessar pelo Chrome, Firefox, Safari ou Edge em qualquer computador, tablet ou celular. Também oferecemos um app instalável (PWA) para acesso mais rápido.',
    },
    {
      question: 'Como funciona o período de teste?',
      answer: 'Oferecemos 7 dias de teste grátis com todas as funcionalidades liberadas. Não pedimos cartão de crédito para começar. Após o período, você escolhe o plano ideal ou continua no plano gratuito com limitações.',
    },
    {
      question: 'O sistema emite nota fiscal?',
      answer: 'Atualmente o Gestor Pro foca na gestão de vendas e estoque. A emissão de NF-e está em nosso roadmap e será lançada em breve. Enquanto isso, você pode usar os relatórios detalhados para auxiliar sua contabilidade.',
    },
    {
      question: 'Posso migrar meus dados de outro sistema?',
      answer: 'Sim! Oferecemos importação de produtos via planilha Excel. Nossa equipe de suporte pode ajudar você a migrar seus dados de forma rápida e segura. Entre em contato conosco para saber mais.',
    },
  ];

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
            <a href="#testimonials" onClick={() => setIsMenuOpen(false)}>Depoimentos</a>
            <a href="#plans" onClick={() => setIsMenuOpen(false)}>Planos</a>
            <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            <button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="lp-btn-secondary">Login</button>
            <button onClick={() => { navigate('/register'); setIsMenuOpen(false); }} className="lp-btn-primary">Começar Grátis</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <Sparkles className="w-4 h-4" />
            Sistema de Gestão Completo para PDV
          </div>
          <h1 className="lp-hero-title">
            Gerencie seu negócio de forma<br />
            <span>simples, rápida e eficiente</span>
          </h1>
          <p className="lp-hero-subtitle">
            O Gestor Pro é a solução completa para PDV, controle de estoque e gestão financeira.
            Tudo o que você precisa em um só lugar, sem complicação.
          </p>
          <div className="lp-hero-actions">
            <button onClick={() => navigate('/register')} className="lp-btn-primary lg">
              Experimente 7 Dias Grátis <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')} className="lp-btn-outline lg">Acessar Minha Conta</button>
          </div>

          <div className="lp-hero-trust">
            <div className="lp-trust-item">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="lp-trust-item">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Cancele quando quiser</span>
            </div>
            <div className="lp-trust-item">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Suporte em português</span>
            </div>
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
            <h3>+500</h3>
            <p>Empresas Ativas</p>
          </div>
          <div className="lp-stat-item">
            <h3>+50k</h3>
            <p>Vendas Processadas</p>
          </div>
          <div className="lp-stat-item">
            <h3>99.9%</h3>
            <p>Uptime Garantido</p>
          </div>
          <div className="lp-stat-item">
            <h3>4.9/5</h3>
            <p>Avaliação dos Clientes</p>
          </div>
        </div>
      </section>

      {/* Feature Badges Section */}
      <section className="lp-badges-section">
        <div className="lp-section-header">
          <h2 className="lp-section-title">
            Recursos e possibilidades <span>infinitas</span>
          </h2>
          <p className="lp-section-subtitle">
            Tudo para uma gestão inteligente, acessível e estratégica do seu negócio
          </p>
        </div>
        <div className="lp-badges-grid">
          {FEATURE_BADGES.map((badge, index) => (
            <div key={index} className="lp-badge-item">
              <badge.icon className="w-5 h-5" />
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="lp-features">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Conheça o sistema por dentro</h2>
          <p className="lp-section-subtitle">Funcionalidades pensadas para facilitar o dia a dia do seu comércio</p>
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
              <li><CheckCircle2 className="w-5 h-5 text-violet-500" /> Vendas via Código de Barras ou Busca</li>
              <li><CheckCircle2 className="w-5 h-5 text-violet-500" /> Pix, Cartão, Dinheiro</li>
              <li><CheckCircle2 className="w-5 h-5 text-violet-500" /> Carrinho visual com edição rápida</li>
              <li><CheckCircle2 className="w-5 h-5 text-violet-500" /> Impressão de cupom automática</li>
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
            <h3>Controle de Estoque Completo</h3>
            <p>
              Nunca mais perca uma venda por falta de produto. Gerencie categorias,
              receba alertas de estoque baixo e saiba exatamente o valor do seu patrimônio.
            </p>
            <ul className="lp-feature-list">
              <li><CheckCircle2 className="w-5 h-5 text-blue-500" /> Cadastro ilimitado de produtos</li>
              <li><CheckCircle2 className="w-5 h-5 text-blue-500" /> Alertas de reposição automáticos</li>
              <li><CheckCircle2 className="w-5 h-5 text-blue-500" /> Relatórios de valor em estoque</li>
              <li><CheckCircle2 className="w-5 h-5 text-blue-500" /> Histórico de movimentações</li>
            </ul>
          </div>
        </div>

        <div className="lp-feature-grid">
          <div className="lp-feature-card">
            <div className="lp-card-icon green">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4>Dashboard Inteligente</h4>
            <p>Veja seu faturamento, ticket médio, lucro estimado e vendas do dia em um painel visual e intuitivo.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-card-icon orange">
              <History className="w-6 h-6" />
            </div>
            <h4>Histórico de Vendas</h4>
            <p>Consulte todas as vendas realizadas com detalhes de itens, valores, operador e forma de pagamento.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-card-icon red">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4>Gestão de Caixa</h4>
            <p>Controle abertura, fechamento, sangrias e suprimentos. Tenha relatórios de cada turno automaticamente.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-card-icon violet">
              <Users className="w-6 h-6" />
            </div>
            <h4>Múltiplos Usuários</h4>
            <p>Crie operadores com permissões limitadas e administradores com acesso total. Cada um com seu login.</p>
          </div>
        </div>
      </section>

      {/* Premium Modules Section - NFe and TEF */}
      <section className="lp-premium-modules">
        <div className="lp-section-header">
          <div className="lp-premium-badge">
            <Sparkles className="w-4 h-4" /> Módulos Avançados
          </div>
          <h2 className="lp-section-title">
            Funcionalidades que <span>impulsionam</span> seu negócio
          </h2>
          <p className="lp-section-subtitle">
            Recursos profissionais para quem quer crescer com segurança e eficiência
          </p>
        </div>

        <div className="lp-premium-grid">
          {/* NF-e Module */}
          <div className="lp-premium-card nfe">
            <div className="lp-premium-card-header">
              <div className="lp-premium-icon nfe">
                <Receipt className="w-10 h-10" />
              </div>
              <div className="lp-premium-tag">Integrado</div>
            </div>
            <h3>Emissor de Nota Fiscal</h3>
            <p className="lp-premium-description">
              Emita NF-e, NFC-e, NFS-e, NFP-e e MDF-e de forma ilimitada, rápida e automática,
              seguindo os novos códigos e regras da Reforma Tributária.
            </p>
            <ul className="lp-premium-features">
              <li>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span><strong>Emissão ilimitada</strong> - Sem restrições de NF-e, NFC-e, NFS-e e MDF-e</span>
              </li>
              <li>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span><strong>Preenchimento automático</strong> - Menos erros e mais economia de tempo</span>
              </li>
              <li>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span><strong>Interface intuitiva</strong> - Fácil de usar, mesmo sem experiência</span>
              </li>
              <li>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span><strong>Eficiência e agilidade</strong> - Notas emitidas com rapidez e precisão</span>
              </li>
              <li>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span><strong>Foco no crescimento</strong> - Menos burocracia, mais tempo para você</span>
              </li>
            </ul>
            <div className="lp-premium-types">
              <span>NF-e</span>
              <span>NFC-e</span>
              <span>NFS-e</span>
              <span>NFP-e</span>
              <span>MDF-e</span>
            </div>
          </div>

          {/* TEF Module */}
          <div className="lp-premium-card tef">
            <div className="lp-premium-card-header">
              <div className="lp-premium-icon tef">
                <Wallet className="w-10 h-10" />
              </div>
              <div className="lp-premium-tag">Automatizado</div>
            </div>
            <h3>Integração TEF</h3>
            <p className="lp-premium-description">
              Conexão automatizada entre seu PDV e as maquininhas de cartão, Pix e carteiras digitais.
              Elimine a digitação manual e ganhe mais segurança.
            </p>
            <ul className="lp-premium-features">
              <li>
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <span><strong>Sem digitação manual</strong> - Valores enviados automaticamente</span>
              </li>
              <li>
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <span><strong>Registro automático</strong> - Venda registrada e baixada no estoque</span>
              </li>
              <li>
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <span><strong>NF-e no ato</strong> - Emissão da nota fiscal imediata</span>
              </li>
              <li>
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <span><strong>Conciliação financeira</strong> - Controle total das transações</span>
              </li>
              <li>
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <span><strong>Múltiplas bandeiras</strong> - Visa, Master, Elo, Pix e mais</span>
              </li>
            </ul>
            <div className="lp-premium-integrations">
              <span className="lp-integration-item">
                <CreditCard className="w-4 h-4" /> Cartões
              </span>
              <span className="lp-integration-item">
                <Smartphone className="w-4 h-4" /> Pix
              </span>
              <span className="lp-integration-item">
                <Wallet className="w-4 h-4" /> Wallets
              </span>
            </div>
          </div>
        </div>

        <div className="lp-premium-cta">
          <p>Quer saber mais sobre os módulos avançados?</p>
          <button onClick={() => navigate('/register')} className="lp-btn-primary lg">
            Falar com um Consultor <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="lp-why-choose">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Por que escolher o Gestor Pro?</h2>
          <p className="lp-section-subtitle">Vantagens que fazem a diferença no seu dia a dia</p>

        </div>
        <div className="lp-why-grid">
          <div className="lp-why-item">
            <div className="lp-why-icon">
              <Zap className="w-8 h-8" />
            </div>
            <h4>Rápido de Começar</h4>
            <p>Cadastre-se e comece a vender em menos de 5 minutos. Sem instalação, sem burocracia.</p>
          </div>
          <div className="lp-why-item">
            <div className="lp-why-icon">
              <Smartphone className="w-8 h-8" />
            </div>
            <h4>Acesse de Qualquer Lugar</h4>
            <p>Funciona no computador, tablet ou celular. Acompanhe seu negócio de onde estiver.</p>
          </div>
          <div className="lp-why-item">
            <div className="lp-why-icon">
              <Shield className="w-8 h-8" />
            </div>
            <h4>Dados 100% Seguros</h4>
            <p>Criptografia de ponta e backups automáticos. Seus dados protegidos 24 horas por dia.</p>
          </div>
          <div className="lp-why-item">
            <div className="lp-why-icon">
              <Clock className="w-8 h-8" />
            </div>
            <h4>Suporte Humanizado</h4>
            <p>Equipe brasileira pronta para ajudar. Atendimento rápido via WhatsApp, chat ou e-mail.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="lp-testimonials">
        <div className="lp-section-header">
          <h2 className="lp-section-title">
            Quem usa, <span>recomenda</span>
          </h2>
          <p className="lp-section-subtitle">Veja o que nossos clientes dizem sobre o Gestor Pro</p>
        </div>
        <div className="lp-testimonials-grid">
          {TESTIMONIALS.map((testimonial, index) => (
            <div key={index} className="lp-testimonial-card">
              <div className="lp-testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="lp-testimonial-text">"{testimonial.text}"</p>
              <div className="lp-testimonial-author">
                <div className="lp-testimonial-avatar">{testimonial.avatar}</div>
                <div>
                  <h5>{testimonial.name}</h5>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="lp-plans">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Planos que <span>cabem no seu bolso</span></h2>
          <p className="lp-section-subtitle">Escolha o ideal para o tamanho do seu negócio. Sem fidelidade, cancele quando quiser!</p>
        </div>

        <div className="lp-plans-grid-5">
          {/* STARTER */}
          <div className="lp-plan-card">
            <h3>Starter</h3>
            <div className="lp-plan-price">R$ 49,90<span>/mês</span></div>
            <p className="lp-plan-desc">Para quem está começando</p>
            <div className="lp-plan-invoice-badge none">Sem NF-e</div>
            <ul className="lp-plan-features">
              <li><CheckCircle2 className="w-4 h-4" /> 1 usuário</li>
              <li><CheckCircle2 className="w-4 h-4" /> 100 produtos</li>
              <li><CheckCircle2 className="w-4 h-4" /> PDV completo</li>
              <li><CheckCircle2 className="w-4 h-4" /> Relatórios básicos</li>
              <li><CheckCircle2 className="w-4 h-4" /> Suporte por email</li>
            </ul>
            <button onClick={() => navigate('/register')} className="lp-btn-outline full">Começar</button>
          </div>

          {/* ESSENCIAL */}
          <div className="lp-plan-card">
            <h3>Essencial</h3>
            <div className="lp-plan-price">R$ 79,90<span>/mês</span></div>
            <p className="lp-plan-desc">Para pequenos negócios</p>
            <div className="lp-plan-invoice-badge basic">50 notas/mês</div>
            <ul className="lp-plan-features">
              <li><CheckCircle2 className="w-4 h-4" /> 2 usuários</li>
              <li><CheckCircle2 className="w-4 h-4" /> 500 produtos</li>
              <li><CheckCircle2 className="w-4 h-4" /> PDV completo</li>
              <li><CheckCircle2 className="w-4 h-4" /> Gestão de caixa</li>
              <li><CheckCircle2 className="w-4 h-4" /> Impressão térmica</li>
              <li><CheckCircle2 className="w-4 h-4" /> NF-e, NFC-e, NFS-e</li>
              <li className="lp-plan-overage">+R$ 0,50/nota excedente</li>
            </ul>
            <button onClick={() => navigate('/register')} className="lp-btn-outline full">Começar</button>
          </div>

          {/* PROFISSIONAL - MAIS POPULAR */}
          <div className="lp-plan-card popular">
            <div className="lp-plan-popular-tag">Mais Popular</div>
            <h3>Profissional</h3>
            <div className="lp-plan-price">R$ 129,90<span>/mês</span></div>
            <p className="lp-plan-desc">Para negócios em crescimento</p>
            <div className="lp-plan-invoice-badge pro">200 notas/mês</div>
            <ul className="lp-plan-features">
              <li><CheckCircle2 className="w-4 h-4" /> 5 usuários</li>
              <li><CheckCircle2 className="w-4 h-4" /> 2.000 produtos</li>
              <li><CheckCircle2 className="w-4 h-4" /> Relatórios avançados</li>
              <li><CheckCircle2 className="w-4 h-4" /> Multi-formas pagamento</li>
              <li><CheckCircle2 className="w-4 h-4" /> Suporte prioritário</li>
              <li><CheckCircle2 className="w-4 h-4" /> NF-e, NFC-e, NFS-e</li>
              <li className="lp-plan-overage">+R$ 0,40/nota excedente</li>
            </ul>
            <button onClick={() => navigate('/register')} className="lp-btn-primary full">Assinar Agora</button>
          </div>

          {/* EMPRESARIAL */}
          <div className="lp-plan-card enterprise">
            <div className="lp-plan-premium-tag">Recomendado</div>
            <h3>Empresarial</h3>
            <div className="lp-plan-price">R$ 199,90<span>/mês</span></div>
            <p className="lp-plan-desc">Para alto volume de vendas</p>
            <div className="lp-plan-invoice-badge enterprise">500 notas/mês</div>
            <ul className="lp-plan-features">
              <li><CheckCircle2 className="w-4 h-4" /> 10 usuários</li>
              <li><CheckCircle2 className="w-4 h-4" /> 10.000 produtos</li>
              <li><CheckCircle2 className="w-4 h-4" /> Relatórios personalizados</li>
              <li><CheckCircle2 className="w-4 h-4" /> API de integração</li>
              <li><CheckCircle2 className="w-4 h-4" /> Suporte 24/7</li>
              <li><CheckCircle2 className="w-4 h-4" /> Backup automático</li>
              <li><CheckCircle2 className="w-4 h-4" /> NF-e, NFC-e, NFS-e, MDF-e</li>
              <li className="lp-plan-overage">+R$ 0,30/nota excedente</li>
            </ul>
            <button onClick={() => navigate('/register')} className="lp-btn-outline full">Começar</button>
          </div>

          {/* ILIMITADO */}
          <div className="lp-plan-card unlimited">
            <div className="lp-plan-unlimited-tag">Tudo Ilimitado</div>
            <h3>Ilimitado</h3>
            <div className="lp-plan-price">R$ 299,90<span>/mês</span></div>
            <p className="lp-plan-desc">Sem limites para você crescer</p>
            <div className="lp-plan-invoice-badge unlimited">∞ notas/mês</div>
            <ul className="lp-plan-features">
              <li><CheckCircle2 className="w-4 h-4" /> Usuários ilimitados</li>
              <li><CheckCircle2 className="w-4 h-4" /> Produtos ilimitados</li>
              <li><CheckCircle2 className="w-4 h-4" /> Notas ilimitadas</li>
              <li><CheckCircle2 className="w-4 h-4" /> Gerente de conta</li>
              <li><CheckCircle2 className="w-4 h-4" /> Treinamento personalizado</li>
              <li><CheckCircle2 className="w-4 h-4" /> SLA 99.9%</li>
              <li><CheckCircle2 className="w-4 h-4" /> Integração TEF</li>
            </ul>
            <button onClick={() => navigate('/register')} className="lp-btn-primary full">Falar com Consultor</button>
          </div>
        </div>

        <p className="lp-plans-note">
          Todos os planos incluem: PDV completo, controle de estoque, gestão de caixa e 7 dias grátis para testar.
        </p>
      </section>


      {/* FAQ Section */}
      <section id="faq" className="lp-faq">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Perguntas Frequentes</h2>
          <p className="lp-section-subtitle">Tire suas dúvidas sobre o Gestor Pro</p>
        </div>

        <div className="lp-faq-container">
          {faqItems.map((item, index) => (
            <div key={index} className={`lp-faq-item ${openFaq === index ? 'open' : ''}`}>
              <button className="lp-faq-question" onClick={() => toggleFaq(index)}>
                <span>{item.question}</span>
                {openFaq === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              <div className="lp-faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp-cta">
        <div className="lp-cta-card">
          <div className="lp-cta-glow"></div>
          <h2>Pronto para simplificar sua gestão?</h2>
          <p>Junte-se a centenas de empreendedores que já transformaram seus negócios com o Gestor Pro.</p>
          <button onClick={() => navigate('/register')} className="lp-btn-primary lg white">
            Começar Agora Grátis <ChevronRight className="ml-2 w-5 h-5" />
          </button>
          <span className="lp-cta-note">Não precisa de cartão de crédito • Cancele quando quiser</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div className="lp-footer-main">
            <div className="lp-footer-brand">
              <div className="lp-logo">
                <div className="lp-logo-icon small">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="lp-logo-text small">Gestor<span>Pro</span></span>
              </div>
              <p className="lp-footer-description">
                O sistema de gestão completo para pequenos e médios comércios.
                PDV, estoque, financeiro e muito mais em um só lugar.
              </p>
              <div className="lp-footer-social">
                <a href="#" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
                <a href="#" aria-label="Facebook"><Facebook className="w-5 h-5" /></a>
                <a href="#" aria-label="LinkedIn"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>

            <div className="lp-footer-links">
              <div className="lp-footer-col">
                <h5>Produto</h5>
                <a href="#features">Funcionalidades</a>
                <a href="#plans">Planos e Preços</a>
                <a href="#testimonials">Depoimentos</a>
                <a href="#faq">Perguntas Frequentes</a>
              </div>
              <div className="lp-footer-col">
                <h5>Empresa</h5>
                <a href="#">Sobre Nós</a>
                <a href="#">Blog</a>
                <a href="#">Carreiras</a>
                <a href="#">Parceiros</a>
              </div>
              <div className="lp-footer-col">
                <h5>Legal</h5>
                <a href="#">Termos de Uso</a>
                <a href="#">Política de Privacidade</a>
                <a href="#">LGPD</a>
              </div>
              <div className="lp-footer-col">
                <h5>Contato</h5>
                <a href="mailto:suporte@gestorpro.com.br">
                  <Mail className="w-4 h-4" /> suporte@gestorpro.com.br
                </a>
                <a href="tel:+5511999999999">
                  <Phone className="w-4 h-4" /> (11) 99999-9999
                </a>
                <a href="#">
                  <MapPin className="w-4 h-4" /> São Paulo, SP - Brasil
                </a>
              </div>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <p>© 2025 Gestor Pro. Todos os direitos reservados. CNPJ: 00.000.000/0001-00</p>
            <div className="lp-footer-badges">
              <span className="lp-security-badge">
                <Shield className="w-4 h-4" /> Site Seguro
              </span>
              <span className="lp-security-badge">
                <Cloud className="w-4 h-4" /> 100% na Nuvem
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
