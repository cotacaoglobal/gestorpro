import { Sale } from '../types';

export interface DuplicateGroup {
    originalSale: Sale;
    duplicates: Sale[];
    criteria: {
        sameCustomer: boolean;
        sameTotal: boolean;
        sameItems: boolean;
        closeTime: boolean;
    };
    confidence: 'high' | 'medium' | 'low';
}

export interface DuplicateDetectionResult {
    totalSales: number;
    duplicateGroups: DuplicateGroup[];
    totalDuplicates: number;
    estimatedLoss: number;
}

export const DuplicateDetectionService = {
    /**
     * Detecta vendas duplicadas com base em múltiplos critérios
     */
    detectDuplicates: (sales: Sale[]): DuplicateDetectionResult => {
        const duplicateGroups: DuplicateGroup[] = [];
        const processedIds = new Set<string>();
        let totalDuplicates = 0;
        let estimatedLoss = 0;

        // Ordena vendas por data
        const sortedSales = [...sales].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        sortedSales.forEach((sale, index) => {
            // Pula se já foi processado como duplicata
            if (processedIds.has(sale.id)) return;

            const potentialDuplicates: Sale[] = [];
            const criteria = {
                sameCustomer: false,
                sameTotal: false,
                sameItems: false,
                closeTime: false,
            };

            // Compara com vendas subsequentes
            for (let i = index + 1; i < sortedSales.length; i++) {
                const otherSale = sortedSales[i];

                // Pula se já foi processado
                if (processedIds.has(otherSale.id)) continue;

                // Verifica se as vendas estão próximas no tempo (dentro de 5 minutos)
                const timeDiff = Math.abs(
                    new Date(sale.date).getTime() - new Date(otherSale.date).getTime()
                );
                const fiveMinutes = 5 * 60 * 1000;

                if (timeDiff > fiveMinutes) break; // Para de verificar se passou muito tempo

                // ⚠️ CRITÉRIO OBRIGATÓRIO #1: MESMO CLIENTE
                const sameCustomer = sale.customerName.toLowerCase().trim() ===
                    otherSale.customerName.toLowerCase().trim();

                // Se não for o mesmo cliente, PULA
                if (!sameCustomer) continue;

                // ⚠️ CRITÉRIO OBRIGATÓRIO #2: MESMOS ITENS
                // Cliente pode comprar várias vezes! Só é duplicata se os ITENS forem idênticos
                const sameItems = DuplicateDetectionService.compareSaleItems(sale, otherSale);

                // Se os ITENS forem diferentes, PULA (são vendas legítimas diferentes!)
                if (!sameItems) continue;

                // Outros critérios de duplicação (só avalia se cliente E itens forem os mesmos)
                const sameTotal = Math.abs(sale.total - otherSale.total) < 0.01;
                const sameCpf = sale.customerCpf && otherSale.customerCpf ?
                    sale.customerCpf === otherSale.customerCpf : false;
                const sameSession = sale.sessionId === otherSale.sessionId;

                // Calcula score de similaridade
                // Base: 10 pontos (mesmo cliente + mesmos itens já confirmados)
                let similarityScore = 10;
                if (sameTotal) similarityScore += 5; // Muito importante
                if (sameCpf && sale.customerCpf) similarityScore += 3;
                if (sameSession) similarityScore += 2;
                if (timeDiff < 60000) similarityScore += 3; // Menos de 1 minuto = muito suspeito

                // Score mínimo de 15 para considerar duplicata
                // Isso significa: mesmo cliente + mesmos itens + pelo menos mais 5 pontos
                if (similarityScore >= 15) {
                    potentialDuplicates.push(otherSale);
                    processedIds.add(otherSale.id);

                    criteria.sameCustomer = sameCustomer; // Sempre true aqui
                    criteria.sameTotal = sameTotal;
                    criteria.sameItems = sameItems; // Sempre true aqui
                    criteria.closeTime = timeDiff < fiveMinutes;
                }
            }

            // Se encontrou duplicatas, adiciona ao grupo
            if (potentialDuplicates.length > 0) {
                const confidence = DuplicateDetectionService.calculateConfidence(criteria, potentialDuplicates.length);

                duplicateGroups.push({
                    originalSale: sale,
                    duplicates: potentialDuplicates,
                    criteria,
                    confidence,
                });

                totalDuplicates += potentialDuplicates.length;
                estimatedLoss += potentialDuplicates.reduce((sum, dup) => sum + dup.total, 0);
            }
        });

        return {
            totalSales: sales.length,
            duplicateGroups,
            totalDuplicates,
            estimatedLoss,
        };
    },

    /**
     * Compara os itens de duas vendas
     */
    compareSaleItems: (sale1: Sale, sale2: Sale): boolean => {
        if (sale1.items.length !== sale2.items.length) return false;

        // Cria um mapa de itens para comparação
        const items1Map = new Map(
            sale1.items.map(item => [`${item.id}-${item.quantity}`, item])
        );

        // Verifica se todos os itens da venda 2 existem na venda 1
        return sale2.items.every(item => {
            const key = `${item.id}-${item.quantity}`;
            return items1Map.has(key);
        });
    },

    /**
     * Calcula o nível de confiança da detecção
     */
    calculateConfidence: (
        criteria: DuplicateGroup['criteria'],
        duplicateCount: number
    ): 'high' | 'medium' | 'low' => {
        const { sameCustomer, sameTotal, sameItems, closeTime } = criteria;

        // Alta confiança: todos os critérios batem
        if (sameCustomer && sameTotal && sameItems && closeTime) {
            return 'high';
        }

        // Média confiança: a maioria dos critérios batem
        const matchCount = [sameCustomer, sameTotal, sameItems, closeTime].filter(Boolean).length;
        if (matchCount >= 3) {
            return 'medium';
        }

        return 'low';
    },

    /**
     * Formata relatório de duplicatas
     */
    formatDuplicateReport: (result: DuplicateDetectionResult): string => {
        let report = `=== RELATÓRIO DE DETECÇÃO DE DUPLICATAS ===\n\n`;
        report += `Total de vendas analisadas: ${result.totalSales}\n`;
        report += `Grupos de duplicatas encontrados: ${result.duplicateGroups.length}\n`;
        report += `Total de vendas duplicadas: ${result.totalDuplicates}\n`;
        report += `Valor total inflacionado: R$ ${result.estimatedLoss.toFixed(2)}\n\n`;

        if (result.duplicateGroups.length > 0) {
            report += `=== DETALHES DOS GRUPOS ===\n\n`;

            result.duplicateGroups.forEach((group, index) => {
                report += `Grupo ${index + 1} - Confiança: ${group.confidence.toUpperCase()}\n`;
                report += `  ID Original: ${group.originalSale.id}\n`;
                report += `  Cliente: ${group.originalSale.customerName}\n`;
                report += `  Valor: R$ ${group.originalSale.total.toFixed(2)}\n`;
                report += `  Data: ${new Date(group.originalSale.date).toLocaleString('pt-BR')}\n`;
                report += `  Duplicatas: ${group.duplicates.length}\n`;
                report += `  Critérios:\n`;
                report += `    - Mesmo cliente: ${group.criteria.sameCustomer ? 'Sim' : 'Não'}\n`;
                report += `    - Mesmo valor: ${group.criteria.sameTotal ? 'Sim' : 'Não'}\n`;
                report += `    - Mesmos itens: ${group.criteria.sameItems ? 'Sim' : 'Não'}\n`;
                report += `    - Horário próximo: ${group.criteria.closeTime ? 'Sim' : 'Não'}\n`;
                report += `  IDs duplicados: ${group.duplicates.map(d => d.id).join(', ')}\n\n`;
            });
        }

        return report;
    },
};
