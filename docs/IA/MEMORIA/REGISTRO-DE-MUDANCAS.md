# Registro de mudanças assistidas por IA

Este registro complementa, mas não substitui, o histórico Git.

## 2026-08-24 — Inicialização do framework Codex

- Criados `AGENTS.md` e a estrutura `docs/IA/` para orquestração, workflows, prompts, personas, gates, templates e memória.
- Personalizados contexto, estado e riscos com evidências locais do commit-base `3101700a43bd85cfebda27d9b1883aa535f47464`.
- Nenhum código funcional, dependência, configuração de runtime ou serviço externo foi alterado.
- Validação do framework: aprovada pelo `validate_framework.py` (16 arquivos Markdown).
- Verificação do projeto: `node_modules/.bin/tsc --noEmit` executado e reprovado por cinco erros preexistentes, em `DeviceItemSelect`, estilos de `Customers` e gatilhos de notificação em `Budgets`, `MultiRepair` e `Repair`.
- Higiene do diff: `git diff --check` aprovado.

## 2026-08-24 — Criação do projeto Fixar

- Copiada a base móvel legada sem seu diretório `.git`, dependências instaladas ou estado local do Expo.
- Inicializado um novo repositório Git na branch `main`, sem commits e sem remoto.
- Alterados o nome do pacote JavaScript e a identidade Expo para `fixar`/`Fixar`.
- Removidas as associações herdadas de projeto EAS e submissão iOS; novas credenciais e identificadores ainda não foram definidos.
- Registrado o objetivo de evolução multiempresa, multiusuário e assinatura futura.

## 2026-08-24 — Fundação do Fixar SaaS

- Criados sessão demonstrativa, login, contexto de empresa/usuário/papel e dashboard SaaS.
- Definida a estratégia de autenticação, banco PostgreSQL, tenancy, RLS, papéis e API em `docs/ARQUITETURA-SAAS.md`.
- Migradas marca, textos, armazenamento local e identidades nativas para Fixar; removidos ativos e fluxo de ativação legados.
- Corrigidos os cinco erros TypeScript preexistentes; `corepack yarn tsc --noEmit` aprovado.
- Projeto iOS regenerado como `Fixar`, compilado e executado no simulador `iPhone 17 Pro`.
- Adicionado workaround temporário e regenerável para a incompatibilidade entre Apple Clang 21 e o `fmt` incluído no React Native 0.76.
- Nenhuma migration, seed, deploy, publicação ou commit foi executado.

## 2026-08-24 — Schema inicial do Supabase

- Criadas e aplicadas duas migrations versionadas em `supabase/migrations/` no projeto Supabase de desenvolvimento.
- Materializadas 12 tabelas públicas, 42 políticas RLS, índices de chaves estrangeiras, helpers privados de autorização e bucket privado de anexos.
- Validada a presença de RLS em 12/12 tabelas e removidos dos helpers do Fixar os alertas de exposição `SECURITY DEFINER`.
- Nenhum usuário ou dado de negócio foi criado; o teste negativo entre tenants permanece pendente até haver identidades fictícias autorizadas.
- Advisor residual: função preexistente `public.rls_auto_enable()` exposta a papéis da API; não alterada por falta de confirmação de origem.

## 2026-08-24 — Integração do aplicativo com Supabase

- Substituída a sessão demonstrativa por cadastro/login do Supabase Auth, persistência nativa com `expo-secure-store`, logout e onboarding da primeira organização com papel `owner`.
- Substituída a API HTTP legada por adaptador Supabase para clientes, ativos, peças, serviços, ordens concluídas e orçamentos.
- Aplicada a migration `auth_onboarding`, com criação automática de perfil e associação segura do criador como owner da organização.
- Typecheck, export do bundle iOS e build/instalação no simulador aprovados.
- Teste RLS transacional com duas identidades fictícias aprovado; rollback confirmado sem dados de teste persistidos.
- Corrigido o retorno de confirmação de e-mail para o deep link `fixar://auth/callback`, com processamento da sessão no app e ação para reenvio; a URL precisa estar permitida na configuração de Auth do projeto.

## 2026-08-24 — Unificação visual das telas

- Consolidada a linguagem visual do dashboard/login nos módulos operacionais, sem alterar seus fluxos.
- Atualizados tokens de superfície/overlay, cabeçalhos, botões, campos, modais, seletores, cartões de listas e fundos das telas.
- Corrigido o formulário legado que ignorava o componente estilizado e aplicava texto de baixo contraste e borda apenas inferior.
- Typecheck e export do bundle iOS aprovados após a alteração.

## 2026-08-26 — Migration de lembretes no Supabase

- Aplicada via MCP ao projeto Supabase de desenvolvimento a migration versionada `20260826120000_work_order_reminders.sql`.
- Confirmadas as colunas opcionais `reminder_interval_days` e `reminder_due_at` em `public.work_orders`.
- Confirmados o check de intervalo positivo e o índice parcial de lembretes por responsável e vencimento.
- Nenhum seed, deploy, publicação ou commit foi executado.

## 2026-08-26 — Configuração do remoto Git

- Configurado o remoto `origin` para o repositório `IvanildoCandido/fixar_app` no GitHub via SSH.
- Nenhum fetch, push, publicação ou commit foi executado.

## 2026-08-26 — Atalho de manutenção por equipamento do cliente

- Substituído na listagem de clientes o ícone genérico de manutenção pelo mesmo ícone usado na aba de equipamentos.
- A seleção de um equipamento vinculado ao cliente agora abre uma nova manutenção com cliente e equipamento previamente selecionados.
- Typecheck e export do bundle iOS aprovados.
