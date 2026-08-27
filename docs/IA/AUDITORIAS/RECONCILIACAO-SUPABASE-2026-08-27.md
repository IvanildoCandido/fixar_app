# Reconciliação entre repositório e Supabase

**Data da inspeção:** 2026-08-27  
**Projeto auditado:** `Fixar` (`gcdhtfytpatvesadeyim`, `us-west-2`)  
**Escopo:** inventário e reconciliação; nenhum dado, objeto ou configuração foi removido.

## Contexto e critério

Existiu um repositório FIXAR anterior, posteriormente abandonado. O repositório
atual foi iniciado como reconstrução limpa, mas reutilizou o projeto Supabase.
Para funcionalidades da aplicação, este repositório é a fonte da verdade.

Ausência de chamada direta não foi tratada como prova de legado. Objetos
versionados como contratos futuros ou estruturais foram preservados. Somente
objetos com origem antiga comprovada, ausência de dependências atuais e
finalidade incompatível com a arquitetura atual poderiam ser removidos.

## Resultado executivo

No escopo de objetos customizados da aplicação foram classificados:

| Classificação | Quantidade | Critério de contagem |
|---|---:|---|
| ATUAL | 179 | 15 tabelas, 9 funções, 21 triggers, 63 policies, 62 índices, 7 enums e 2 buckets |
| INFRAESTRUTURA | 14 | 1 função/event trigger de RLS, 6 event triggers Supabase, 5 extensions instaladas e 1 publication |
| LEGADO CONFIRMADO | 0 | Nenhum objeto satisfez a regra de exclusão |
| POSSIVELMENTE LEGADO | 0 | Nenhum objeto customizado ficou sem origem ou dependência suficiente |
| DESCONHECIDO | 0 | Nenhum objeto customizado permaneceu sem finalidade identificada |

Tabelas internas dos schemas `auth`, `storage`, `realtime`, `vault`,
`supabase_migrations`, `graphql` e catálogos PostgreSQL foram tratadas como
infraestrutura gerenciada e não contadas individualmente.

## Tabelas públicas

Todos os tamanhos são lógicos e observados no catálogo. Todas as 15 tabelas
estavam com RLS habilitado.

| Tabela | Linhas | Dados / índices / total | Policies | FKs | Índices | Triggers | Referência atual, origem e finalidade |
|---|---:|---:|---|---|---|---|---|
| `profiles` | 2 | 8 / 16 / 32 KiB | `select_self`, `insert_self`, `update_self` | `id → auth.users` | PK | `set_updated_at` | AuthContext; schema inicial; perfil do usuário |
| `organizations` | 2 | 8 / 16 / 32 KiB | `select_member`, `insert_authenticated`, `update_admin` | — | PK | `add_owner`, `set_updated_at` | AuthContext, perfil e relatórios; schema inicial/auth onboarding |
| `organization_members` | 2 | 8 / 80 / 96 KiB | CRUD por membro/admin | organização, usuário e `invited_by` | PK, unique organização/usuário, convite e suporte de autorização | `set_updated_at`, `validate_invited_by` | AuthContext/RLS; schema inicial + hardening |
| `customers` | 15 | 8 / 48 / 64 KiB | select membro; escrita admin | organização | PK, unique organização/id, ativos por organização | `set_updated_at` | `API.ts`; schema inicial; clientes |
| `assets` | 155 | 32 / 64 / 128 KiB | select membro; escrita admin | organização e cliente compostos | PK, unique organização/id/referência e cliente | `set_updated_at` | `API.ts`; schema inicial/técnico; equipamentos |
| `catalog_items` | 148 | 32 / 80 / 144 KiB | select membro; escrita admin | organização | PK, unique organização/id, tipo e nome | `set_updated_at` | `API.ts`; schema inicial/performance; peças e serviços |
| `work_orders` | 3.175 | 536 / 1.080 / 1.672 KiB | select membro; escrita admin | organização, cliente/ativo compostos e usuário responsável | PK, unique e nove índices operacionais | `set_updated_at`, `validate_assigned_to` | `API.ts`, Home e relatórios; schema inicial + lembretes + técnico + performance + hardening |
| `work_order_items` | 3.470 | 952 / 720 / 1.712 KiB | select membro; escrita admin | organização, OS e catálogo compostos | PK, unique, OS e catálogo | `set_updated_at` | `API.ts` e relatórios; schema inicial |
| `quotes` | 3 | 8 / 96 / 112 KiB | select membro; escrita admin | organização, cliente, ativo e OS compostos | PK, unique, status e três FKs operacionais | `set_updated_at` | `API.ts` e orçamento; schema inicial |
| `quote_items` | 12 | 8 / 64 / 80 KiB | select membro; escrita admin | organização, orçamento e catálogo compostos | PK, unique, orçamento e catálogo | `set_updated_at` | `API.ts` e orçamento; schema inicial |
| `attachments` | 0 | 8 / 112 / 128 KiB | select membro; escrita admin | organização, quatro pais e uploader | PK, unique caminho e cinco índices de FKs | `set_updated_at`, `validate_uploaded_by` | contrato arquitetural atual ainda sem UI; schema inicial + hardening |
| `audit_events` | 0 | 8 / 48 / 64 KiB | select admin | organização e ator | PK, organização/data e ator | imutabilidade e `validate_actor_id` | contrato arquitetural atual ainda sem emissor; schema inicial + hardening |
| `technical_templates` | 0 | 0 / 24 / 32 KiB | select membro; escrita admin | organização | PK, unique organização/chave e ativos | `set_updated_at` | contrato técnico atual; migration técnica |
| `work_order_technical_checks` | 16 | 8 / 48 / 64 KiB | select membro; escrita admin | organização e OS compostos | PK, unique organização/OS/chave e ordenação | `set_updated_at` | `API.ts`, formulário e relatórios; migration técnica |
| `work_order_measurements` | 0 | 0 / 24 / 32 KiB | select membro; escrita admin | organização e OS compostos | PK, unique organização/OS/chave e ordenação | `set_updated_at` | `API.ts`, formulário e relatórios; migration técnica |

Há 55 policies públicas. Elas correspondem às policies versionadas nas
migrations atuais e dependem dos helpers privados de associação e papel.

## Funções e RPCs

| Função | Modo / owner | Grants | Dependências e referência | Classificação |
|---|---|---|---|---|
| `private.handle_new_user()` | DEFINER / `postgres` | somente owner | trigger de `auth.users`; auth onboarding | ATUAL |
| `private.add_organization_owner()` | DEFINER / `postgres` | somente owner | trigger de `organizations`; auth onboarding | ATUAL |
| `private.is_organization_member(uuid)` | DEFINER / `postgres` | `authenticated`, `service_role` | 14 dependências de policies | ATUAL |
| `private.has_organization_role(uuid, organization_role[])` | DEFINER / `postgres` | `authenticated`, `service_role` | 60 dependências de policies e RPC em lote | ATUAL |
| `private.enforce_organization_user_reference()` | DEFINER / `postgres` | somente owner | quatro triggers do hardening | ATUAL |
| `public.create_work_orders_batch(jsonb)` | INVOKER / `postgres` | `authenticated`, `service_role` | chamada por `API.ts`; lote transacional | ATUAL |
| `public.set_updated_at()` | INVOKER / `postgres` | somente owner; chamada por trigger | 14 triggers de timestamps | ATUAL |
| `public.reject_audit_event_change()` | INVOKER / `postgres` | somente owner; chamada por trigger | imutabilidade de auditoria | ATUAL |
| `public.safe_uuid(text)` | INVOKER / `postgres` | `authenticated`, `service_role` | cinco dependências nas policies do bucket privado | ATUAL |
| `public.rls_auto_enable()` | DEFINER / `postgres` | somente owner | event trigger `ensure_rls`; testada pelo hardening | INFRAESTRUTURA |

Não foram encontradas outras RPCs, funções de Sync, change log, cursor,
conflito, rebase, Outbox ou `record_version` em `public` ou `private`.

## Triggers

- 14 triggers `set_updated_at` nas tabelas mutáveis.
- 4 triggers de integridade multiempresa criados pelo hardening.
- 1 trigger imutável em `audit_events`.
- 1 trigger de owner inicial em `organizations`.
- 1 trigger de perfil em `auth.users`.
- `ensure_rls` chama `rls_auto_enable()` após criação de tabelas públicas.
- Os outros seis event triggers pertencem à infraestrutura Supabase/PostgREST:
  concessão de acesso a extensões, placeholder GraphQL e atualização de cache
  de schema do PostgREST.

## Índices, constraints e tipos

Os 62 índices públicos são explicados por PKs, uniques, FKs, RLS/tenancy,
paginação, filtros, catálogo e lembretes versionados. Nenhum índice ou constraint
possui nome, coluna ou dependência de Sync v1. Não foi removido índice apenas por
`idx_scan = 0`.

Os sete enums públicos (`organization_role`, `membership_status`,
`catalog_item_kind` e quatro tipos técnicos) foram criados pelas migrations
atuais e são usados por tabelas, policies ou funções atuais.

## Storage

| Bucket | Público | Objetos | Bytes lógicos | Policies | Finalidade |
|---|---:|---:|---:|---:|---|
| `fixar-attachments` | não | 0 | 0 | 4 | contrato atual para anexos privados |
| `organization-logos` | sim | 1 | 336.071 | 4 | logo usada pela organização e relatórios |

O único objeto existente está referenciado por `organizations.logo_path`. Não
há objeto órfão nem referência para objeto ausente.

## Auth, dados e ambiente

- Existem dois usuários confirmados, ambos com associação owner ativa.
- Nenhum e-mail correspondeu a padrões genéricos de teste analisados; os valores
  não foram reproduzidos.
- Não há evidência suficiente para excluir qualquer usuário ou organização.
- A organização mais antiga concentra toda a base operacional; a segunda não
  possui dados de negócio, mas pode representar onboarding válido e foi mantida.
- As 3.175 OS, 3.470 itens, 155 ativos e 148 itens de catálogo foram importados
  deliberadamente da API legada do Soilucenter para testar a aplicação atual.
  São dados de desenvolvimento atuais, não estruturas do Sync v1 abandonado.
- Não existem Edge Functions nem tabelas publicadas em `supabase_realtime`.
- O identificador configurado localmente corresponde ao projeto auditado. A
  documentação e o histórico do repositório o identificam como desenvolvimento;
  o Management API não expõe um rótulo adicional de ambiente.

## Extensions instaladas

Somente `plpgsql`, `pgcrypto`, `pg_stat_statements`, `supabase_vault` e
`uuid-ossp` estão instaladas. `pgcrypto` é declarada pela migration atual; as
demais são infraestrutura PostgreSQL/Supabase. Nenhuma extension foi removida.

## Migrations remotas

As migrations remotas correspondem, em ordem, às migrations locais:
schema SaaS, hardening inicial, onboarding, identidade de relatórios,
compatibilidade do logo, lembretes, manutenção técnica, performance/lote e
hardening da auditoria. A reconciliação adicionou somente o hardening de grants
dos helpers atuais. Não há migration remota identificada como Sync v1 ou projeto
anterior.

## Tamanho e efeito da reconciliação

| Métrica | Antes | Depois |
|---|---:|---:|
| Banco total | 16.198.803 bytes | 16.198.803 bytes |
| Dados `public` | 1.662.976 bytes | 1.662.976 bytes |
| Índices `public` | 2.580.480 bytes | 2.580.480 bytes |
| Total lógico `public` | 4.497.408 bytes | 4.497.408 bytes |
| Objetos Storage | 336.071 bytes | 336.071 bytes |

Nenhuma limpeza foi aplicada, portanto a diferença é zero. Não foi executado
`VACUUM FULL`, `REINDEX`, `DROP ... CASCADE` ou qualquer exclusão.

## Matriz resumida repositório × banco

| Objeto remoto | Referenciado atualmente? | Dependências DB? | Origem | Classificação |
|---|---|---|---|---|
| 15 tabelas públicas | sim, direta ou como contrato versionado | FKs, policies, triggers e funções | migrations atuais | ATUAL |
| 9 funções da aplicação | sim, direta ou estruturalmente | policies/triggers/RPC | migrations atuais | ATUAL |
| `rls_auto_enable` + `ensure_rls` | teste e hardening atuais | event trigger | infraestrutura preexistente preservada | INFRAESTRUTURA |
| 6 event triggers gerenciados | não pelo app | Supabase/PostgREST/extensions | plataforma | INFRAESTRUTURA |
| 63 policies | sim | tabelas, Storage e helpers | migrations atuais | ATUAL |
| 62 índices | sim estruturalmente | constraints, FKs e consultas | migrations atuais | ATUAL |
| 2 buckets | sim ou contrato atual | policies e organização | migrations atuais | ATUAL |
| 5 extensions instaladas | direta ou operacionalmente | banco/plataforma | migration/plataforma | INFRAESTRUTURA |
| Estruturas Sync v1 | não encontradas | — | — | não existem no remoto atual |

## Decisão de limpeza

Não foi criada `cleanup_legacy_previous_fixar` porque não há legado confirmado.
Criar uma migration vazia ou remover objetos atuais apenas para produzir uma
limpeza contrariaria o critério de segurança. Foi criada apenas a migration de
menor privilégio `20260827190000_reconcile_current_function_grants.sql`, sem
excluir objetos ou dados. Objetos e dados ambíguos foram mantidos.
