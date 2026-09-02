# Fundação comercial do FIXAR

Estado: COM-1, COM-2, COM-3A, COM-3B e COM-3C implementados e validados no worktree e no Supabase de desenvolvimento.

## A. Tabelas

- `commercial_plan_catalog`: fonte central dos planos. Campos: `code`, `display_name`, `price_cents`, `billing_cycle`, `limit_*`, `feature_*`, `history_days`, `is_active`, `is_public`.
- `commercial_offers`: ofertas internas separadas do plano. `founder` começa com `price_cents = 2990` e `billing_cycle = monthly`; não há SELECT direto para authenticated.
- `organization_subscriptions`: estado comercial da organização, com plano, oferta, status e período.
- `organization_plan_overrides`: exceções sobre limites/features de uma organização.
- `commercial_audit_log`: trilha de alterações com plano/status anterior e novo, oferta, preço, responsável, motivo e data.

Valores `NULL` em `limit_*` e `history_days` representam ilimitado. Features são booleanas. A migration contém `free`, `professional`, `team` e `grandfathered`; somente os três primeiros são públicos.

## B. Fonte de verdade

Limits, features e `history_days` vivem no Supabase em `commercial_plan_catalog`; Founder vive em `commercial_offers`. [src/domain/commercialPlans.ts](../src/domain/commercialPlans.ts) contém tipos, labels e merge de um payload backend, sem catálogo numérico local.

O app consulta `get_current_organization_entitlements(organization_id)`, que verifica associação e retorna `plan_code`, `display_name`, `subscription_status`, `offer_code`, `billing_cycle`, `price_cents`, `limits`, `features` e `history_days`. O parâmetro foi mantido porque o produto poderá suportar múltiplas organizações; membership impede acesso cross-tenant. Alterar QR Professional de 100 para 150 no banco não requer republicar o app.

## C. Organizações legacy

No instante da migration, cada organização existente com `deleted_at is null` é inserida explicitamente em `organization_subscriptions` com `plan_code = grandfathered` e `subscription_status = grandfathered`. O trigger `organizations_create_default_subscription` só atribui `free` a organizações criadas depois desse snapshot. `grandfathered` referencia `commercial_plan_catalog`, mas possui `is_public = false`.

Logo, organizações existentes não dependem da ausência de enforcement: sua assinatura persistida resolve para limites ilimitados, recursos avançados verdadeiros e `history_days = NULL` ilimitado. Organizações novas poderão começar em `free`.

## D. Entitlements

- Free: 1 usuário, 10 clientes, 15 equipamentos, 5 QR, 5 ordens/mês, 3 orçamentos/mês; recursos avançados desativados; 30 dias.
- Professional: 3 usuários, QR 100 e demais limites operacionais ilimitados; recursos avançados ativos; 365 dias.
- Team: 10 usuários, QR 500 e demais limites operacionais ilimitados; recursos do Professional ativos; 365 dias.
- Professional Founder: `plan_code = professional`, `offer_code = founder`, preço 2990 centavos BRL; mesmos entitlements técnicos do Professional.
- Professional + override QR 200: efetivo 200.
- Free + override `batch_orders = true`: efetivo `true`.

O resolver SQL aplica o override ativo mais recente. O TypeScript apenas tipa o payload backend.

## E. Usage

`private.get_organization_commercial_usage` retorna clientes/equipamentos não removidos, ordens/orçamentos não removidos do mês atual e `timezone = UTC`.

QR usa `public_token` como identidade única e `UNION` entre `generated_qr_codes` e `equipment_public_links`. QRs reservados contam; links contam somente quando o asset está ativo. Assim: 0 = 0; 5 disponíveis = 5; 3 disponíveis + 2 vinculados = 5; vincular um existente mantém 5; reimprimir mantém 5. PDF, visualização e acesso público não contam. O link automático de asset soft-deleted não é uma identidade válida e não conta.

Ordens/orçamentos usam intervalo semiaberto UTC: `2026-09-01T00:00:00Z <= created_at < 2026-10-01T00:00:00Z`. Soft delete não consome usage. O fluxo de criação não foi alterado.

## F. RLS

| Tabela | authenticated comum | admin global/backend privilegiado | anon |
|---|---|---|---|
| `commercial_plan_catalog` | SELECT; sem escrita | service role/backend | nenhum |
| `commercial_offers` | Sem SELECT direto ou escrita | service role/backend | nenhum |
| `organization_subscriptions` | SELECT da própria organização; sem escrita | backend/service role/futuro webhook | nenhum |
| `organization_plan_overrides` | SELECT da própria organização; sem escrita | backend/service role | nenhum |
| `commercial_audit_log` | SELECT owner/admin da própria organização; sem escrita | trigger/backend | nenhum |

Nenhum usuário comum altera seu plano. A auditoria não possui grant ou policy de escrita.

## G. Functions/RPCs

- `private.get_effective_organization_entitlements(uuid)`: `SECURITY DEFINER`, `search_path = ''`, sem grant ao cliente; resolve catálogo + assinatura + override.
- `public.get_current_organization_entitlements(uuid)`: `SECURITY DEFINER`, `search_path = ''`, verifica `private.is_organization_member`, executável por `authenticated`.
- `private.get_organization_commercial_usage(uuid)`: `SECURITY DEFINER`, `search_path = ''`, sem grant ao cliente; consulta usage autoritativo.
- `public.get_current_organization_commercial_usage(uuid)`: `SECURITY DEFINER`, `search_path = ''`, verifica associação, executável por `authenticated`.
- Triggers privados de assinatura/override: `SECURITY DEFINER`, `search_path = ''`, grants revogados; criam Free para novas organizações e registram auditoria.

## H. Testes

O teste TypeScript cobre resolução, Founder, overrides, legacy, deduplicação QR e contratos textuais da migration. Não simula RLS PostgreSQL. A validação RLS efetiva requer executar a migration em banco local ou ambiente autorizado.

Comando: `npx tsx --test tests/commercialPlans.test.ts`

Resultado: 34 testes, 34 pass, 0 fail.

## I. Git

Arquivos alterados/criados: [AGENTS.md](../AGENTS.md), [src/domain/commercialPlans.ts](../src/domain/commercialPlans.ts), [supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql](../supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql), [supabase/migrations/20260901193000_commercial_usage_qr_active_links.sql](../supabase/migrations/20260901193000_commercial_usage_qr_active_links.sql), [tests/commercialPlans.test.ts](../tests/commercialPlans.test.ts) e este documento.

`20260901000000` entrou remotamente como `20260901185620`; como o teste real encontrou o link automático de asset removido, foi aplicada a corretiva `20260901193000`. Nenhum commit ou push foi realizado.

## Fora do escopo

Sem Meu Plano, tela de planos, paywall, gateway, cobrança, branding premium, histórico bloqueado, cadeados ou admin comercial.

## COM-3: enforcement de clientes, equipamentos e QR

O enforcement autoritativo foi adicionado em `20260901200000_com3_resource_creation_enforcement`. A função central `private.assert_can_create_resource` resolve entitlements e usage efetivos e serializa cada organização com `pg_advisory_xact_lock`. Limites ilimitados (`NULL`) não bloqueiam. Status comerciais não quantitativos não bloqueiam nesta fase.

As RPCs autoritativas são `create_customer(jsonb)`, `create_asset_with_reserved_qr(jsonb)` e `reserve_equipment_qr_codes(uuid, text[])`. INSERT direto autenticado em `customers` e `assets` foi revogado. A reserva em lote valida a quantidade total antes de inserir, portanto não produz lote parcial.

`PLAN_LIMIT_REACHED` retorna `message` estável e `detail` JSON com `code`, `resource`, `usage`, `limit`, `requested` e `plan_code`. A UI usa `src/services/commercialErrors.ts` para traduzir o erro; não decide limites.

Equipamento valida a cota de equipment e, quando não encontra QR reservado pela referência, valida também QR. Ao vincular QR reservado, a identidade existente é reutilizada e não há consumo adicional. Assets e customers restaurados de soft delete passam pelo mesmo guard; exclusão lógica libera a vaga.

Validação Supabase real: Free 10º cliente permitido, 11º recusado, soft delete libera uma vaga; equipamento 15º permitido e 16º recusado com override temporário de QR; lote de 5 QR permitido, 6º recusado; equipamento vinculado a QR reservado não aumentou QR de 5; duas reservas concorrentes em 4/5 produziram uma criação e uma recusa. Dados temporários e eventos de auditoria foram removidos.

Testes locais de enforcement: `npx tsx --test tests/commercialEnforcement.test.ts tests/commercialPlans.test.ts tests/commercialQuoteEnforcement.test.ts` (54 testes aprovados). A política de ordens, offline, manutenção em lote, histórico, branding e usuários/equipe permanece fora desta fatia.

## COM-3B: enforcement de orçamentos

Orçamentos usam a mesma função central de enforcement, agora com o recurso `quote` e o limite `quotes_monthly`. A RPC `create_quote(jsonb)` valida membership, adquire o mesmo lock transacional da organização, valida usage em mês calendário UTC e grava `quotes` e `quote_items` atomicamente. INSERT direto autenticado em `quotes` foi revogado; edição, itens, soft delete, PDF e compartilhamento não criam nova entidade e não consomem quota.

`PLAN_LIMIT_REACHED` mantém o contrato existente com `resource = quote`, `usage`, `limit`, `requested` e `plan_code`. Override `quotes_monthly` prevalece sobre o plano base. Restauração de quote, caso algum fluxo futuro a implemente, passa pelo mesmo guard; atualmente o app não possui rota de restauração.

Validação real no Supabase: Free criou até 3, recusou o 4º, edição manteve usage, soft delete liberou uma vaga, override temporário 3→5 permitiu até 5, INSERT direto e cross-tenant foram recusados. Em uma corrida real com 2/3, duas chamadas simultâneas produziram uma criação e uma rejeição, mantendo 3/3. Dados temporários foram removidos.

Testes locais adicionais: `npx tsx --test tests/commercialQuoteEnforcement.test.ts`. Nenhuma criação ou política de `work_orders`, offline, lote, histórico, branding ou usuários/equipe foi alterada.

## COM-3C: enforcement de manutenções individuais

Manutenções individuais online/offline são criadas exclusivamente por `create_work_order_offline(jsonb)`. A RPC valida papel `owner/admin/technician`, resolve idempotência por `(organization_id, offline_local_id)` antes da quota e usa o guard transacional compartilhado com `resource = work_order`. O antigo `createRepair()` com INSERT direto e a rota `/repairs/add` foram removidos.

O limite mensal usa `work_orders.created_at` server-side em UTC; `completed_at` não escolhe o mês comercial. Free permite 5 ordens/mês; Professional, Team e Grandfathered permanecem ilimitados. Soft delete libera uso e overrides prevalecem. `PLAN_LIMIT_REACHED` mantém o registro local como `blocked_commercial`, fora do retry automático e disponível para retry manual com o mesmo `localId`/`offline_local_id`.

`create_work_orders_batch(jsonb)` permanece funcional como `SECURITY DEFINER`, sem quota de ordens e sem bloqueio por `batch_orders` nesta fatia. O INSERT direto em `work_orders` foi revogado. A corretiva incremental `20260901223000_com3c_minimum_work_order_grants.sql` também removeu `TRUNCATE`, `REFERENCES` e `TRIGGER` de `authenticated`, preservando somente `SELECT`, `UPDATE` e `DELETE` sujeitos aos controles existentes.

Validação real no Supabase: 4/5→5/5; 6ª ordem recusada; resposta perdida retornou a mesma ordem mesmo em 5/5; concorrência em 4/5 produziu uma criação e uma recusa; upgrade e soft delete liberaram retry da mesma mutation; override 5→8 foi respeitado; INSERT direto e acessos cross-tenant foram negados; batch Free permaneceu funcional. Todas as fixtures e auditorias artificiais temporárias foram removidas.

Verificações finais: suíte comercial com 64/64, suíte completa com 105/105 e `npx tsc --noEmit` sem erros.

## Camada comercial visível

O aplicativo possui `CommercialProvider` como fonte única para entitlements, usage e catálogo público, atualizado ao abrir e retornar ao foreground. `Meu Plano` mostra plano, status, oferta Founder, preço real, uso efetivo e limites; recursos ilimitados não usam barras artificiais e downgrades podem exibir usage acima do limite sem apagar dados. `Planos` usa o catálogo remoto e oferece apenas manifestação de interesse/atendimento, sem checkout ou cobrança simulada.

O `UpgradePrompt` central atende limites e features no contexto da ação. A Home mantém foco operacional e exibe manutenção em lote com bloqueio explícito quando `batch_orders=false`. A RPC batch aplica o mesmo entitlement no backend. Histórico é limitado por RLS usando `created_at` e `history_days`, incluindo tabelas filhas e a ficha pública; upgrades com `full_history` restauram o acesso imediatamente, sem exclusão.

Branding personalizado permanece salvo em qualquer plano. `custom_branding` decide o uso da logomarca nos documentos, etiquetas e ficha pública; nome e contato operacional do prestador permanecem disponíveis. O cache de documentos inclui o entitlement, refletindo upgrade/downgrade após refetch.

O Global Admin reutiliza o painel existente e as tabelas comerciais: lista plano/status/usage, permite alterar plano e status, aplicar/remover Founder e criar/remover override de QR. `platform_admin_update_commercial` exige administrador global; subscriptions e overrides continuam produzindo eventos no `commercial_audit_log`. Não há service-role no cliente e não foi criado um segundo sistema de auditoria.

Migrations incrementais: `20260902100000_commercial_experience_controls.sql`, `20260902103000_fix_commercial_history_policy_execute.sql` e `20260902104500_add_commercial_user_usage.sql`.
