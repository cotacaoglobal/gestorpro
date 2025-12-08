// This file provides a compatibility layer for components that haven't been updated yet
// It wraps SupabaseService methods to work with the old synchronous API

import { SupabaseService } from './supabaseService';
import { Product, Sale, User, CashSession, CashMovement } from '../types';

// Note: This is a temporary compatibility layer
// Components should be updated to use SupabaseService directly with async/await

export const StorageService = {
  // Products
  getProducts: (): Product[] => {
    console.warn('Using deprecated sync StorageService.getProducts');
    return [];
  },
  saveProducts: (products: Product[]) => {
    console.warn('Using deprecated sync StorageService.saveProducts');
  },

  // Sales
  getSales: (): Sale[] => {
    console.warn('Using deprecated sync StorageService.getSales');
    return [];
  },
  saveSales: (sales: Sale[]) => {
    console.warn('Using deprecated sync StorageService.saveSales');
  },
  processSale: (sale: Sale): boolean => {
    console.warn('Using deprecated sync StorageService.processSale');
    return false;
  },

  // Users
  getUsers: (): User[] => {
    console.warn('Using deprecated sync StorageService.getUsers');
    return [];
  },
  saveUsers: (users: User[]) => {
    console.warn('Using deprecated sync StorageService.saveUsers');
  },
  updateUser: (user: User): User => {
    console.warn('Using deprecated sync StorageService.updateUser');
    return user;
  },
  login: (email: string, password: string): User | null => {
    console.warn('Using deprecated sync StorageService.login');
    return null;
  },

  // Cash Sessions
  getSessions: (): CashSession[] => {
    console.warn('Using deprecated sync StorageService.getSessions');
    return [];
  },
  getActiveSession: (userId: string): CashSession | undefined => {
    console.warn('Using deprecated sync StorageService.getActiveSession');
    return undefined;
  },
  openSession: (userId: string, initialFund: number): CashSession => {
    console.warn('Using deprecated sync StorageService.openSession');
    throw new Error('Not implemented');
  },
  closeSession: (sessionId: string, reportedTotals?: any) => {
    console.warn('Using deprecated sync StorageService.closeSession');
  },
  updateSessionTotals: (sessionId: string, totals: any) => {
    console.warn('Using deprecated sync StorageService.updateSessionTotals');
  },

  // Cash Movements
  getMovements: (sessionId: string): CashMovement[] => {
    console.warn('Using deprecated sync StorageService.getMovements');
    return [];
  },
  addCashMovement: (movement: CashMovement) => {
    console.warn('Using deprecated sync StorageService.addCashMovement');
  },
};