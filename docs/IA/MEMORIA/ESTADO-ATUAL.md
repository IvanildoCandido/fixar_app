# Estado atual

**Snapshot observado:** `2026-08-27`
**Branch observada:** `main`  
**Commit-base observado:** repositório novo, ainda sem commits

Este documento descreve o worktree observado, não produção.

## Trabalho ativo

- Framework documental de engenharia assistida por IA instalado e personalizado no worktree.
- Projeto copiado para uma nova raiz como `Fixar`, com repositório Git independente na branch `main` e remoto `origin` configurado para o repositório `IvanildoCandido/fixar_app` no GitHub.
- Existiu um repositório FIXAR anterior, depois abandonado. O repositório atual é uma reconstrução limpa, mas reutiliza o projeto Supabase; o código e as migrations atuais são a fonte da verdade para funcionalidades da aplicação.
- Versão declarada do aplicativo: `2.0.1` (`package.json` e `app.json`); runtime atualizado para Expo SDK 54, React Native 0.81 e React 19.1.
- Supabase Auth integrado com cadastro, login, confirmação de e-mail, sessão em armazenamento seguro nativo, onboarding de organização/owner e logout.
- Estratégia de backend definida em `docs/ARQUITETURA-SAAS.md`: PostgreSQL, autenticação gerenciada, isolamento por `organization_id`, RLS e API versionada.
- Schema aplicado ao projeto Supabase de desenvolvimento e versionado em `supabase/migrations/`: 15 tabelas públicas com RLS, referências multiempresa compostas e bucket privado para anexos.
- Clientes, ativos, catálogo, ordens concluídas e orçamentos usam a persistência Supabase por meio do adaptador central das telas.
- Identidade Expo e nativa migrada para Fixar (`app.fixar.mobile`); referências da marca anterior removidas do código, ativos e documentação.
- FIXAR Design System documentado em `docs/design/DESIGN_SYSTEM.md`, com tokens tipados, paletas light/dark, Inter, Lucide e preferência de tema persistida.
- Núcleo nativo de componentes criado (`Button`, `Card`, `FormField`, `SearchInput`, `PickerModal`, `Spinner`, `EmptyState`, `ErrorState` e `SyncBadge`); Home, autenticação, carregamento global e navegação principal iniciaram a migração.
- Seleção de clientes agora usa bottom sheet pesquisável, lista virtualizada, contagem e estados de loading/erro/vazio; buscas também foram adicionadas às telas de clientes, equipamentos, peças e serviços.
- Seletores de equipamentos, peças, serviços e equipamentos em lote também usam o padrão pesquisável; login passou a ter hierarquia explícita entre ações primária, secundária e textual.
- Cartões das listagens de clientes, equipamentos, peças e serviços compartilham primitivas e ações acessíveis; scanner QR foi refeito como câmera em tela inteira com enquadramento e estado de permissão.
- Na listagem de clientes, a ação de equipamentos usa o mesmo ícone da aba correspondente e a seleção de um equipamento inicia uma manutenção com cliente e equipamento já preenchidos.
- Formulários modais de cliente, equipamento, peça e serviço, além de calendário e filtros, compartilham `FormModal`; estilos das telas de ordem, orçamento e ordem em lote foram consolidados. Material Icons e `RFValue` deixaram de ser usados na UI React Native.
- Cabeçalhos operacionais deixaram de renderizar ações vazias e agora exibem retorno com contraste explícito. Manutenção individual, manutenção em lote e orçamento compartilham também a hierarquia revisada de cartões, seletores com contagem/estado vazio, observações, totais e ações.
- Typecheck aprovado e aplicativo compilado, instalado e aberto no simulador iOS `iPhone 17 Pro`.
- Base de testes da API legada do Soilucenter importada na organização de desenvolvimento existente: 14 clientes importados (15 com o registro de teste preexistente), 155 equipamentos, 70 serviços, 78 peças, 3.173 ordens concluídas e 3.467 itens de ordem. A verificação pós-carga encontrou zero vínculos órfãos entre clientes, equipamentos, ordens, itens e catálogo.
- A importação incluiu serviços históricos referenciados por ordens que já não existiam no catálogo atual. Cinquenta e oito totais legados negativos foram normalizados para zero para atender às restrições do schema, com o valor original preservado nas observações da respectiva ordem; não havia preços negativos nos itens.
- Atualização do Expo executada incrementalmente de 52 para 53 e 54, com npm consolidado como gerenciador, projetos nativos sincronizados e Pods iOS atualizados. A arquitetura legada foi preservada; por isso o projeto usa Reanimated 3.19, compatível com React Native 0.81, em vez do Reanimated 4 exclusivo da Nova Arquitetura.
- Crash nativo `Property 'document' doesn't exist` após a atualização foi eliminado migrando `styled-components` 5 para 6 e consolidando todos os imports no entrypoint nativo; TypeScript e export do bundle iOS foram validados sem erros.
- A listagem de serviços realizados mantém a ação de relatório visível após aplicar filtros, informa quantidade de resultados e estado de geração, trata falhas de PDF/compartilhamento e diferencia corretamente filtro vazio de ausência de filtro.
- Relatórios de manutenção, consolidados e orçamentos usam identidade visual da organização ativa, sem dados da empresa-modelo. Owners/admins podem editar dados empresariais e carregar a logomarca da galeria; o bucket público `organization-logos` limita imagens a 2 MB e grava arquivos em caminhos isolados por organização.
- Cabeçalhos dos documentos A4 usam hierarquia própria para logo, identidade e dados empresariais rotulados. Telas com entrada de texto compartilham proteção de teclado com viewport ajustável, rolagem interativa e espaço inferior seguro, incluindo autenticação, onboarding, perfil empresarial, formulários modais, ordens, orçamentos e seletores.
- Manutenções individuais e em lote permitem definir o prazo do próximo atendimento em dias. O vencimento e o usuário responsável são persistidos na ordem, a Home lista até cinco lembretes do usuário autenticado e o dispositivo agenda uma notificação local para a data escolhida. A migration `20260826120000_work_order_reminders.sql` foi aplicada e validada no projeto Supabase de desenvolvimento.
- Manutenções individuais possuem preenchimento técnico progressivo por seções recolhíveis: diagnóstico, serviços, checklist dinâmico, medições com ΔT calculado, materiais com quantidade, resultado, recomendações, observações, valores, próxima manutenção e assinaturas desenhadas.
- Características técnicas reutilizáveis passaram a pertencer ao equipamento; verificações, medições, diagnóstico, resultado e assinaturas são persistidos de forma estruturada na ordem. A migration `20260826180000_technical_maintenance.sql` foi aplicada e validada no Supabase de desenvolvimento.
- Relatório individual, consolidado de múltiplas manutenções e orçamento compartilham o mesmo layout A4 baseado na referência visual, com cabeçalho, cards, assinaturas, faixa institucional e rodapé padronizados; quatro fixtures foram verificadas em uma página e inspecionadas visualmente.
- A abertura de nova ordem não depende mais da montagem prévia dos campos monetários; o cálculo aceita refs ainda nulas e valores formatados em pt-BR.
- A Home prioriza próximas manutenções e ações rápidas reais, sem indicadores fixos ou duplicados; lembretes iniciam a manutenção com cliente/equipamento preenchidos, e Home/listas das cinco abas retornam ao topo ao recuperar foco.
- A captura de assinatura abre um modal em tela cheia horizontal, usa toda a área disponível e oferece limpar, cancelar e confirmar; a orientação e a rolagem do formulário são restauradas ao fechar.
- As seções do cadastro de manutenção funcionam como acordeão exclusivo: abrir uma fecha as demais e reposiciona suavemente a seção ativa próxima ao topo.
- Orçamentos iniciam serviços e materiais selecionados com quantidade 1, usam controles de incremento/decremento e confirmam a remoção ao reduzir um item que está em 1; aceitam observações e levam quantidades, ajustes e notas ao PDF.
- Histórico de manutenções e lembretes usam paginação no servidor; filtros de cliente, equipamento e período são aplicados no Supabase, e detalhes pesados só são consultados ao gerar/abrir um relatório.
- Consultas estáveis de clientes, equipamentos, catálogo, perfil da empresa e páginas operacionais têm cache com TTL, deduplicação de requisições simultâneas, invalidação após escrita e métricas locais; listas de cadastro aceitam atualização manual sem piscar a tela a cada foco.
- Ordens em lote são gravadas pela RPC transacional `create_work_orders_batch`, substituindo várias chamadas sequenciais. A migration `20260827130000_performance_and_batch_orders.sql` foi aplicada no Supabase de desenvolvimento com índices para histórico, filtros, lembretes e catálogo.
- A migration `20260827180000_security_audit_hardening.sql` corrigiu a RPC em lote para usar o helper privado de autorização, removeu execução anônima e endureceu referências de usuário por organização sem apagar histórico. O event trigger automático de RLS foi preservado sem execução direta pelos papéis da API; os alerts correspondentes do advisor foram eliminados.
- Nova manutenção começa pela identificação do atendimento: permite ler o QR Code ou pesquisar cliente e, em seguida, consultar somente os equipamentos daquele cliente. O diagnóstico permanece recolhido até existir equipamento selecionado e então abre com reposicionamento automático.
- O formulário técnico avança sequencialmente: recolher a seção aberta fecha a etapa atual, abre a próxima e a reposiciona no topo; a última seção pode ser fechada sem reiniciar o fluxo.

## Limitações da descoberta

- O estado remoto foi verificado após as migrations, mas depende do serviço externo; os contratos versionados estão em `supabase/migrations/`.
- Há testes automatizados locais para cálculos e composição dinâmica do relatório técnico; CI ainda não foi configurada.
- O gerenciador de pacotes canônico é npm; `package-lock.json` é o único lockfile mantido.
- Não existe implementação de Sync v1 no worktree observado: SQLite, Outbox, `mutation_id`, `record_version`, push/pull e recuperação `IN_FLIGHT` não estão presentes. Os estados de sync existentes são somente componentes visuais.
- Convites, troca entre múltiplas organizações, upload de anexos e matriz detalhada de permissões ainda precisam ser implementados no aplicativo.
- A migração visual é incremental: telas operacionais ainda usam componentes legados; estados de sync são apenas componentes visuais até existir uma fonte real de sincronização/offline.
- Configuração de publicação e credenciais EAS permanecem pendentes.
- Os índices novos ainda precisam acumular tráfego real antes de uma comparação confiável de uso pelo advisor; o linter os classifica como não utilizados imediatamente após sua criação, o que é esperado.
- O lembrete de manutenção usa notificação local do dispositivo. Push remoto para outros aparelhos ainda exige persistência de Expo Push Tokens, serviço emissor e agendamento seguro no backend `[PENDENTE DE CONFIRMAÇÃO]`.
- A proteção contra senhas vazadas do Supabase Auth permanece desativada. O recurso exige plano Pro ou superior, enquanto a organização observada usa o plano Free; habilitação depende de mudança de plano e configuração manual em Auth.
- A reconciliação completa de 2026-08-27 não encontrou tabelas, funções, RPCs, triggers, policies, índices, buckets ou estruturas de Sync v1 comprovadamente legadas. Nenhum objeto ou dado foi removido; inventário em `docs/IA/AUDITORIAS/RECONCILIACAO-SUPABASE-2026-08-27.md`.
