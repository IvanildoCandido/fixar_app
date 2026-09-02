# Pagamentos nativos

O FIXAR usa `expo-iap` (OpenIAP) somente em development/production builds nativos; Expo Go e web exibem a vitrine informativa. A flag `EXPO_PUBLIC_NATIVE_BILLING_ENABLED=true` habilita os CTAs nativos. O preço exibido em uma loja vem do produto localizado; o catálogo Supabase mantém apenas referências de R$ 39,90 (Professional) e R$ 79,90 (Team).

## Produtos

Cadastre manualmente os dois produtos mensais, sem trial, oferta introdutória ou anual:

| Plano | Product ID | Referência BRL |
| --- | --- | --- |
| Professional | `fixar_professional_monthly` | R$ 39,90/mês |
| Team | `fixar_team_monthly` | R$ 79,90/mês |

No Google Play, crie duas subscriptions com um base plan mensal e conceda acesso à API Android Publisher para uma service account. Configure Pub/Sub/RTDN apontando para a Edge Function de reconciliação, quando publicada. Nunca coloque o JSON da service account no app.

No App Store Connect, crie um subscription group com os dois auto-renewable subscriptions na mesma ordem de serviço (Team acima de Professional), configure preços BRL e selecione App Store Server Notifications V2. Gere a chave de In-App Purchase e configure App Store Server API. Nunca versione a chave `.p8` ou certificados raiz.

## Secrets server-side

Configure apenas no projeto Supabase:

- `GOOGLE_PLAY_PACKAGE_NAME`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- `APPLE_BUNDLE_ID`
- `APPLE_KEY_ID`
- `APPLE_ISSUER_ID`
- `APPLE_APP_STORE_SERVER_API_KEY`
- `APPLE_APP_ID` (produção)
- `APPLE_ENVIRONMENT` (`sandbox` ou `production`)
- `APPLE_ROOT_CA_BASE64` (certificados DER separados por vírgula)

A Edge Function `billing-verify-purchase` valida usuário owner, produto/plano, estado na loja, package/bundle e vínculo único à organização antes de atualizar `organization_subscriptions`. Tokens são armazenados apenas no servidor. Founder e overrides continuam preservados.

## Operação restante

Ainda dependem de configuração externa: criação dos produtos nos consoles, credenciais, Pub/Sub/RTDN Google, URL V2 Apple, acordos fiscais/bancários e testes com licensed testers/Sandbox. O código não declara esses itens como configurados.
