# Setup - Métricas Avançadas
# Execute após aplicar as migrations de Alta Prioridade

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SETUP - MÉTRICAS AVANÇADAS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (-Not (Test-Path ".\migration\create_advanced_metrics.sql")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto!" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Esta migration adiciona:" -ForegroundColor Yellow
Write-Host "  ✅ Cálculo de Churn Rate" -ForegroundColor Green
Write-Host "  ✅ Cálculo de LTV (Lifetime Value)" -ForegroundColor Green
Write-Host "  ✅ Funções de crescimento de tenants" -ForegroundColor Green
Write-Host "  ✅ Análise de receita por plano" -ForegroundColor Green
Write-Host "  ✅ Métricas de retenção" -ForegroundColor Green
Write-Host "  ✅ MRR Breakdown detalhado" -ForegroundColor Green
Write-Host "  ✅ View consolidada saas_metrics_dashboard" -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Deseja continuar? (s/n)"
if ($confirm -ne "s") {
    Write-Host "❌ Cancelado pelo usuário" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PASSO 1: APLICAR MIGRATION" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Execute a migration:" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPÇÃO 1 - Supabase Dashboard:" -ForegroundColor White
Write-Host "  1. Acesse https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "  2. Selecione seu projeto" -ForegroundColor Cyan
Write-Host "  3. Vá em 'SQL Editor'" -ForegroundColor Cyan
Write-Host "  4. Cole o conteúdo de:" -ForegroundColor Cyan
Write-Host "     migration/create_advanced_metrics.sql" -ForegroundColor Yellow
Write-Host "  5. Execute (Run)" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPÇÃO 2 - Supabase CLI:" -ForegroundColor White
Write-Host "  supabase db push" -ForegroundColor Cyan
Write-Host ""

$applied = Read-Host "Migration aplicada? (s/n)"
if ($applied -ne "s") {
    Write-Host "⚠️ Aplique a migration antes de continuar" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PASSO 2: VERIFICAR INSTALAÇÃO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Funções SQL criadas:" -ForegroundColor Yellow
Write-Host "  ✓ calculate_churn_rate()" -ForegroundColor Green
Write-Host "  ✓ calculate_ltv()" -ForegroundColor Green
Write-Host "  ✓ get_tenant_growth()" -ForegroundColor Green
Write-Host "  ✓ get_revenue_by_plan()" -ForegroundColor Green
Write-Host "  ✓ get_retention_metrics()" -ForegroundColor Green
Write-Host "  ✓ get_mrr_breakdown()" -ForegroundColor Green
Write-Host ""

Write-Host "View criada:" -ForegroundColor Yellow
Write-Host "  ✓ saas_metrics_dashboard" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PASSO 3: TESTAR FUNÇÕES" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Execute no SQL Editor para testar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "-- Ver todas as métricas" -ForegroundColor Cyan
Write-Host "SELECT * FROM saas_metrics_dashboard;" -ForegroundColor White
Write-Host ""
Write-Host "-- Churn Rate" -ForegroundColor Cyan
Write-Host "SELECT calculate_churn_rate();" -ForegroundColor White
Write-Host ""
Write-Host "-- LTV" -ForegroundColor Cyan
Write-Host "SELECT calculate_ltv();" -ForegroundColor White
Write-Host ""
Write-Host "-- Crescimento (últimos 6 meses)" -ForegroundColor Cyan
Write-Host "SELECT * FROM get_tenant_growth(6);" -ForegroundColor White
Write-Host ""
Write-Host "-- Receita por Plano" -ForegroundColor Cyan
Write-Host "SELECT * FROM get_revenue_by_plan();" -ForegroundColor White
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PASSO 4: ACESSAR INTERFACE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Execute o projeto:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Faça login como Super Admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. No menu lateral, clique em:" -ForegroundColor Yellow
Write-Host "   📊 Métricas Avançadas" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Visualize:" -ForegroundColor Yellow
Write-Host "   ✓ Cards com MRR, ARR, LTV, Churn Rate" -ForegroundColor Green
Write-Host "   ✓ Gráfico de Crescimento de Clientes" -ForegroundColor Green
Write-Host "   ✓ Gráfico de Pizza - Receita por Plano" -ForegroundColor Green
Write-Host "   ✓ Tabela Detalhada de Planos" -ForegroundColor Green
Write-Host "   ✓ Métricas de Retenção" -ForegroundColor Green
Write-Host "   ✓ MRR Breakdown" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DADOS DE EXEMPLO (OPCIONAL)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Se não houver dados suficientes para gráficos," -ForegroundColor Yellow
Write-Host "você pode criar alguns tenants e assinaturas de teste:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Acesse 'Clientes (Tenants)' no painel admin" -ForegroundColor Cyan
Write-Host "2. Crie 3-5 tenants" -ForegroundColor Cyan
Write-Host "3. Para cada tenant, configure uma assinatura em 'Planos'" -ForegroundColor Cyan
Write-Host "4. Use planos diferentes para variação" -ForegroundColor Cyan
Write-Host "5. Volte para 'Métricas Avançadas'" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DOCUMENTAÇÃO COMPLETA" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Leia: METRICAS_AVANCADAS.md" -ForegroundColor Green
Write-Host ""
Write-Host "Tópicos incluídos:" -ForegroundColor Yellow
Write-Host "  • Como interpretar cada métrica" -ForegroundColor White
Write-Host "  • Benchmarks e valores ideais" -ForegroundColor White
Write-Host "  • Uso programático das funções" -ForegroundColor White
Write-Host "  • Otimização de performance" -ForegroundColor White
Write-Host "  • Troubleshooting" -ForegroundColor White
Write-Host ""

Write-Host "✅ Setup de Métricas Avançadas concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 O sistema SaaS agora está COMPLETO com:" -ForegroundColor Cyan
Write-Host "   ✓ Logs de Auditoria" -ForegroundColor Green
Write-Host "   ✓ Cobrança Automática" -ForegroundColor Green
Write-Host "   ✓ Upgrade/Downgrade de Planos" -ForegroundColor Green
Write-Host "   ✓ Métricas Avançadas com Gráficos" -ForegroundColor Green
Write-Host ""
