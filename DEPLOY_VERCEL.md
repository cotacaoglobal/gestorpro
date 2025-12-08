# Guia de Deploy na Vercel

Este guia explica como colocar seu sistema GESTOR PRO no ar usando a Vercel.

## Pré-requisitos
1.  Conta no [GitHub](https://github.com)
2.  Conta na [Vercel](https://vercel.com) (pode entrar com GitHub)
3.  Seu projeto deve estar no GitHub (se ainda não estiver, veja abaixo).

## Passo 1: Subir código para o GitHub
Se você ainda não conectou seu código ao GitHub:
1.  Crie um novo repositório no GitHub.
2.  No terminal do VS Code, execute:
    ```bash
    git remote add origin SEU_URL_DO_GITHUB
    git branch -M main
    git div push -u origin main
    ```

## Passo 2: Configurar na Vercel
1.  Acesse o dashboard da Vercel: https://vercel.com/dashboard
2.  Clique em **"Add New..."** -> **"Project"**.
3.  Importe seu repositório do GitHub (`gestor-pro` ou nome similar).
4.  Na tela de configuração:
    *   **Framework Preset**: Vite (deve detectar automaticamente)
    *   **Environment Variables** (IMPORTANTE):
        Você precisa adicionar as variáveis do seu arquivo `.env.local`:
        *   `VITE_SUPABASE_URL`: [Sua URL do Supabase]
        *   `VITE_SUPABASE_ANON_KEY`: [Sua Key do Supabase]
        *   `VITE_GEMINI_API_KEY`: [Sua API Key do Gemini]
5.  Clique em **Deploy**.

## Passo 3: Finalização
A Vercel vai instalar, construir e publicar o site. Em cerca de 1 a 2 minutos, você receberá um link (ex: `gestor-pro-xyz.vercel.app`).

### Notas Importantes
- **Banco de Dados**: Seu banco de dados Supabase já está na nuvem, então funcionará normalmente.
- **Domínio**: A Vercel fornece um domínio gratuito `.vercel.app`.
