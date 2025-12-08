export interface Product {
  id: string;
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

export type Role = 'admin' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Simplified for demo
  role: Role;
  avatar?: string;
}

export interface CashMovement {
  id: string;
  sessionId: string;
  type: 'OPENING' | 'ADD_FUND' | 'WITHDRAW' | 'CLOSING';
  amount: number;
  note?: string;
  timestamp: string;
}

export interface CashSession {
  id: string;
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

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'INVENTORY' | 'POS' | 'HISTORY' | 'USERS' | 'OPERATOR_HOME' | 'CASH_MANAGEMENT';