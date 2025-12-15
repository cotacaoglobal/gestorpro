export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  ownerName?: string; // Nome do responsável
  ownerEmail?: string; // Email do responsável
  createdAt?: string; // Data de criação
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

export type ViewState = 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'INVENTORY' | 'POS' | 'HISTORY' | 'USERS' | 'OPERATOR_HOME' | 'CASH_MANAGEMENT' | 'DUPLICATE_CLEANUP' | 'STORE_SETTINGS' | 'PRINTER_SETTINGS' | 'BACKUP_DATA' | 'MANAGE_CATEGORIES' | 'NOTIFICATIONS'
  | 'ADMIN_DASHBOARD' | 'ADMIN_TENANTS' | 'ADMIN_PLANS' | 'ADMIN_FINANCIAL';