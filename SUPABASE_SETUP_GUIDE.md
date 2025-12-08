# 🚀 Guia de Configuração do Supabase - GESTOR PRO

## ✅ Arquivos Criados

Foram criados os seguintes arquivos na sua aplicação:

- **`supabase-setup.sql`** - Script SQL completo para criar o banco de dados
- **`services/supabaseClient.ts`** - Cliente configurado do Supabase
- **`services/supabaseService.ts`** - Serviço com todas as operações de banco de dados
- **`vite-env.d.ts`** - Definições de tipos TypeScript para variáveis de ambiente

## 📋 Passo a Passo para Configuração

### 1️⃣ Executar o Script SQL no Supabase

1. Acesse o painel do seu projeto no [Supabase](https://supabase.com)
2. No menu lateral, clique em **SQL Editor**
3. Clique em **"New query"**
4. Abra o arquivo `supabase-setup.sql` que foi criado na raiz do projeto
5. **Copie TODO o conteúdo** do arquivo
6. **Cole no SQL Editor** do Supabase
7. Clique em **"Run"** (ou pressione Ctrl+Enter)
8. Aguarde a confirmação de sucesso ✅

### 2️⃣ Obter as Credenciais do Supabase

1. No painel do Supabase, clique em **Settings** (ícone de engrenagem)
2. Clique em **API** no menu lateral
3. Copie os seguintes valores:
   - **Project URL** → Esta é sua `VITE_SUPABASE_URL`
   - **anon/public key** → Esta é sua `VITE_SUPABASE_ANON_KEY`

### 3️⃣ Configurar as Variáveis de Ambiente

1. Abra o arquivo `.env.local` na raiz do projeto
2. Adicione as seguintes linhas (substituindo pelos seus valores):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
VITE_GEMINI_API_KEY=sua-chave-gemini-aqui
```

**IMPORTANTE**: Substitua os valores acima pelas credenciais que você copiou do Supabase!

### 4️⃣ Reiniciar o Servidor de Desenvolvimento

1. Pare o servidor atual (pressione `Ctrl+C` no terminal onde está rodando)
2. Inicie novamente com:

```bash
npm run dev
```

## 🎉 Pronto!

Sua aplicação agora está conectada ao Supabase! 

### O que foi integrado:

✅ **Autenticação de usuários** - Login com email e senha  
✅ **Gestão de produtos** - CRUD completo de produtos  
✅ **Registro de vendas** - Vendas são salvas no banco  
✅ **Controle de estoque** - Atualização automática do estoque  
✅ **Sessões de caixa** - Gerenciamento de turnos  
✅ **Movimentações financeiras** - Histórico completo  
✅ **Gestão de usuários** - Adicionar, editar e remover usuários  

### Dados Iniciais

O banco já foi populado com:
- 2 usuários (admin e operador)
- 3 produtos de exemplo

**Credenciais de Login:**
- **Admin**: vinvanwan.abril@gmail.com / 123456
- **Operador**: operador@test.com / 123456

## 🔍 Verificação

Para verificar se tudo está funcionando:

1. Abra a aplicação em `http://localhost:3000`
2. Faça login com as credenciais acima
3. Navegue pelas telas (Dashboard, Estoque, PDV, etc.)
4. No painel do Supabase, vá em **Table Editor** e veja os dados sendo salvos em tempo real!

## ⚠️ Problemas Comuns

**Erro: "Missing Supabase environment variables"**
- Verifique se o arquivo `.env.local` está na raiz do projeto
- Confirme que as variáveis começam com `VITE_`
- Reinicie o servidor após adicionar as variáveis

**Erro de conexão com o banco**
- Verifique se a URL e a chave estão corretas
- Confirme que o script SQL foi executado com sucesso no Supabase

**Dados não aparecem**
- Abra o console do navegador (F12) e verifique se há erros
- Verifique no Supabase → Table Editor se as tabelas foram criadas

## 📚 Próximos Passos (Opcional)

- Ajustar as políticas de RLS (Row Level Security) para produção
- Configurar backup automático no Supabase
- Adicionar mais produtos e usuários conforme necessário
- Personalizar as permissões de acesso por função (admin/operador)

---

**Dúvidas?** Consulte a [documentação do Supabase](https://supabase.com/docs) ou me pergunte!
