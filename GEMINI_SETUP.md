# Configuração da API do Google Gemini

## Como obter sua chave de API

1. Acesse [Google AI Studio](https://aistudio.google.com/apikey)
2. Faça login com sua conta Google
3. Clique em "Get API Key" ou "Criar chave de API"
4. Copie a chave gerada

## Configurar no projeto

1. Abra ou crie o arquivo `.env.local` na raiz do projeto
2. Adicione a seguinte linha:
   ```
   VITE_GEMINI_API_KEY=sua_chave_aqui
   ```
3. Substitua `sua_chave_aqui` pela chave que você copiou
4. Salve o arquivo
5. **Importante**: Reinicie o servidor de desenvolvimento (pare com Ctrl+C e execute `npm run dev` novamente)

## Exemplo de `.env.local` completo

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# Google Gemini
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Testando

Após configurar:
1. Reinicie o servidor
2. Acesse o Dashboard
3. Clique no botão "Análise IA - Gerar Insights"
4. Aguarde alguns segundos
5. Um modal com a análise deve aparecer

## Solução de Problemas

### Erro: "API Key não configurada"
- Verifique se você criou o arquivo `.env.local` na pasta correta (mesma pasta do `package.json`)
- Verifique se o nome da variável está correto: `VITE_GEMINI_API_KEY`
- Certifique-se de reiniciar o servidor após criar/editar o arquivo

### Erro: "Limite de Uso Excedido"
- O plano gratuito do Gemini tem limites de requisições
- Aguarde alguns minutos e tente novamente
- Considere criar um novo projeto no Google AI Studio para obter novos limites

### A análise não aparece
- Abra o Console do navegador (F12) e verifique se há erros
- Verifique se há produtos e vendas cadastrados no sistema
- Tente recarregar a página

## Recursos

- [Documentação oficial do Google Gemini](https://ai.google.dev/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Limites e Cotas](https://ai.google.dev/pricing)
