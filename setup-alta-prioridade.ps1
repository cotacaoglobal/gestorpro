# Script de Setup - Funcionalidades de Alta Prioridade
# Execute este script para aplicar todas as migrations necessárias

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SETUP - FUNCIONALIDADES ALTA PRIORIDADE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-Not (Test-Path ".\migration\create_audit_logs.sql")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto!" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Migrations a serem aplicadas:" -ForegroundColor Yellow
Write-Host "  1. create_saas_plans.sql (Planos SaaS)" -ForegroundColor White
Write-Host "  2. create_subscriptions.sql (Sistema de Assinaturas)" -ForegroundColor White
Write-Host "  3. create_payments.sql (Sistema de Pagamentos)" -ForegroundColor White
Write-Host "  4. create_audit_logs.sql (Logs de Auditoria) ⭐ NOVO" -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Deseja continuar? (s/n)"
if ($confirm -ne "s") {
    Write-Host "❌ Cancelado pelo usuário" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  INSTRUÇÕES PARA APLICAR AS MIGRATIONS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPÇÃO 1 - Via Supabase Dashboard (Recomendado):" -ForegroundColor Yellow
Write-Host "  1. Acesse https://supabase.com/dashboard" -ForegroundColor White
Write-Host "  2. Selecione seu projeto" -ForegroundColor White
Write-Host "  3. Vá em 'SQL Editor'" -ForegroundColor White
Write-Host "  4. Clique em 'New Query'" -ForegroundColor White
Write-Host "  5. Execute os arquivos SQL na ordem abaixo:" -ForegroundColor White
Write-Host ""
Write-Host "     a) migration/create_saas_plans.sql" -ForegroundColor Cyan
Write-Host "     b) migration/create_subscriptions.sql" -ForegroundColor Cyan
Write-Host "     c) migration/create_payments.sql" -ForegroundColor Cyan
Write-Host "     d) migration/create_audit_logs.sql ⭐ NOVO" -ForegroundColor Green
Write-Host ""

Write-Host "OPÇÃO 2 - Via Supabase CLI:" -ForegroundColor Yellow
Write-Host "  supabase db push" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPÇÃO 3 - Via psql (se tiver acesso direto ao banco):" -ForegroundColor Yellow
Write-Host "  psql -h [HOST] -U [USER] -d [DATABASE] -f migration/create_saas_plans.sql" -ForegroundColor Cyan
Write-Host "  psql -h [HOST] -U [USER] -d [DATABASE] -f migration/create_subscriptions.sql" -ForegroundColor Cyan
Write-Host "  psql -h [HOST] -U [USER] -d [DATABASE] -f migration/create_payments.sql" -ForegroundColor Cyan
Write-Host "  psql -h [HOST] -U [USER] -d [DATABASE] -f migration/create_audit_logs.sql" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DEPLOY DA EDGE FUNCTION" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Para habilitar a cobrança automática mensal:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Deploy da função:" -ForegroundColor White
Write-Host "   supabase functions deploy auto-renew-subscriptions" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Configurar secrets (se ainda não configurou):" -ForegroundColor White
Write-Host "   supabase secrets set MERCADO_PAGO_ACCESS_TOKEN=\"seu-token-aqui\"" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Configurar execução diária (veja FUNCIONALIDADES_ALTA_PRIORIDADE.md)" -ForegroundColor White
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  VERIFICAÇÃO PÓS-SETUP" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Após aplicar as migrations, verifique:" -ForegroundColor Yellow
Write-Host ""
Write-Host "✓ Tabelas criadas:" -ForegroundColor Green
Write-Host "  - saas_plans" -ForegroundColor White
Write-Host "  - subscriptions" -ForegroundColor White
Write-Host "  - payment_transactions" -ForegroundColor White
Write-Host "  - audit_logs ⭐" -ForegroundColor White
Write-Host ""
Write-Host "✓ Planos padrão inseridos:" -ForegroundColor Green
Write-Host "  SELECT * FROM saas_plans;" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Triggers criados:" -ForegroundColor Green
Write-Host "  - log_tenant_creation" -ForegroundColor White
Write-Host "  - subscription_changes_log" -ForegroundColor White
Write-Host "  - tenant_status_changes_log" -ForegroundColor White
Write-Host "  - payment_approved_trigger (atualizado)" -ForegroundColor White
Write-Host ""
Write-Host "✓ Função RPC criada:" -ForegroundColor Green
Write-Host "  - create_audit_log()" -ForegroundColor White
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ACESSO ÀS NOVAS FUNCIONALIDADES" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Logs de Auditoria:" -ForegroundColor Yellow
Write-Host "   - Login como Super Admin" -ForegroundColor White
Write-Host "   - Menu: 'Logs de Auditoria'" -ForegroundColor White
Write-Host ""

Write-Host "2. Upgrade/Downgrade de Planos:" -ForegroundColor Yellow
Write-Host "   - Login como Admin do tenant" -ForegroundColor White
Write-Host "   - Menu: 'Minha Assinatura'" -ForegroundColor White
Write-Host "   - Clique em 'Assinar Agora' em qualquer plano" -ForegroundColor White
Write-Host ""

Write-Host "3. Cobrança Automática:" -ForegroundColor Yellow
Write-Host "   - Configurada para executar diariamente" -ForegroundColor White
Write-Host "   - Testa manualmente:" -ForegroundColor White
Write-Host "     curl -X POST https://[PROJETO].supabase.co/functions/v1/auto-renew-subscriptions \\" -ForegroundColor Cyan
Write-Host "          -H \"Authorization: Bearer [SERVICE_ROLE_KEY]\"" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DOCUMENTAÇÃO COMPLETA" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Leia: FUNCIONALIDADES_ALTA_PRIORIDADE.md" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
