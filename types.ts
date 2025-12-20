export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  ownerName?: string; // Nome do responsável
  ownerEmail?: string; // Email do responsável
  createdAt?: string; // Data de criação
  emailNotificationsEnabled?: boolean;
}

export interface SaasPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  limits: {
    users: number;
    products: number;
    storage_mb?: number;
    [key: string]: number | undefined;
  };
  features: string[];
  active: boolean;
}

export interface SaasSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan?: SaasPlan; // Para join no frontend
}

export interface SaasInvoice {
  id: string;
  tenantId: string;
  amount: number;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoiceUrl?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  tenantId: string; // Multi-tenancy
  name: string;
  category: string;
  internalCode: string;
  barcode: string;
  priceSell: number;
  priceCost: number;
  stock: number;
  minStock: number;
  supplier: string;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
  // Sale-specific overrides if needed (e.g. discount)
}

export enum PaymentMethod {
  CASH = 'Dinheiro',
  CREDIT_CARD = 'Cartão de Crédito',
  DEBIT_CARD = 'Cartão de Débito',
  PIX = 'PIX',
}

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
}

export interface Sale {
  id: string;
  tenantId: string; // Multi-tenancy
  sessionId?: string; // Link sale to a session
  userId: string; // Link sale to the user who made it
  customerName: string; // Customer for this specific sale
  customerCpf?: string; // Customer CPF for this specific sale
  date: string; // ISO string
  items: CartItem[];
  total: number;
  payments: SalePayment[]; // Supports split payments
}

export interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  totalSales: number;
  lowStockCount: number;
}

export interface SaasStats {
  totalRevenue: number;
  totalTenants: number;
  newTenantsMonth: number;
  activeSubscriptions: number;
  churnRate?: number;
  ltv?: number;
  mrr?: number;
  arr?: number;
}

export interface TenantGrowth {
  month: string;
  new_tenants: number;
  total_tenants: number;
}

export interface RevenueByPlan {
  plan_id: string;
  plan_name: string;
  plan_price: number;
  active_subscriptions: number;
  mrr: number;
  percentage: number;
}

export interface RetentionMetrics {
  total_tenants: number;
  active_tenants: number;
  retention_rate: number;
  avg_subscription_days: number;
}

export interface MrrBreakdown {
  mrr_total: number;
  mrr_new: number;
  mrr_expansion: number;
  mrr_contraction: number;
  mrr_churn: number;
  net_mrr_growth: number;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  startedAt: string;
  trialEndsAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  autoRenew: boolean;
  // Informações do plano (quando buscado via view)
  planName?: string;
  planPrice?: number;
  planLimits?: Record<string, number>;
  planFeatures?: string[];
}

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  subscriptionId?: string;
  planId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'in_process';
  mpPreferenceId?: string;
  mpPaymentId?: string;
  mpPaymentType?: string;
  mpPaymentMethod?: string;
  description?: string;
  paymentLink?: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixExpiration?: string;
  createdAt: string;
  paidAt?: string;
  expiresAt?: string;
  // View fields
  tenantName?: string;
  planName?: string;
  planPrice?: number;
}

export type Role = 'admin' | 'operator' | 'super_admin';

export interface User {
  id: string;
  tenantId: string; // Multi-tenancy
  name: string;
  email: string;
  passwordHash: string; // Simplified for demo
  role: Role;
  avatar?: string;
}

export interface CashMovement {
  id: string;
  tenantId: string; // Multi-tenancy
  sessionId: string;
  type: 'OPENING' | 'ADD_FUND' | 'WITHDRAW' | 'CLOSING';
  amount: number;
  note?: string;
  timestamp: string;
}

export interface CashSession {
  id: string;
  tenantId: string; // Multi-tenancy
  openedByUserId: string;
  // Session is now a shift, not a single customer transaction
  customerName?: string;
  customerCpf?: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
  initialFund: number;
  reportedTotals?: {
    [key in PaymentMethod]?: number;
  };
}

export interface AuditLog {
  id: string;
  tenantId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  createdAt: string;
  // View fields (when joined)
  userName?: string;
  tenantName?: string;
}

// Stock Reports Interfaces
export interface StockFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  productId?: string;
}

export interface StockMetrics {
  totalQuantity: number;
  totalValue: number;
  totalProducts: number;
  lowStockCount: number;
  averageValue: number;
}

export interface SalesMetrics {
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
  totalSales: number;
  averageTicket: number;
  profitMargin: number;
}

export interface CategoryReport {
  categoryName: string;
  stockQuantity: number;
  stockValue: number;
  salesQuantity: number;
  salesRevenue: number;
  salesProfit: number;
  percentage: number;
}

export interface ProductReport {
  productId: string;
  productName: string;
  category: string;
  stockQuantity: number;
  costPrice: number;
  sellPrice: number;
  stockValue: number;
  salesQuantity: number;
  salesRevenue: number;
  profit: number;
  profitMargin: number;
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  profit: number;
  profitMargin: number;
}

export type ViewState = 'LANDING_PAGE' | 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD' | 'DASHBOARD' | 'INVENTORY' | 'POS' | 'HISTORY' | 'USERS' | 'OPERATOR_HOME' | 'CASH_MANAGEMENT' | 'DUPLICATE_CLEANUP' | 'STORE_SETTINGS' | 'PRINTER_SETTINGS' | 'BACKUP_DATA' | 'MANAGE_CATEGORIES' | 'NOTIFICATIONS' | 'INVOICES' | 'TEF' | 'SUBSCRIPTION'
  | 'ADMIN_DASHBOARD' | 'ADMIN_TENANTS' | 'ADMIN_PLANS' | 'ADMIN_FINANCIAL' | 'ADMIN_METRICS' | 'ADMIN_LOGS' | 'ADMIN_SETTINGS';