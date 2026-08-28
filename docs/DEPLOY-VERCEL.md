# Publicação do painel e QR público na Vercel

O mesmo projeto Vercel publica:

- `/`: dashboard global autenticado;
- `/e/:token`: ficha pública do equipamento, sem login.

## Configuração do projeto

O repositório aceita as duas configurações de **Root Directory**:

- raiz do repositório, usando `/vercel.json`;
- `apps/admin-web`, usando `/apps/admin-web/vercel.json`.

Para o projeto Vercel atualmente criado, mantenha **Root Directory** como `apps/admin-web`. O arquivo local já define:

- framework `Vite`;
- build com `npm run build`;
- saída em `dist`;
- rewrite de `/e/:token` para o SPA.

Se houver overrides antigos em **Settings > Build and Deployment**, desative-os para que a Vercel use `apps/admin-web/vercel.json`. O alias `npm run admin:build` também foi mantido no workspace para tolerar o comando observado no primeiro deploy.

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
