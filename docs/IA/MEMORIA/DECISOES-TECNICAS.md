# Decisões técnicas

Registre somente decisões aceitas. Propostas permanecem explicitamente identificadas como propostas.

## 2026-08-24 — Fundação SaaS multiempresa

- PostgreSQL será a fonte de verdade; Supabase é a plataforma recomendada para o MVP por reunir Auth, Postgres, RLS e Storage.
- Toda entidade de negócio pertencente a uma empresa terá `organization_id`; acesso será autorizado pela associação ativa em `organization_members` e reforçado por RLS.
- Papéis iniciais: `owner`, `admin`, `technician` e `viewer`. A matriz detalhada de permissões permanece `[PENDENTE DE CONFIRMAÇÃO]`.
- O aplicativo consumirá contratos versionados sob `/api/v1`; acesso direto irrestrito ao banco não será usado.
- A sessão local atual é apenas um adaptador demonstrativo e deverá ser substituída pelo provedor de identidade sem alterar a navegação principal.

Detalhamento e modelo inicial: `docs/ARQUITETURA-SAAS.md`.

## 2026-08-28 — Offline restrito a manutenções individuais

- O primeiro suporte offline não replica o Supabase: persiste somente rascunhos e manutenções individuais ainda não confirmadas pelo servidor.
- `AsyncStorage`, já presente no aplicativo, guarda um payload estruturado completo com snapshots mínimos de cliente/equipamento e assinaturas SVG; registros são segmentados por `user_id` e `organization_id`.
- Cada manutenção recebe `local_id` UUID. A RPC `create_work_order_offline` usa esse identificador com unicidade por organização e grava OS, itens, checks e medições em uma única transação.
- Após confirmação do servidor o registro local é removido. Falha ou resposta perdida preserva o payload para repetição idempotente.
- Clientes, equipamentos, catálogo, anexos, ordens em lote e sincronização multi-device permanecem fora do escopo offline.

## 2026-08-28 — QR público pertencente à organização

- O QR público usa uma tabela de vínculo separada, token UUID aleatório estável e consulta desativada por padrão; o UUID interno do equipamento não aparece na URL.
- A leitura anônima ocorre somente pela RPC minimizada `get_public_equipment`; tabelas de equipamento, ordens e vínculos não recebem leitura anônima ampla.
- O QR público por URL permanece separado do QR interno de referência. Uma futura transferência autorizada poderá reposicionar o vínculo preservando o token, sem deduplicação ou transferência nesta V1.
