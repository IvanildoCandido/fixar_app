# Publicação do painel e QR público na Vercel

O mesmo projeto Vercel publica:

- `/`: dashboard global autenticado;
- `/e/:token`: ficha pública do equipamento, sem login.

## Configuração do projeto

Importe a raiz deste repositório na Vercel. O arquivo `vercel.json` já define:

- framework `Vite`;
- instalação com `npm ci`;
- build com `npm run admin:build`;
- saída em `apps/admin-web/dist`;
- rewrite de `/e/:token` para o SPA.

Não altere o **Root Directory** para `apps/admin-web`; ele deve permanecer na raiz do repositório para que os workspaces npm e `packages/qr-contract` estejam disponíveis.

## Variáveis

Cadastre em **Production**, **Preview** e **Development**:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_FIXAR_WEB_URL=https://fixar.systechsolucoes.com.br
```

Use somente a chave pública/publishable do Supabase. Nunca cadastre `service_role` em uma aplicação Vite, pois variáveis usadas pelo frontend são incorporadas ao bundle do navegador.

## Domínio

Adicione `fixar.systechsolucoes.com.br` em **Settings > Domains** e aplique no provedor DNS exatamente o registro indicado pela Vercel. Depois do primeiro deploy de produção, valide:

```text
https://fixar.systechsolucoes.com.br/
https://fixar.systechsolucoes.com.br/e/token-invalido
```

A primeira URL deve abrir o login do dashboard. A segunda deve abrir a página genérica `Consulta pública indisponível`, sem retornar `404`.
