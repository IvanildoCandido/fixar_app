# Estado atual

**Snapshot observado:** `2026-08-26`  
**Branch observada:** `main`  
**Commit-base observado:** repositório novo, ainda sem commits

Este documento descreve o worktree observado, não produção.

## Trabalho ativo

- Framework documental de engenharia assistida por IA instalado e personalizado no worktree.
- Projeto copiado para uma nova raiz como `Fixar`, com repositório Git independente na branch `main`, sem remoto.
- Versão declarada do aplicativo: `2.0.1` (`package.json` e `app.json`); runtime atualizado para Expo SDK 54, React Native 0.81 e React 19.1.
- Supabase Auth integrado com cadastro, login, confirmação de e-mail, sessão em armazenamento seguro nativo, onboarding de organização/owner e logout.
- Estratégia de backend definida em `docs/ARQUITETURA-SAAS.md`: PostgreSQL, autenticação gerenciada, isolamento por `organization_id`, RLS e API versionada.
- Schema inicial aplicado ao projeto Supabase de desenvolvimento e versionado em `supabase/migrations/`: 12 tabelas públicas com RLS, 43 políticas, referências multiempresa compostas e bucket privado para anexos.
- Clientes, ativos, catálogo, ordens concluídas e orçamentos usam a persistência Supabase por meio do adaptador central das telas.
- Identidade Expo e nativa migrada para Fixar (`app.fixar.mobile`); referências da marca anterior removidas do código, ativos e documentação.
- FIXAR Design System documentado em `docs/design/DESIGN_SYSTEM.md`, com tokens tipados, paletas light/dark, Inter, Lucide e preferência de tema persistida.
- Núcleo nativo de componentes criado (`Button`, `Card`, `FormField`, `SearchInput`, `PickerModal`, `Spinner`, `EmptyState`, `ErrorState` e `SyncBadge`); Home, autenticação, carregamento global e navegação principal iniciaram a migração.
- Seleção de clientes agora usa bottom sheet pesquisável, lista virtualizada, contagem e estados de loading/erro/vazio; buscas também foram adicionadas às telas de clientes, equipamentos, peças e serviços.
- Seletores de equipamentos, peças, serviços e equipamentos em lote também usam o padrão pesquisável; login passou a ter hierarquia explícita entre ações primária, secundária e textual.
- Cartões das listagens de clientes, equipamentos, peças e serviços compartilham primitivas e ações acessíveis; scanner QR foi refeito como câmera em tela inteira com enquadramento e estado de permissão.
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

## Limitações da descoberta

- O estado remoto foi verificado após as migrations, mas depende do serviço externo; os contratos versionados estão em `supabase/migrations/`.
- Não há testes automatizados nem CI visíveis para caracterizar o comportamento atual.
- O gerenciador de pacotes canônico é npm; `package-lock.json` é o único lockfile mantido.
- Convites, troca entre múltiplas organizações, upload de anexos e matriz detalhada de permissões ainda precisam ser implementados no aplicativo.
- A migração visual é incremental: telas operacionais ainda usam componentes legados; estados de sync são apenas componentes visuais até existir uma fonte real de sincronização/offline.
- Configuração de publicação e credenciais EAS permanecem pendentes.
- O lembrete de manutenção usa notificação local do dispositivo. Push remoto para outros aparelhos ainda exige persistência de Expo Push Tokens, serviço emissor e agendamento seguro no backend `[PENDENTE DE CONFIRMAÇÃO]`.
