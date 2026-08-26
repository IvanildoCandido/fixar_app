# FIXAR Design System

Fonte oficial de verdade para interfaces do FIXAR. O sistema busca clareza operacional, alta densidade confortável e acabamento discreto. Preservar comportamento e contratos tem prioridade sobre mudanças cosméticas.

## Compatibilidade técnica

O aplicativo usa Expo 52, React Native 0.76, React 18, React Navigation e `styled-components`. Shadcn/ui, Radix UI, Tailwind CSS e atributos ARIA são tecnologias de DOM e não são adotados no cliente nativo. Seus princípios são traduzidos para componentes React Native, propriedades `accessibility*`, foco, safe areas e tokens tipados. Inter e Lucide possuem suporte nativo e são o padrão.

## Foundations

Os tokens executáveis ficam em `src/global/styles/theme.ts`. Componentes não devem declarar uma cor, espaçamento ou tipografia quando houver token semântico equivalente.

### Cores

| Papel | Light | Dark | Uso |
|---|---|---|---|
| background | `#F6F8F7` | `#0D1411` | fundo da tela |
| foreground | `#14231D` | `#EDF4F0` | texto principal |
| surface/card | `#FFFFFF` | `#131D19` | superfícies elevadas |
| surface-muted | `#EEF3F0` | `#192620` | áreas secundárias |
| primary | `#167552` | `#48B88D` | ação principal e seleção |
| secondary | `#DDF1E8` | `#183B2E` | ação discreta |
| border | `#DCE4E0` | `#293831` | divisores e contornos |
| success | `#23845E` | `#53C795` | sucesso |
| warning | `#B7791F` | `#E6AA55` | atenção recuperável |
| danger | `#D94C4C` | `#F07979` | erro ou ação destrutiva |
| info | `#2879C7` | `#66AEEF` | informação |

Sincronização possui tokens próprios: `syncSynced`, `syncPending`, `syncSyncing`, `syncOffline`, `syncConflict` e `syncError`. Status nunca depende apenas de cor: deve combinar ícone e texto.

### Tipografia

Inter é a fonte padrão: Regular 400, Medium 500, Semibold 600 e Bold 700. Escala: display 32/40, page title 26/34, section title 18/26, heading 16/24, body 14/22, body-small 12/18, label 12/16 e caption 11/16. Mono é reservado a identificadores técnicos.

### Espaço, forma e elevação

- Espaçamento: 4, 8, 12, 16, 24, 32 e 48.
- Raios: 8, 12, 16 e 20; `pill` apenas para badges.
- Bordas: 1 px com `border`; 2 px somente para foco ou destaque necessário.
- Sombras: usar apenas em elementos flutuantes. No iOS, opacidade até 0,12 e raio até 12; no Android, elevation até 4.
- Densidade: controles de 44–48 px; conteúdo operacional usa espaço 12–16; seções usam 24–32.
- Largura máxima: 1200 px em interfaces expandidas; formulários devem preferir 560–720 px.
- Z-index: base 0, sticky 10, overlay 20, modal 30 e toast 40.

### Responsividade

`compact` é menor que 600 px, `medium` vai de 600 a 1023 px e `expanded` começa em 1024 px. Compact usa navegação inferior e listas em cartões. Medium pode usar duas colunas. Expanded pode usar sidebar e tabela, caso uma futura experiência web/tablet justifique; não se deve apenas ampliar a UI móvel.

### Movimento e interação

Tempos: 120 ms para feedback imediato, 180 ms para transições comuns e 250 ms para overlays. Estados obrigatórios: default, pressed/hover quando disponível, focus, selected, disabled, loading e error. Respeitar reduced motion quando a API/plataforma disponibilizar. Alvo mínimo de toque: 44×44 px.

## Componentes

Primitivos implementados e exportados por `src/design-system`: `Button`, `Card`, `FormField`, `FormModal`, `PickerModal`, `SearchInput`, `Spinner`, `EmptyState`, `ErrorState` e `SyncBadge`. Eles são a base para novas telas.

- Button: variantes primary, secondary, ghost e destructive; suporta loading e disabled.
- FormField: label visível, obrigatório, erro próximo ao campo e semântica de acessibilidade.
- FormModal: título, descrição, fechar, corpo rolável e rodapé fixo; é obrigatório para formulários compactos em overlay.
- SyncBadge: estados synced, pending, syncing, offline, conflict e error com ícone, texto e cor.
- Feedback: skeleton no primeiro carregamento quando a estrutura é conhecida; spinner em ação curta; empty/error para estados finais.

Componentes ainda não necessários ao produto (combobox, radio group, command palette, data table, pagination, file upload, context menu e breadcrumb) não devem ser criados sem caso real. Quando necessários, devem compor estes tokens e contratos, não uma segunda biblioteca visual.

## Navegação, listas e formulários

- Mobile mantém bottom navigation com cinco destinos principais, safe area e labels sempre visíveis.
- Uma ação primária por contexto. Ações destrutivas exigem variante danger e confirmação quando irreversíveis.
- Listas compactas usam título, metadados, status e ação de linha; no mobile, não usar tabela horizontal extensa.
- Linhas operacionais usam `ListCard`, `ListContent`, `ListTitle`, `ListMeta` e `IconAction`; ações devem ter alvo mínimo de 44 px, label acessível e danger reservado a excluir.
- Busca e filtros ficam próximos da lista e mantêm estado de loading, vazio e erro.
- Labels ficam acima dos campos. Erro aparece junto ao campo; toast não substitui validação.
- Modal compacto usa Dialog; fluxo longo ou formulário extenso deve ser tela/Sheet, com título, cancelar e salvar consistentes.
- Leitura de QR/código de barras usa câmera em tela inteira, instrução curta, moldura central, fechamento no topo e estado explícito de permissão.

## Offline e sincronização

`SyncBadge` apresenta o estado por registro. Um futuro `OfflineBanner` deve aparecer no topo apenas quando houver evidência real de conectividade; não inferir offline de uma falha genérica. `ConflictAlert` deve explicar conflito e oferecer resolução. `PendingChangesIndicator` deve informar quantidade quando a camada de persistência expuser esse dado. A UI atual não implementa um motor de sincronização; os componentes são linguagem visual, não estado de negócio fictício.

## Tema escuro e acessibilidade

O tema segue o sistema por padrão e a preferência explícita é persistida. Superfícies, bordas, overlays e status possuem cores próprias no dark mode. Todo ícone acionável deve ter label, controles devem informar role/estado e textos manter contraste. Não remover outline/foco no web. Testar leitor de tela, tamanho de fonte, teclado e contraste antes de declarar uma tela concluída.

## Estratégia de migração

1. Foundations e temas — implementado.
2. Primitivos e feedback — implementado como núcleo inicial.
3. Layout e navegação — migrar tokens e Lucide sem alterar rotas.
4. Autenticação e formulários — substituir estilos duplicados por FormField/Button.
5. Listas e modais — unificar estados e hierarquia.
6. Sync/offline — conectar componentes somente quando existir fonte de estado real.
7. Tablet/desktop — validar por breakpoint antes de introduzir sidebar/tabelas.

## Checklist de UI

- Usa somente tokens e componentes existentes ou documenta a lacuna.
- Funciona em light/dark e nos breakpoints aplicáveis.
- Possui loading, vazio, erro e disabled quando aplicável.
- Tem labels, contraste, foco e alvos de toque adequados.
- Não altera regra de negócio, API ou persistência por estética.
- Passa no TypeScript e no bundle das plataformas afetadas.
