import { OfflineService } from './offlineService';
import { SupabaseService } from './supabaseService';
import { Sale } from '../types';

export interface SyncProgress {
    total: number;
    synced: number;
    failed: number;
    inProgress: boolean;
}

export class SyncService {
    private syncInProgress = false;
    private onProgressCallback?: (progress: SyncProgress) => void;

    // Define callback para progresso
    onProgress(callback: (progress: SyncProgress) => void) {
        this.onProgressCallback = callback;
    }

    // Sincroniza todas as vendas pendentes
    async syncPendingSales(): Promise<{ success: number; failed: number }> {
        if (this.syncInProgress) {
            console.log('Sincronização já em andamento...');
            return { success: 0, failed: 0 };
        }

        if (!OfflineService.isOnline()) {
            console.log('Offline - não é possível sincronizar');
            return { success: 0, failed: 0 };
        }

        this.syncInProgress = true;
        const pendingSales = await OfflineService.getPendingSales();

        if (pendingSales.length === 0) {
            this.syncInProgress = false;
            return { success: 0, failed: 0 };
        }

        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < pendingSales.length; i++) {
            const offlineSale = pendingSales[i];

            // Notifica progresso
            if (this.onProgressCallback) {
                this.onProgressCallback({
                    total: pendingSales.length,
                    synced: successCount,
                    failed: failedCount,
                    inProgress: true,
                });
            }

            try {
                // Tenta processar a venda no Supabase
                const success = await SupabaseService.processSale(offlineSale.data);

                if (success) {
                    // Marca como sincronizada
                    await OfflineService.markAsSynced(offlineSale.tempId);
                    successCount++;
                    console.log(`✅ Venda ${offlineSale.tempId} sincronizada com sucesso`);
                } else {
                    // Falha na sincronização
                    await OfflineService.incrementRetry(
                        offlineSale.tempId,
                        'Falha ao processar venda no servidor'
                    );
                    failedCount++;
                    console.error(`❌ Falha ao sincronizar venda ${offlineSale.tempId}`);
                }
            } catch (error: any) {
                // Erro na sincronização
                await OfflineService.incrementRetry(
                    offlineSale.tempId,
                    error.message || 'Erro desconhecido'
                );
                failedCount++;
                console.error(`❌ Erro ao sincronizar venda ${offlineSale.tempId}:`, error);
            }

            // Pequeno delay entre sincronizações para não sobrecarregar
            await new Promise((resolve) => setTimeout(resolve, 300));
        }

        this.syncInProgress = false;

        // Notifica conclusão
        if (this.onProgressCallback) {
            this.onProgressCallback({
                total: pendingSales.length,
                synced: successCount,
                failed: failedCount,
                inProgress: false,
            });
        }

        // Limpa vendas sincronizadas antigas
        await OfflineService.cleanOldSyncedSales();

        return { success: successCount, failed: failedCount };
    }

    // Sincronização automática quando voltar online
    async autoSync(): Promise<void> {
        if (!OfflineService.isOnline()) return;

        const pendingCount = await OfflineService.countPending();
        if (pendingCount > 0) {
            console.log(`🔄 Iniciando sincronização automática de ${pendingCount} vendas...`);
            await this.syncPendingSales();
        }
    }

    // Status da sincronização
    isInProgress(): boolean {
        return this.syncInProgress;
    }
}

// Instância singleton
export const syncService = new SyncService();

export default syncService;
