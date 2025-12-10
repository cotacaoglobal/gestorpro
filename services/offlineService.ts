import Dexie, { Table } from 'dexie';
import { Sale } from '../types';

// Define a estrutura de venda offline
export interface OfflineSale {
    id: string;
    tempId: string;
    data: Sale;
    timestamp: number;
    synced: boolean;
    retryCount: number;
    error?: string;
}

// Classe do banco de dados IndexedDB
class OfflineDatabase extends Dexie {
    sales!: Table<OfflineSale>;

    constructor() {
        super('GestorProOfflineDB');
        this.version(1).stores({
            sales: '++id, tempId, timestamp, synced',
        });
    }
}

const db = new OfflineDatabase();

// Serviço de gerenciamento offline
export const OfflineService = {
    // Adiciona venda à fila offline
    async addPendingSale(sale: Omit<Sale, 'id'>): Promise<string> {
        const tempId = `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const offlineSale: OfflineSale = {
            id: tempId,
            tempId,
            data: { ...sale, id: tempId } as Sale,
            timestamp: Date.now(),
            synced: false,
            retryCount: 0,
        };

        await db.sales.add(offlineSale);
        return tempId;
    },

    // Obtém todas as vendas pendentes de sincronização
    async getPendingSales(): Promise<OfflineSale[]> {
        return await db.sales.where('synced').equals(false).toArray();
    },

    // Obtém todas as vendas (sincronizadas e pendentes)
    async getAllOfflineSales(): Promise<OfflineSale[]> {
        return await db.sales.toArray();
    },

    // Marca venda como sincronizada
    async markAsSynced(tempId: string, realId?: string): Promise<void> {
        const sale = await db.sales.where('tempId').equals(tempId).first();
        if (sale) {
            await db.sales.update(sale.id!, {
                synced: true,
                ...(realId && { data: { ...sale.data, id: realId } }),
            });
        }
    },

    // Incrementa contador de retry
    async incrementRetry(tempId: string, error?: string): Promise<void> {
        const sale = await db.sales.where('tempId').equals(tempId).first();
        if (sale) {
            await db.sales.update(sale.id!, {
                retryCount: sale.retryCount + 1,
                error,
            });
        }
    },

    // Remove venda da fila
    async removeSale(tempId: string): Promise<void> {
        const sale = await db.sales.where('tempId').equals(tempId).first();
        if (sale && sale.id) {
            await db.sales.delete(sale.id);
        }
    },

    // Limpa vendas sincronizadas antigas (mais de 7 dias)
    async cleanOldSyncedSales(): Promise<void> {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        await db.sales
            .where('synced')
            .equals(true)
            .and((sale) => sale.timestamp < sevenDaysAgo)
            .delete();
    },

    // Conta vendas pendentes
    async countPending(): Promise<number> {
        return await db.sales.where('synced').equals(false).count();
    },

    // Verifica se está online
    isOnline(): boolean {
        return navigator.onLine;
    },

    // Limpa todo o banco (use com cuidado!)
    async clearAll(): Promise<void> {
        await db.sales.clear();
    },
};

// Event listeners para mudanças de status online/offline
export const setupOnlineListeners = (
    onOnline: () => void,
    onOffline: () => void
) => {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
    };
};

// Hook customizado para status online/offline
export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
};

// Importar React para o hook
import React from 'react';

export default OfflineService;
