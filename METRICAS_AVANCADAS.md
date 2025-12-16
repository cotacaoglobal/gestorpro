# 📊 Métricas Avançadas - IMPLEMENTADO

## ✅ Funcionalidades Implementadas

Esta implementação adiciona **análises avançadas** e **visualizações gráficas** ao painel de Super Admin.

---

## 🎯 O que foi Implementado

### 1. ✅ Cálculo Real de Churn Rate
- **Função SQL**: `calculate_churn_rate()`
- **Período**: Últimos 30 dias (configurável)
- **Fórmula**: `(Canceladas no Período / Total no Início) × 100`
- **Exibição**: Card destacado com código de cores (verde < 5%, vermelho ≥ 5%)

### 2. ✅ LTV (Lifetime Value)
- **Função SQL**: `calculate_ltv()`
- **Cálculo**: `Receita Média × Tempo Médio de Vida`
- **Tempo de Vida**: Calculado automaticamente baseado em tenants ativos
- **Exibição**: Card individual com valor em R$

### 3. ✅ Gráficos de Crescimento
- **Gráfico de Linha**: Crescimento de clientes (novos + total)
- **Período**: Últimos 6 meses (configurável)
- **Biblioteca**: Recharts (já instalado)
- **Interatividade**: Hover para ver valores detalhados

### 4. ✅ Análise de Receita por Plano
- **Gráfico de Pizza**: Distribuição percentual por plano
- **Tabela Detalhada**: Preço, assinaturas, MRR, % do total
- **Cores distintas**: Visualização clara de cada plano
- **Barra de progresso**: Visual da contribuição percentual

### 5. ✅ Métricas de Retenção
- **Total de Clientes**
- **Clientes Ativos**
- **Taxa de Retenção** (%)
- **Tempo Médio de Assinatura** (dias)

### 6. ✅ MRR Breakdown
- **MRR Total**
- **Novo MRR** (novos clientes)
- **Expansão** (upgrades)
- **Contração** (downgrades)
- **Churn** (cancelamentos)
- **Crescimento Líquido**

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
1. ✨ `migration/create_advanced_metrics.sql` - Funções SQL e View
2. ✨ `components/admin/AdminMetrics.tsx` - Interface com gráficos

### Arquivos Modificados:
1. 📝 `types.ts` - Adicionadas interfaces para métricas
2. 📝 `services/supabaseService.ts` - Funções de busca de métricas
3. 📝 `components/admin/AdminSidebar.tsx` - Item de menu
4. 📝 `App.tsx` - Rota e renderização

---

## 🚀 Como Usar

### 1️⃣ Aplicar Migration

Execute a migration SQL no Supabase:

```bash
# Via Supabase Dashboard (SQL Editor):
```
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "SQL Editor"
4. Clique em "New Query"
5. Cole o conteúdo de `migration/create_advanced_metrics.sql`
6. Execute

**Ou via CLI:**
```bash
supabase db push
```

### 2️⃣ Acessar a Tela

1. Faça login como **Super Admin**
2. No menu lateral, clique em **"Métricas Avançadas"**
3. Visualize os gráficos e métricas

---

## 📊 Funções SQL Disponíveis

### Para uso programático via RPC:

```typescript
// Churn Rate
const churnRate = await SupabaseService.calculateChurnRate();
const churnRate30Days = await SupabaseService.calculateChurnRate(
  '2025-11-15', 
  '2025-12-15'
);

// LTV
const ltv = await SupabaseService.calculateLtv();

// Crescimento de Tenants (últimos 6 meses)
const growth = await SupabaseService.getTenantGrowth(6);

// Receita por Plano
const revenue = await SupabaseService.getRevenueByPlan();

// Métricas de Retenção
const retention = await SupabaseService.getRetentionMetrics();

// MRR Breakdown
const mrr = await SupabaseService.getMrrBreakdown();
```

### Via SQL (direto no banco):

```sql
-- Churn Rate dos últimos 30 dias
SELECT calculate_churn_rate();

-- Churn Rate de período específico
SELECT calculate_churn_rate('2025-01-01', '2025-01-31');

-- LTV
SELECT calculate_ltv();

-- Crescimento (últimos 12 meses)
SELECT * FROM get_tenant_growth(12);

-- Receita por Plano
SELECT * FROM get_revenue_by_plan();

-- Métricas de Retenção
SELECT * FROM get_retention_metrics();

-- MRR Breakdown
SELECT * FROM get_mrr_breakdown();

-- Dashboard Completo (View)
SELECT * FROM saas_metrics_dashboard;
```

---

## 📈 Interpretando as Métricas

### **Churn Rate** (Taxa de Cancelamento)
- **Ótimo**: < 3%
- **Bom**: 3-5%
- **Atenção**: 5-7%
- **Crítico**: > 7%

### **LTV** (Lifetime Value)
- Quanto maior, melhor
- Compare com CAC (Custo de Aquisição) - ideal: LTV/CAC > 3

### **Taxa de Retenção**
- **Excelente**: > 95%
- **Bom**: 85-95%
- **Precisa Melhorar**: < 85%

### **MRR Growth** (Crescimento do MRR)
- **Positivo**: Negócio crescendo
- **Estável**: Mantendo receita
- **Negativo**: Losing revenue (action needed)

---

## 🎨 Visualizações Disponíveis

### 1. Cards de Métricas Principais
- **MRR**: Receita Mensal Recorrente (roxo)
- **ARR**: Receita Anual Recorrente (azul)
- **LTV**: Lifetime Value (verde)
- **Churn Rate**: Taxa de Cancelamento (verde/vermelho dinâmico)

### 2. MRR Breakdown
- Visual colorido com 5 categorias
- Identificação rápida de fontes de crescimento/perda

### 3. Gráfico de Crescimento
- Linha dupla: Novos clientes + Total acumulado
- Eixo X: Meses
- Eixo Y: Número de clientes
- Hover: Valores exatos

### 4. Gráfico de Pizza - Receita por Plano
- Cada plano tem cor distinta
- Labels com percentual
- Tooltip com valor em R$

### 5. Tabela de Planos
- Ordenado por MRR (maior para menor)
- Barra de progresso visual
- Cores consistentes com o gráfico de pizza

### 6. Cards de Retenção
- 4 métricas em destaque
- Cores distintas por métrica
- Valores grandes e legíveis

---

## 🔧 Configurações e Personalizações

### Alterar período do Churn Rate:
```typescript
// Últimos 60 dias ao invés de 30
const startDate = new Date();
startDate.setDate(startDate.getDate() - 60);
const churnRate = await SupabaseService.calculateChurnRate(
  startDate.toISOString(),
  new Date().toISOString()
);
```

### Alterar número de meses no gráfico:
```typescript
// Últimos 12 meses ao invés de 6
const growth = await SupabaseService.getTenantGrowth(12);
```

### Cores do gráfico de pizza:
Edite em `AdminMetrics.tsx`:
```typescript
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
```

---

## ⚙️ Otimização de Performance

### View Materializada (Opcional)
Para dashboards com muitos dados, considere criar uma view materializada:

```sql
-- Criar view materializada
CREATE MATERIALIZED VIEW saas_metrics_cache AS
SELECT * FROM saas_metrics_dashboard;

-- Atualizar cache (executar periodicamente)
REFRESH MATERIALIZED VIEW saas_metrics_cache;

-- Agendar refresh com pg_cron (se disponível)
SELECT cron.schedule(
    'refresh-metrics',
    '0 * * * *', -- A cada hora
    'REFRESH MATERIALIZED VIEW saas_metrics_cache'
);
```

### Índices para Performance
Já criados na migration:
- Índice em `subscriptions.status`
- Índice em `subscriptions.started_at`
- Índice em `tenants.created_at`
- Índice em `tenants.status`

---

## 🆕 Próximas Melhorias Sugeridas

1. **Comparação Mês a Mês**
   - Delta percentual em cada métrica
   - Setas indicando tendência

2. **Exportação de Relatórios**
   - PDF com gráficos
   - Excel com dados raw
   - Agendamento de envio por email

3. **Métricas de Cohort**
   - Análise de retenção por cohort
   - Gráfico de retention curves

4. **Customer Health Score**
   - Score de saúde de cada cliente
   - Predição de churn

5. **Benchmarks**
   - Comparar com médias da indústria
   - Metas e objetivos configuráveis

---

## ❓ Troubleshooting

### Erro: "function calculate_churn_rate does not exist"
→ Execute a migration `create_advanced_metrics.sql`

### Gráficos não aparecem
→ Verifique se há dados suficientes (pelo menos 2 tenants/planos)

### Valores zerados
→ Certifique-se de que:
- Existem tenants criados
- Existem assinaturas ativas
- Planos foram configurados

### Performance lenta
→ Crie índices adicionais ou use view materializada (veja seção de Otimização)

---

## 📚 Referências

- **Recharts**: https://recharts.org/
- **PostgreSQL Functions**: https://www.postgresql.org/docs/current/sql-createfunction.html
- **SaaS Metrics**: https://www.saastr.com/saas-metrics/

---

**Desenvolvido em**: 2025-12-15  
**Versão**: 3.1 - Métricas Avançadas  
**Status**: ✅ Pronto para Produção

---

## 🎉 Resumo Final

Todas as **5 funcionalidades de Métricas Avançadas** foram implementadas com sucesso:

| Funcionalidade | Status |
|----------------|--------|
| ✅ Churn Rate | 100% |
| ✅ LTV | 100% |
| ✅ Gráficos de Crescimento | 100% |
| ✅ Receita por Plano | 100% |
| ✅ Métricas de Retenção | 100% |

**Total implementado: 100%** 🎊
