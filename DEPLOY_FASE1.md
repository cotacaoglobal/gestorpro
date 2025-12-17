# Guia de Deploy - Fase 1 Segurança Crítica

## 📋 Pré-requisitos

- [ ] Supabase CLI instalado (`npm install -g supabase`)
- [ ] Acesso ao projeto Supabase
- [ ] Chave API do Google Gemini
- [ ] Acesso ao Vercel (para atualizar variáveis de ambiente)

---

## 🚀 Passo a Passo

### 1. Deploy da Edge Function Gemini

```bash
# 1.1 Login no Supabase
supabase login

# 1.2 Link com o projeto
cd "c:\Users\trave\OneDrive\Desktop\GESTOR PRO - VERSÃO 3\gestorpro"
supabase link --project-ref SEU_PROJECT_REF

# 1.3 Deploy da função
supabase functions deploy gemini-chat

# 1.4 Configurar variável de ambiente no Supabase Dashboard
# Ir para: Project Settings → Edge Functions → Secrets
# Adicionar: GEMINI_API_KEY=sua_chave_aqui
```

### 2. Atualizar Variáveis de Ambiente

**Remover do `.env.local` e Vercel:**
```bash
# REMOVER esta linha:
VITE_GEMINI_API_KEY=...
```

**Manter apenas:**
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 3. Executar Script SQL de Correção RLS

```sql
-- Executar no Supabase SQL Editor
-- Arquivo: supabase/fix_rls_critical.sql

-- Este script:
-- ✅ Remove políticas abertas perigosas
-- ✅ Habilita RLS em todas as tabelas
-- ✅ Cria políticas com isolamento multi-tenant
```

### 4. Testar Localmente (Opcional)

```bash
# 4.1 Iniciar Supabase local
supabase start

# 4.2 Servir Edge Function localmente
supabase functions serve gemini-chat --env-file .env.local

# 4.3 Testar com curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/gemini-chat' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"prompt":"Olá, como você pode me ajudar?"}'
```

### 5. Deploy no Vercel

```bash
# 5.1 Commit das mudanças
git add .
git commit -m "feat: implementa Fase 1 de segurança crítica

- Edge Function Gemini com rate limiting (20/min)
- Schemas de validação Zod
- Correção RLS com tenant_id
- Remoção de localStorage sensível"

# 5.2 Push para GitHub
git push origin main

# 5.3 Vercel fará deploy automaticamente
```

### 6. Verificação Pós-Deploy

**Checklist de Testes:**

- [ ] **Edge Function**: Abrir DevTools → Network, fazer pergunta ao AI, verificar chamada para `/functions/v1/gemini-chat`
- [ ] **Rate Limiting**: Fazer 21 requisições seguidas, verificar erro 429 na 21ª
- [ ] **RLS**: Criar 2 tenants, tentar deletar produto de outro tenant (deve falhar)
- [ ] **Session**: Fazer login, fechar navegador, reabrir (deve permanecer logado)
- [ ] **Sem localStorage**: Inspecionar Application → Local Storage (não deve ter `gestorpro_user`)

---

## ⚠️ Troubleshooting

### Erro: "Edge Function não encontrada"
```bash
# Verificar se função foi deployada
supabase functions list

# Re-deploy se necessário
supabase functions deploy gemini-chat --no-verify-jwt
```

### Erro: "GEMINI_API_KEY não configurada"
```bash
# Verificar secrets
supabase secrets list

# Adicionar se ausente
supabase secrets set GEMINI_API_KEY=sua_chave_aqui
```

### Erro 429 (Rate Limit) mesmo com poucas requisições
```bash
# Limpar KV storage
# Executar no Supabase SQL Editor:
# (Não há comando direto, aguardar 1 minuto para reset automático)
```

### Session expira muito rápido
```typescript
// Configurar refresh automático no App.tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed automatically');
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

---

## 📊 Monitoramento

### Logs da Edge Function
```bash
# Ver logs em tempo real
supabase functions logs gemini-chat --tail

# Ver últimos 100 logs
supabase functions logs gemini-chat --limit 100
```

### Métricas de Uso
- Acessar: Supabase Dashboard → Edge Functions → gemini-chat
- Monitorar: Invocações, Erros, Latência

---

## 🔄 Rollback (Se Necessário)

```bash
# 1. Reverter commit
git revert HEAD

# 2. Push
git push origin main

# 3. Reativar VITE_GEMINI_API_KEY temporariamente
# (Adicionar de volta ao .env.local e Vercel)

# 4. Desabilitar Edge Function
supabase functions delete gemini-chat
```

---

## ✅ Checklist Final

- [ ] Edge Function deployada e funcionando
- [ ] `GEMINI_API_KEY` configurada no Supabase
- [ ] `VITE_GEMINI_API_KEY` removida do Vercel
- [ ] Script SQL de RLS executado
- [ ] Testes de isolamento multi-tenant passando
- [ ] Session persistence funcionando
- [ ] Nenhum erro no console do navegador
- [ ] Monitoramento de logs configurado
- [ ] Equipe notificada sobre mudanças

**Status:** Pronto para produção após completar checklist ✅
