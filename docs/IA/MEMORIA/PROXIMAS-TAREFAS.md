# Próximas tarefas

**Atualizado em:** `2026-08-29`

## Objetivo confirmado

Evoluir o Fixar para um produto multiempresa e multiusuário, com possibilidade de assinatura futura.

## Sequência proposta

1. Publicar o app e dashboard atualizados e validar o mesmo QR público na câmera comum e no scanner FIXAR em aparelho físico, incluindo tentativa cross-tenant.
2. Validar offline em aparelho físico: recuperação após encerramento, assinaturas, edição/exclusão local, logout entre usuários, resposta perdida, sincronização manual/automática e PDF local.
3. Testar login, geração, persistência e recarga de QR Code no `apps/admin-web` com a conta global.
4. Implementar API administrativa para métricas de banda e demais limites que não são expostos pelo cliente público.
5. Validar em dispositivo físico o novo formulário técnico, captura de assinaturas, geração/compartilhamento do PDF, Home e notificação local, incluindo permissão negada e fluxos em lote.
6. Confirmar se lembretes precisam de push remoto para aparelhos diferentes; em caso positivo, definir atribuição do técnico, ciclo do token, emissor backend e política de reenvio.
7. Medir em uso real taxa de acerto do cache, tempo de consulta e planos SQL depois que os índices novos acumularem tráfego; ajustar TTL e índices somente com evidência.
8. Validar listas extensas e carregamento incremental em aparelho físico, incluindo redes lentas, retomada do app e atualização manual.
9. Definir a matriz detalhada de permissões de `technician` e `viewer`.
10. Implementar convites e troca entre organizações no aplicativo.
11. Implementar upload privado de anexos e auditoria das operações sensíveis.
12. Substituir o restante do adaptador de compatibilidade por contratos de domínio tipados e ampliar os testes de integração.
13. Definir planos e integração de assinatura somente após a base multiempresa estar validada.
14. Ao avaliar plano Pro ou superior para o Supabase, habilitar manualmente a proteção contra senhas vazadas em Auth e confirmar a remoção do alerta no Security Advisor.
