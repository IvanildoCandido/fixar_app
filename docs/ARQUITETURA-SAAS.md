# Arquitetura SaaS do Fixar

**Estado:** schema inicial, RLS, Storage, Auth e persistência do aplicativo implementados no projeto Supabase de desenvolvimento.

## Objetivo

O Fixar será um SaaS multiempresa. Uma pessoa pode participar de uma ou mais organizações e cada requisição de negócio deve operar no contexto explícito de uma organização ativa. Nenhuma tela ou API pode confiar apenas em filtros enviados pelo cliente para garantir isolamento.

## Estratégia de plataforma

- **Banco:** PostgreSQL gerenciado.
- **MVP recomendado:** Supabase para PostgreSQL, Auth, Row-Level Security e armazenamento de arquivos.
- **Aplicativo:** React Native mantém uma camada própria de serviços; autenticação usa o cliente Supabase e as telas de negócio usam o adaptador central em `src/services/API.ts`.
- **Monorepo incremental:** o app Expo permanece na raiz durante a migração; o painel global do proprietário vive em `apps/admin-web` e o contrato de QR Code em `packages/qr-contract`.
- **Painel do proprietário:** a primeira versão gera QR Codes localmente, sem chave administrativa ou credencial do Supabase no navegador. Métricas globais e ações privilegiadas devem passar por uma API server-side autenticada antes de serem habilitadas.
- **API:** contratos versionados em `/api/v1`; funções server-side concentram operações privilegiadas, convites, auditoria e integrações.
- **Autenticação:** e-mail/senha inicialmente, com sessão JWT curta e refresh token seguro; MFA e login social podem ser acrescentados sem alterar o domínio.
- **Autorização:** associação entre usuário e organização com papéis `owner`, `admin`, `technician` e `viewer`. Permissões finais por operação permanecem `[PENDENTE DE CONFIRMAÇÃO]`.

## Modelo inicial de dados

Todas as tabelas de negócio possuem `organization_id`, `id` UUID, `created_at`, `updated_at` e, quando necessário, `deleted_at` para exclusão lógica.

- `profiles`: perfil público associado ao usuário autenticado.
- `organizations`: empresa/tenant.
- `organization_members`: vínculo usuário–empresa, papel e status do convite.
- `customers`: clientes da organização.
- `assets`: equipamentos/ativos do cliente.
- `catalog_items`: peças e serviços reutilizáveis.
- `work_orders`: ordem de serviço, responsável, status e agenda.
- `work_order_items`: peças/serviços aplicados e valores congelados na ordem.
- `quotes`: orçamento e estado de aprovação.
- `quote_items`: peças/serviços e valores congelados no orçamento.
- `attachments`: metadados de fotos, documentos e assinaturas em storage privado.
- `technical_templates`: definições reutilizáveis de checklist e medições por organização/tipo de atendimento.
- `work_order_technical_checks`: verificações estruturadas executadas em uma ordem, com status e observação.
- `work_order_measurements`: medições técnicas extensíveis, unidade e origem manual ou calculada.
- `audit_events`: trilha imutável das operações sensíveis.

## Isolamento e segurança

1. O token identifica o usuário; a associação ativa comprova acesso à organização.
2. Políticas RLS validam `organization_members` em toda leitura e escrita.
3. `organization_id` nunca é aceito como autorização suficiente.
4. Storage usa caminhos por organização e políticas equivalentes às tabelas.
5. Tokens não são registrados em logs. Dados pessoais têm retenção e exportação ainda `[PENDENTE DE CONFIRMAÇÃO]`.
6. Chaves administrativas existem somente no servidor, nunca no aplicativo.

## Migração do legado

Não haverá conexão automática com o backend anterior. A importação futura deve ser um processo separado, idempotente, auditável e autorizado. A sessão agora usa Supabase Auth e persiste tokens no armazenamento seguro nativo; dados do legado não foram importados.

## Sequência de implementação

1. Criar ambientes isolados de homologação/produção quando necessários.
2. Consolidar o painel global do proprietário com autenticação server-side e métricas reais.
3. Criar testes negativos de isolamento com identidades fictícias.
4. Implementar convites e troca de organização ativa.
5. Evoluir a matriz de permissões de técnicos e visualizadores.
6. Acrescentar testes automatizados dos contratos de dados.
7. Acrescentar assinatura e limites de plano somente após autorização e isolamento estarem testados.
