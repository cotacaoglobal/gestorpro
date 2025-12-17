# Instalação do Supabase CLI - Guia Rápido

## ❌ Problema Identificado
O Supabase CLI não pode ser instalado via `npm install -g supabase`.

## ✅ Soluções Disponíveis

### Opção 1: Scoop (Recomendado para Windows)

**Se você NÃO tem Scoop instalado:**
```powershell
# 1. Abrir PowerShell como Administrador
# 2. Executar:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# 3. Instalar Supabase CLI:
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Se você JÁ tem Scoop:**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

---

### Opção 2: Download Direto (Mais Rápido)

1. Baixar executável: https://github.com/supabase/cli/releases/latest
2. Procurar por: `supabase_windows_amd64.zip`
3. Extrair para uma pasta (ex: `C:\supabase`)
4. Adicionar ao PATH ou usar caminho completo

---

### Opção 3: Usar npx (Sem Instalação)

```bash
# Usar npx para executar comandos sem instalar globalmente
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase functions deploy gemini-chat
npx supabase secrets set GEMINI_API_KEY=sua_chave
```

**Vantagem:** Não precisa instalar nada  
**Desvantagem:** Mais lento (baixa a cada execução)

---

## 🚀 Após Instalação

```bash
# 1. Verificar instalação
supabase --version

# 2. Login
supabase login

# 3. Link com projeto
supabase link --project-ref SEU_PROJECT_REF

# 4. Deploy
supabase functions deploy gemini-chat

# 5. Configurar secret
supabase secrets set GEMINI_API_KEY=sua_chave_aqui
```

---

## 📋 Informações Necessárias

### 1. Project Reference ID
- Abrir: https://supabase.com/dashboard
- Ir em: Project Settings → General
- Copiar: Reference ID

### 2. GEMINI_API_KEY
- Abrir: https://aistudio.google.com/apikey
- Criar ou copiar chave existente

---

## ⚡ Qual opção você prefere?

1. **Scoop** - Melhor para uso contínuo
2. **Download Direto** - Mais rápido agora
3. **npx** - Sem instalação (mais lento)

Escolha uma opção e eu te ajudo a continuar!
