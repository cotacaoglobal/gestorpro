# Script de Deploy Automatizado - Fase 1

## Passo 1: Verificar Supabase CLI

Write-Host "🔍 Verificando Supabase CLI..." -ForegroundColor Cyan

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "📦 Instalando Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
}

Write-Host "✅ Supabase CLI instalado" -ForegroundColor Green

## Passo 2: Login no Supabase

Write-Host "`n🔐 Fazendo login no Supabase..." -ForegroundColor Cyan
supabase login

## Passo 3: Link com o projeto

Write-Host "`n🔗 Linkando com o projeto Supabase..." -ForegroundColor Cyan
Write-Host "⚠️  Você precisará fornecer o Project Reference ID" -ForegroundColor Yellow
Write-Host "📍 Encontre em: Supabase Dashboard → Project Settings → General → Reference ID" -ForegroundColor Gray

$projectRef = Read-Host "Digite o Project Reference ID"

if ($projectRef) {
    supabase link --project-ref $projectRef
    Write-Host "✅ Projeto linkado com sucesso" -ForegroundColor Green
} else {
    Write-Host "❌ Project Reference ID não fornecido" -ForegroundColor Red
    exit 1
}

## Passo 4: Deploy da Edge Function

Write-Host "`n🚀 Fazendo deploy da Edge Function gemini-chat..." -ForegroundColor Cyan
supabase functions deploy gemini-chat

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Edge Function deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao deployar Edge Function" -ForegroundColor Red
    exit 1
}

## Passo 5: Configurar GEMINI_API_KEY

Write-Host "`n🔑 Configurando GEMINI_API_KEY..." -ForegroundColor Cyan
Write-Host "⚠️  Você precisará fornecer sua chave API do Google Gemini" -ForegroundColor Yellow
Write-Host "📍 Obtenha em: https://aistudio.google.com/apikey" -ForegroundColor Gray

$geminiKey = Read-Host "Digite sua GEMINI_API_KEY" -AsSecureString
$geminiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($geminiKey)
)

if ($geminiKeyPlain) {
    supabase secrets set GEMINI_API_KEY=$geminiKeyPlain
    Write-Host "✅ GEMINI_API_KEY configurada com sucesso" -ForegroundColor Green
} else {
    Write-Host "❌ GEMINI_API_KEY não fornecida" -ForegroundColor Red
    exit 1
}

## Passo 6: Verificar deployment

Write-Host "`n✅ Verificando deployment..." -ForegroundColor Cyan
supabase functions list

Write-Host "`n🎉 Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Executar script SQL de correção RLS no Supabase SQL Editor" -ForegroundColor White
Write-Host "  2. Executar script de teste de isolamento multi-tenant" -ForegroundColor White
Write-Host "  3. Remover VITE_GEMINI_API_KEY do .env.local e Vercel" -ForegroundColor White
Write-Host "  4. Testar aplicação em produção" -ForegroundColor White

Write-Host "`n📁 Arquivos importantes:" -ForegroundColor Cyan
Write-Host "  - supabase/fix_rls_critical.sql (executar no SQL Editor)" -ForegroundColor Gray
Write-Host "  - supabase/test_rls_isolation.sql (teste de isolamento)" -ForegroundColor Gray
Write-Host "  - DEPLOY_FASE1.md (guia completo)" -ForegroundColor Gray
