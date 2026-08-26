# Decisões técnicas

Registre somente decisões aceitas. Propostas permanecem explicitamente identificadas como propostas.

## 2026-08-24 — Fundação SaaS multiempresa

- PostgreSQL será a fonte de verdade; Supabase é a plataforma recomendada para o MVP por reunir Auth, Postgres, RLS e Storage.
- Toda entidade de negócio pertencente a uma empresa terá `organization_id`; acesso será autorizado pela associação ativa em `organization_members` e reforçado por RLS.
- Papéis iniciais: `owner`, `admin`, `technician` e `viewer`. A matriz detalhada de permissões permanece `[PENDENTE DE CONFIRMAÇÃO]`.
- O aplicativo consumirá contratos versionados sob `/api/v1`; acesso direto irrestrito ao banco não será usado.
- A sessão local atual é apenas um adaptador demonstrativo e deverá ser substituída pelo provedor de identidade sem alterar a navegação principal.

Detalhamento e modelo inicial: `docs/ARQUITETURA-SAAS.md`.
