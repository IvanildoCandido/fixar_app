# FIXAR — Checklist antes de publicar

## Status atual

- [x] Código de cobrança nativa preparado com `expo-iap` para builds nativos.
- [x] Backend de verificação, associação à organização, restore e eventos de ciclo de vida versionado.
- [x] Migration `20260903100000_native_billing_subscriptions.sql` aplicada no Supabase remoto após trazer para o repositório as sete migrations comerciais remotas legítimas e remover seus duplicados locais obsoletos.
- [x] Edge Functions `billing-verify-purchase`, `billing-apple-notification` e `billing-google-rtdn` publicadas.
- [ ] Secrets de produção cadastrados no Supabase.
- [ ] Produtos, credenciais e notificações configurados nas lojas.
- [x] Testes locais: 118/118; TypeScript mobile e admin aprovados.

Valores comerciais de referência: Grátis R$ 0; Professional R$ 39,90/mês; Team R$ 79,90/mês. O preço mostrado no checkout sempre vem da loja. Founder é uma oferta manual do Professional e não é produto de loja.

## 1. Contas necessárias

- Google Play Console: cadastro do aplicativo, assinaturas, testers e publicação Android.
- Google Cloud Console: projeto, Android Publisher API e service account.
- Apple Developer Program: App ID, certificados e chave da App Store Server API.
- App Store Connect: aplicativo, assinaturas, TestFlight e publicação iOS.
- Supabase: banco, Edge Functions, secrets e logs.

Use os valores e contratos exibidos pelas plataformas no dia da configuração; não coloque credenciais fiscais ou chaves no repositório.

## 2. Preparar o Supabase

Projeto configurado localmente: `gcdhtfytpatvesadeyim`; URL de functions: `https://gcdhtfytpatvesadeyim.supabase.co/functions/v1/`. Migration e funções foram aplicadas/publicadas; secrets Google/Apple e consoles continuam pendentes.

1. No diretório do projeto, confirme `npx supabase link --project-ref gcdhtfytpatvesadeyim`.
2. `npx supabase migration list` agora mostra versões locais/remotas alinhadas até `20260902104500`, com `20260903100000` aplicada em ambos.
3. A migration criou `billing_webhook_events`, colunas de provider e grants; confirme esses objetos no Dashboard quando necessário.
4. As funções foram publicadas com `npx supabase functions deploy --use-api`; não execute `--prune`.
5. Cadastre os secrets listados abaixo em **Project Settings → Edge Functions → Secrets**. Nunca os coloque em `.env`, no app ou no Git.
6. Observe **Edge Functions → Logs** durante os smoke tests.

Secrets usados efetivamente:

- Google: `GOOGLE_PLAY_PACKAGE_NAME`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `GOOGLE_PUBSUB_AUDIENCE`.
- Apple: `APPLE_APP_STORE_SERVER_API_KEY`, `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_BUNDLE_ID`, `APPLE_APP_ID`, `APPLE_ENVIRONMENT`, `APPLE_ROOT_CA_BASE64`.
- Supabase fornece `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente das functions; não copie a service role para o aplicativo.

URLs finais:

- Google RTDN: `https://gcdhtfytpatvesadeyim.supabase.co/functions/v1/billing-google-rtdn`
- Apple Notifications V2: `https://gcdhtfytpatvesadeyim.supabase.co/functions/v1/billing-apple-notification`
- Verificação de compra (chamada autenticada pelo app): `https://gcdhtfytpatvesadeyim.supabase.co/functions/v1/billing-verify-purchase`

Smoke test sem compra: `GET` deve retornar método não permitido; POST sem payload deve rejeitar. Os endpoints de notificação não exigem sessão de usuário, mas validam a assinatura/token da respectiva plataforma.

## 3. Google Play — cadastrar o aplicativo

1. Abra o Google Play Console e crie o app **FIXAR** como aplicativo, usando o idioma principal e a classificação que correspondem ao produto.
2. Use exatamente o application ID `app.fixar.mobile` (projeto Expo: `android.package`).
3. Configure Play App Signing e crie um release em **Internal testing** antes de produção.
4. Complete as declarações solicitadas pelo Console e adicione uma conta de tester/licença.

## 4. Google Play — assinaturas

Em **Monetize → Products → Subscriptions**, crie:

- `fixar_professional_monthly`: base plan mensal (`monthly` ou o identificador mensal exigido pelo Console), preço de referência R$ 39,90/mês.
- `fixar_team_monthly`: base plan mensal, preço de referência R$ 79,90/mês.

Subscription product é o produto comercial; base plan é a oferta recorrente (período, preço e disponibilidade) dentro dele. Não crie anual, trial ou promoção nesta etapa.

## 5. Google Play — acesso da API e RTDN

1. No Google Cloud, selecione o projeto ligado ao Play Console e ative **Google Play Android Developer API**.
2. Crie uma service account exclusiva para billing, concedendo no Play Console apenas a permissão mínima de leitura/gerenciamento de assinaturas necessária ao Android Publisher API.
3. Gere a chave JSON, guarde-a em cofre seguro e cadastre o conteúdo inteiro como `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
4. Configure Pub/Sub para o projeto. Permita que o serviço do Google Play publique no tópico e crie a subscription conforme a opção de push escolhida.
5. Configure o push endpoint para a URL RTDN acima e a audiência OIDC exatamente igual a `GOOGLE_PUBSUB_AUDIENCE`.
6. Ative Real-time developer notifications no Play Console e envie uma notificação de teste; confirme o log e o evento idempotente no Supabase.

## 6. Google Play — teste de compras

1. Publique o AAB em Internal testing e adicione seu e-mail como tester.
2. Instale pela Play Store; não use Expo Go.
3. Confirme que os produtos carregam e que o preço localizado vem do Play.
4. Com uma organização em que você é owner, compre Professional; confirme a assinatura e o plano no Meu Plano.
5. Teste Team, restore em outro dispositivo e cancelamento. O acesso deve permanecer até o fim do período; a expiração deve refletir o estado verificado sem apagar dados.
6. Confirme RTDN e logs. Registre qualquer comportamento específico de renovação acelerada do ambiente de teste.

Critério Google: produtos carregam, compra é validada no servidor, assinatura é ligada à organização correta, upgrade/restore/cancelamento/expiração atualizam o estado, retry não duplica evento e dados permanecem preservados.

## 7. App Store Connect — cadastrar aplicativo

1. Crie o app no App Store Connect usando Bundle ID `app.fixar.mobile`, nome FIXAR e um SKU interno escolhido por você.
2. Gere a build nativa com o perfil de distribuição e envie-a para TestFlight. A versão atual do projeto é `2.0.1`, Android `versionCode 18` e iOS `buildNumber 3`; incremente o build conforme a regra de cada loja antes de cada novo upload.
3. Crie um Sandbox Tester separado da conta pessoal.

## 8. Apple — grupo e produtos

Crie o grupo **FIXAR Planos** e, dentro dele, duas assinaturas auto-renewable mensais:

- `fixar_professional_monthly`, nome FIXAR Profissional, preço de referência R$ 39,90/mês.
- `fixar_team_monthly`, nome FIXAR Equipe, preço de referência R$ 79,90/mês.

Defina Team como nível superior quando o App Store Connect pedir níveis. Escolha o price point brasileiro disponível mais próximo; o app usa `displayPrice` retornado pelo StoreKit.

## 9. Apple — App Store Server API

Em **Users and Access → Integrations → App Store Connect API**, crie uma chave com a permissão mínima para consultar assinaturas. Guarde o arquivo `.p8` imediatamente e cadastre seus valores como `APPLE_APP_STORE_SERVER_API_KEY`, `APPLE_KEY_ID` e `APPLE_ISSUER_ID`; configure `APPLE_BUNDLE_ID`, `APPLE_APP_ID`, `APPLE_ENVIRONMENT` e os certificados raiz em `APPLE_ROOT_CA_BASE64`. A chave privada não pode entrar no Git.

## 10. Apple — Server Notifications V2

No app do App Store Connect, abra a configuração de **App Store Server Notifications**, selecione V2 e informe a URL `https://gcdhtfytpatvesadeyim.supabase.co/functions/v1/billing-apple-notification` para produção e sandbox quando a interface oferecer campos separados. Envie uma notificação de teste e confira os logs. Não use V1.

## 11. Apple — teste Sandbox/TestFlight

1. Instale a build pelo TestFlight usando o Sandbox Tester.
2. Com owner autenticado, compre Professional, valide o plano e depois teste Team.
3. Use restore purchases, reinstalação e outro dispositivo com o mesmo login.
4. Teste renovação acelerada, cancelamento, expiração, refund/revoke quando disponíveis no sandbox e confirme as Notifications V2.

Critério Apple: `displayPrice` aparece, JWS é validado no servidor, a organização correta recebe o plano, notificações alteram o ciclo de vida, restore funciona e nenhum dado operacional é removido.

## 12. Dados bancários, contratos e impostos

- [ ] Google: concluir merchant/payment profile e todos os contratos exibidos pelo Play Console.
- [ ] Apple: concluir **Agreements, Tax and Banking** no App Store Connect.

## 13. Privacidade e publicação

- [ ] Publicar política de privacidade e URL de suporte/termos reais.
- [ ] Declarar login, dados da organização, clientes, equipamentos, ordens, assinaturas e diagnósticos conforme a realidade do app.
- [ ] Declarar câmera para leitura de QR, fotos somente para logo, notificações locais e armazenamento seguro de sessão.
- [ ] Não declarar localização, analytics ou compartilhamento que o código não utiliza.
- [ ] Confirmar o fluxo de exclusão de conta exigido pela loja; o app atualmente encerra sessão, mas não oferece fluxo completo de exclusão de conta. **PENDÊNCIA DE PUBLICAÇÃO**.

## 14. Materiais necessários para publicação

- [ ] Google: ícone, feature graphic, screenshots, descrição curta/completa, categoria, contato e URLs.
- [ ] Apple: ícone, screenshots por tamanho, subtitle, descrição, keywords, suporte e privacidade.
- [x] Splash e assets estão configurados no projeto; não redesenhar nesta etapa.
- [x] Página pública de equipamento usa `https://fixar.systechsolucoes.com.br/e/<token>`.

## 15. Informações para revisão Apple

Preencha no App Store Connect uma conta de teste real e instruções: entrar, selecionar uma organização, abrir **Planos**, comprar/restore em sandbox e acessar um equipamento por QR. Não escreva senha no repositório.

## 16. Informações para revisão Google

Forneça no Play Console uma conta de tester funcional, instruções para abrir Planos e o procedimento de compra em Internal testing. Indique que as assinaturas são Professional e Team mensais.

## 17. Matriz rápida

| Item | Código | Supabase | Google | Apple | Status |
|---|---|---|---|---|---|
| Billing client | PASS | — | — | — | Pronto no build nativo |
| Verificação server-side | PASS | PENDENTE deploy | API pendente | API pendente | Aguardando configuração |
| Migration billing | PASS | PASS | — | — | Aplicada remotamente |
| Produto Professional | PASS | — | PENDENTE | PENDENTE | Criar nas consoles |
| Produto Team | PASS | — | PENDENTE | PENDENTE | Criar nas consoles |
| RTDN | PASS código | PASS deploy; secrets pendentes | PENDENTE | — | Configurar Pub/Sub |
| Notifications V2 | PASS código | PASS deploy; secrets pendentes | — | PENDENTE | Configurar App Store |
| Compra sandbox/teste | PASS fluxo | PENDENTE | PENDENTE | PENDENTE | Executar em builds reais |

## Ordem que você deve seguir

1. Reconciliar o histórico e aplicar a migration no Supabase.
2. Publicar as três Edge Functions e cadastrar secrets.
3. Criar o app e produtos no Google Play; configurar API e RTDN.
4. Fazer build Android de Internal testing e executar a compra de teste.
5. Criar o app e produtos no App Store Connect; configurar Server API e Notifications V2.
6. Fazer build TestFlight e executar a compra Sandbox.
7. Concluir privacidade, exclusão de conta, contratos, dados bancários e materiais de listing.
8. Revisar os critérios de PASS e submeter cada loja.
