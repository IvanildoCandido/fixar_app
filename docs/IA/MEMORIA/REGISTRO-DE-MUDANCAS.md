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
