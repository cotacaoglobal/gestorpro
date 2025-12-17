# Instruções de Deploy Manual - Fase 1

## ✅ Item 5: Deploy no Vercel - CONCLUÍDO

Parabéns! O deploy no Vercel já foi realizado.

---

## 📋 Itens Restantes

### 1️⃣ Deploy da Edge Function no Supabase

**Opção A: Script Automatizado (Recomendado)**
```powershell
# Executar no PowerShell
cd "c:\Users\trave\OneDrive\Desktop\GESTOR PRO - VERSÃO 3\gestorpro"
.\deploy-edge-function.ps1
```

**Opção B: Manual**
```bash
# 1. Instalar Supabase CLI (se não tiver)
npm install -g supabase

# 2. Login
supabase login

# 3. Link com projeto
supabase link --project-ref SEU_PROJECT_REF

# 4. Deploy
supabase functions deploy gemini-chat

# 5. Configurar secret
supabase secrets set GEMINI_API_KEY=sua_chave_aqui
```

**Como obter o Project Reference ID:**
1. Abrir Supabase Dashboard
2. Ir em: Project Settings → General
3. Copiar "Reference ID"

**Como obter GEMINI_API_KEY:**
1. Acessar: https://aistudio.google.com/apikey
2. Criar ou copiar chave existente

---

### 2️⃣ Executar Script SQL de Correção RLS

**Arquivo:** `supabase/fix_rls_critical.sql`

**Passos:**
1. Abrir Supabase Dashboard
2. Ir em: SQL Editor
3. Clicar em "New Query"
4. Copiar todo o conteúdo de `fix_rls_critical.sql`
5. Colar no editor
6. Clicar em "Run"
7. Verificar mensagem de sucesso

**O que este script faz:**
- ✅ Remove políticas RLS perigosas abertas
- ✅ Habilita RLS em todas as tabelas
- ✅ Cria políticas com isolamento multi-tenant
- ✅ Garante que cada tenant vê apenas seus dados

---

### 3️⃣ Testar Isolamento Multi-Tenant

**Arquivo:** `supabase/test_rls_isolation.sql`

**Passos:**
1. No Supabase SQL Editor
2. Executar script `test_rls_isolation.sql`
3. Verificar resultados esperados:
   - ✅ Cada tenant vê apenas seus produtos
   - ✅ Tenant A NÃO pode deletar produtos do Tenant B
   - ✅ Tenant A PODE deletar seus próprios produtos

**Resultado Esperado:**
```sql
-- Teste 1: User A vê apenas produtos do Tenant A
SELECT * FROM products; -- 2 rows (apenas Tenant A)

-- Teste 2: Deletar produto de outro tenant FALHA
DELETE FROM products WHERE id = 'bbbbbbbb-0001...'; -- 0 rows affected

-- Teste 3: Deletar próprio produto FUNCIONA
DELETE FROM products WHERE id = 'aaaaaaaa-0002...'; -- 1 row affected
```

---

### 4️⃣ Remover VITE_GEMINI_API_KEY

**A. Remover do .env.local**
```bash
# Editar arquivo .env.local
# REMOVER esta linha:
VITE_GEMINI_API_KEY=...

# MANTER apenas:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**B. Remover do Vercel**
1. Abrir Vercel Dashboard
2. Ir em: Settings → Environment Variables
3. Encontrar `VITE_GEMINI_API_KEY`
4. Clicar em "..." → Delete
5. Confirmar remoção

**C. Re-deploy (se necessário)**
```bash
# Se já fez deploy, não precisa fazer nada
# O Vercel usará as novas variáveis no próximo deploy
```

---

### 6️⃣ Executar Testes Unitários

```bash
# Executar todos os testes
npm run test

# Ver interface visual
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage
```

**Resultado Esperado:**
```
✓ tests/validation.test.ts (15)
  ✓ ProductSchema (5)
  ✓ CustomerSchema (4)
  ✓ SaleSchema (4)
  ✓ UserSchema (3)

Test Files  1 passed (1)
Tests  15 passed (15)
```

---

## 🎯 Verificação Final

Após completar todos os passos, verificar:

- [ ] Edge Function aparece em: Supabase → Edge Functions
- [ ] GEMINI_API_KEY configurada em: Supabase → Edge Functions → Secrets
- [ ] Script RLS executado sem erros
- [ ] Teste de isolamento passou
- [ ] VITE_GEMINI_API_KEY removida do .env.local
- [ ] VITE_GEMINI_API_KEY removida do Vercel
- [ ] Testes unitários passando (15/15)
- [ ] Aplicação funcionando em produção

---

## 🧪 Teste na Aplicação

1. Abrir aplicação em produção
2. Fazer login
3. Ir para Dashboard
4. Clicar no assistente AI
5. Fazer uma pergunta
6. Verificar no DevTools → Network:
   - ✅ Requisição para `/functions/v1/gemini-chat`
   - ✅ Nenhuma chave API visível
   - ✅ Resposta do AI funcionando

7. Fazer 21 requisições seguidas
8. Verificar erro 429 na 21ª requisição

---

## ❌ Troubleshooting

### Erro: "supabase: command not found"
```bash
npm install -g supabase
```

### Erro: "Project not linked"
```bash
supabase link --project-ref SEU_PROJECT_REF
```

### Erro: "GEMINI_API_KEY not configured"
```bash
supabase secrets set GEMINI_API_KEY=sua_chave
```

### Edge Function não responde
1. Verificar logs: `supabase functions logs gemini-chat`
2. Verificar se secret está configurado
3. Re-deploy: `supabase functions deploy gemini-chat`

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs da Edge Function
2. Consultar `DEPLOY_FASE1.md` (guia completo)
3. Revisar `walkthrough.md` (documentação detalhada)

**Status Atual:** ✅ Deploy Vercel | ✅ Edge Function | ✅ RLS Configurado | ✅ Testes (17/17) | 🚀 FASE 1 CONCLUÍDA

