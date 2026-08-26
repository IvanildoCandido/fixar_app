# Fixar

Aplicativo Expo/React Native para gestão multiempresa de assistência técnica, integrado ao Supabase Auth, PostgreSQL e RLS.

## Configuração local

1. Copie `.env.example` para `.env`.
2. Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os valores públicos do projeto.
3. Instale as dependências com `corepack yarn install`.
4. Execute `corepack yarn start` ou `corepack yarn ios`.

O `.env` real é ignorado pelo Git. Nunca use uma chave `service_role` no aplicativo.

No Supabase Dashboard, adicione `fixar://auth/callback` em **Authentication → URL Configuration → Redirect URLs** para que confirmações de e-mail retornem ao aplicativo.

## Banco de dados

As migrations versionadas estão em `supabase/migrations/`. O aplicativo cria o perfil automaticamente após o cadastro e solicita a criação da primeira organização após o login confirmado.

## Verificações

```sh
corepack yarn tsc --noEmit
npx expo export --platform ios
```
