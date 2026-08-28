# Registro de mudanças assistidas por IA

Este registro complementa, mas não substitui, o histórico Git.

## 2026-08-28 — QR Code público de equipamentos

- Criado vínculo multiempresa com token não enumerável, desativado por padrão, revogável e rotacionável, sem liberar leitura anônima das tabelas de negócio.
- O app ganhou modal para ativar, exibir, compartilhar e imprimir o QR público; o QR interno foi preservado separadamente.
- O painel web ganhou rota `/e/:token`, ficha mobile-first, histórico resumido, próxima manutenção e WhatsApp opcional, com `noindex` e resposta genérica de indisponibilidade.
- Typecheck nativo/web, 15 testes, build Vite e `git diff --check` foram aprovados. As migrations foram aplicadas e validadas no Supabase de desenvolvimento com rollback dos dados de teste.
- Adicionada configuração versionada da Vercel para publicar dashboard e ficha pública no mesmo SPA, com build do monorepo, rewrite de `/e/:token`, cache de assets e headers defensivos.
- A configuração passou a aceitar também projetos Vercel com Root Directory em `apps/admin-web`, incluindo manifesto local e alias compatível com o comando observado no primeiro build remoto.
- O pacote TypeScript compartilhado `packages/qr-contract` recebeu `tsconfig` independente, evitando que builds web focados tentem resolver a configuração Expo da raiz.
- Corrigido o grant do helper `private.is_platform_admin()` usado pelas policies de QR do painel; a ausência de `EXECUTE` causava `403` e fazia o dashboard descartar também as métricas carregadas com sucesso.
- Finalizado o dashboard global: menu e indicadores navegáveis, organizações e usuários reais, contagens operacionais por empresa, geração sequencial de referências, associação/filtro/exclusão de QR Codes e configurações do ambiente.
- Aplicada a migration `complete_platform_admin_dashboard`; validação com rollback confirmou leitura e escrita administrativa e bloqueio de usuário comum. Build Vite e 18 testes foram aprovados.

## 2026-08-28 — Offline simples para manutenção individual

- Adicionado autosave local com debounce e flush ao sair/colocar o app em background, preservando formulário técnico e assinaturas.
- Histórico e Home passaram a mostrar rascunhos e pendências isolados por usuário/organização, com edição, exclusão local e sincronização manual.
- O app tenta reenviar pendências ao iniciar, voltar ao foreground e abrir o histórico, sem serviço permanente em background.
- Aplicada a migration `20260828120000_offline_maintenance_idempotency.sql`, com UUID local único e RPC transacional para OS, itens, checks e medições.
- Teste remoto com rollback confirmou idempotência, filhos completos, atomicidade e negação sem associação; Typecheck, 15 testes locais e bundle iOS também foram aprovados. Validação em dispositivo físico permanece pendente.

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

## 2026-08-26 — Manutenção técnica estruturada e relatório A4

- Aplicada no Supabase de desenvolvimento a migration `20260826180000_technical_maintenance.sql`, com características técnicas do equipamento, dados de diagnóstico/resultado/assinaturas, templates e tabelas extensíveis de verificações e medições protegidas por RLS.
- A manutenção individual passou a usar seções recolhíveis, checklist rápido e contextual, observações condicionais, medições com unidade e ΔT calculado, quantidades de materiais, resultado, recomendação e assinaturas desenhadas.
- O relatório individual foi reconstruído em cards A4 dinâmicos, sem fotos ou QR público, ocultando seções opcionais vazias e preservando uma página nos cenários simples e completo de teste.
- Adicionadas fixtures do SC-0101 e de manutenção completa fictícia, testes automatizados, geração de PDFs e inspeção visual renderizada.
- Typecheck, cinco testes, dois PDFs de uma página e export do bundle iOS aprovados.

## 2026-08-26 — Correção de nova ordem e padronização dos relatórios

- Corrigida a falha de renderização ao abrir uma nova ordem antes da montagem dos campos monetários, incluindo valores em formato brasileiro.
- Unificados relatório individual, consolidado de múltiplas manutenções e orçamento em um mesmo layout A4 baseado no modelo visual fornecido, preservando as diferenças de conteúdo de cada documento.
- Adicionados testes de regressão do cálculo inicial e do contrato visual comum aos três modelos.
- Typecheck, sete testes, export iOS e quatro PDFs de uma página foram aprovados; os quatro renders foram inspecionados visualmente sem cortes ou sobreposição.

## 2026-08-27 — Atalhos da Home, rolagem e captura de assinatura

- Os indicadores da Home passaram a abrir os fluxos correspondentes e cada lembrete inicia uma manutenção com cliente e equipamento previamente selecionados.
- Home, peças, equipamentos, serviços e clientes retornam ao topo sempre que a tela recupera foco após troca de aba ou retorno.
- A captura de assinatura passou a suspender a rolagem durante o traço, recusar transferência indevida do gesto e usar a largura medida do quadro.
- Typecheck, sete testes, export do bundle iOS e geração dos quatro PDFs em uma página foram aprovados.

## 2026-08-27 — Assinatura em tela cheia horizontal

- O quadro compacto de assinatura passou a funcionar como prévia e acionador de uma captura em tela cheia no modo horizontal.
- A captura ampliada oferece limpar, cancelar sem perder a assinatura anterior e confirmar; ao fechar, o aplicativo restaura retrato e a rolagem do formulário.
- Adicionado `expo-screen-orientation` compatível com o Expo SDK 54.
- Typecheck, sete testes e export do bundle iOS foram aprovados.

## 2026-08-27 — Simplificação da Home

- Removida a seção `Hoje`, que mostrava indicadores fixos ou sem listagens próprias e duplicava destinos das ações rápidas.
- A Home passou a começar pelas próximas manutenções, seguida das ações rápidas com fluxos reais e distintos.

## 2026-08-27 — Acordeão guiado no cadastro de manutenção

- As nove seções do formulário de manutenção passaram a compartilhar um único estado de expansão; abrir uma seção fecha automaticamente a anterior.
- Depois da recomposição do layout, a seção aberta é rolada suavemente para perto do topo, mantendo cabeçalho e conteúdo em evidência.
- `Diagnóstico`, primeira etapa do fluxo técnico, é a seção aberta inicialmente.
- Typecheck, sete testes e export do bundle iOS foram aprovados.

## 2026-08-27 — Quantidades e observações no orçamento

- Serviços e materiais selecionados passam a entrar com quantidade mínima 1 e controles acessíveis de menos/mais, sem digitação manual.
- Quantidade, subtotal por item e total geral são recalculados imediatamente, preservando quantidades existentes ao adicionar novos itens.
- Adicionado campo visível de observações, persistido nas notas do orçamento e apresentado no PDF.
- O PDF de orçamento passou a detalhar também descontos e acréscimos; typecheck, oito testes, uma página renderizada e export iOS foram aprovados.
- Ao tocar em menos quando a quantidade já é 1, o formulário confirma e remove o item diretamente, sem exigir retorno ao seletor.

## 2026-08-27 — Paginação, cache e gravação de ordens em lote

- O histórico deixou de baixar milhares de ordens completas: passou a carregar resumos em páginas de 20, filtrar no servidor e buscar relações, itens, verificações e medições somente quando necessários para relatórios.
- Criada uma listagem paginada de lembretes com filtros por vencidas, hoje e próximos sete dias; a Home consulta apenas os cinco primeiros registros e mostra acesso ao total.
- Adicionado cache em memória com TTL, deduplicação de chamadas concorrentes, invalidação por recurso e métricas de consulta para clientes, equipamentos, catálogo, relatórios e páginas operacionais.
- Listas de clientes, equipamentos, peças e serviços mantêm os dados durante revisitas e oferecem atualização explícita por gesto, reduzindo recargas visuais e tráfego redundante.
- Ordens em lote passaram de uma requisição por equipamento para a RPC transacional `create_work_orders_batch`.
- Aplicada e validada via MCP a migration `20260827130000_performance_and_batch_orders.sql`, com cinco índices voltados a histórico, filtros, lembretes e catálogo; o projeto remoto tinha 3.175 ordens no momento da auditoria.
- Typecheck, dez testes automatizados, verificação de diff e export do bundle iOS foram aprovados.

## 2026-08-27 — Identificação guiada na nova manutenção

- A primeira etapa da ordem passou a oferecer duas entradas equivalentes: leitura do QR Code ou seleção pesquisável de cliente e equipamento.
- A busca de equipamentos do cliente é filtrada no Supabase e armazenada no cache por organização/cliente, sem baixar todos os equipamentos a cada abertura.
- Ao trocar de cliente, um equipamento incompatível é limpo; após escolher ou ler um equipamento, o diagnóstico abre e é reposicionado automaticamente.
- A finalização bloqueia ordens sem cliente/equipamento e retorna a tela para a etapa de identificação.
- O recolhimento de cada etapa passou a avançar automaticamente para a próxima seção e posicioná-la no topo, mantendo o fechamento normal ao final de `Assinaturas`.

## 2026-08-27 — Hardening PostgreSQL multiempresa

- Aplicada no Supabase de desenvolvimento a migration incremental `20260827180000_security_audit_hardening.sql`, sem alterar migrations anteriores nem reescrever dados.
- Corrigida a RPC transacional `create_work_orders_batch` para usar `private.has_organization_role`, preservando `SECURITY INVOKER`, `search_path` vazio e execução autenticada.
- Adicionada validação de referências de usuário por organização em ordens, anexos, convites e auditoria, exigindo associação ativa nas referências operacionais e preservando o histórico após suspensão ou remoção do membro.
- Removida a execução direta de `public.rls_auto_enable()` pelos papéis da API sem desativar o event trigger `ensure_rls`; também foram removidos grants anônimos das tabelas técnicas e da RPC em lote.
- Teste transacional remoto com rollback confirmou lote múltiplo, atomicidade, isolamento de leitura/escrita, negação cross-tenant, preservação histórica, ausência de grants anônimos e RLS automático em tabela pública nova.
- O Security Advisor deixou de reportar os dois alerts de função `SECURITY DEFINER`; permanece apenas a proteção contra senhas vazadas, indisponível no plano Free observado e dependente de ação manual após mudança para Pro ou superior.
- O worktree não contém implementação de Sync v1; por isso não foi possível executar regressão de SQLite, Outbox, push/pull ou convergência.

## 2026-08-27 — Reconciliação do Supabase reutilizado

- Confirmado que existiu um repositório FIXAR anterior, abandonado, e que o repositório atual é uma reconstrução limpa que reutiliza o mesmo projeto Supabase.
- Inventariados objetos públicos/privados, funções, triggers, policies, índices, Storage, Auth agregado, extensions, migrations, tamanhos e dependências remotas.
- As 15 tabelas públicas, nove funções da aplicação, 21 triggers, 63 policies, 62 índices, sete enums e dois buckets correspondem às migrations ou contratos atuais; `rls_auto_enable` e os event triggers restantes foram classificados como infraestrutura ativa.
- Não foram encontradas tabelas, colunas, funções, RPCs, triggers, índices, publication ou Edge Function do antigo Sync v1.
- As 3.175 OS e seus 3.470 itens foram preservados porque o histórico confirma importação deliberada da API legada do Soilucenter para a base de desenvolvimento atual.
- Nenhum objeto atingiu a classificação `LEGADO CONFIRMADO`; por segurança, nenhuma migration de limpeza, exclusão ou compactação foi executada.
- Inventário recuperável registrado em `docs/IA/AUDITORIAS/RECONCILIACAO-SUPABASE-2026-08-27.md`.
