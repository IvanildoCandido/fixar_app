# Próximas tarefas

**Atualizado em:** `2026-09-02`

## Objetivo confirmado

Evoluir o Fixar para um produto multiempresa e multiusuário, com possibilidade de assinatura futura.

## Sequência proposta

1. Validar RLS cross-tenant e permissões de owner/admin/technician/viewer no fluxo remoto de reserva e vínculo antes de publicar a área de etiquetas.
2. Validar em aparelhos físicos os PDFs 50 × 30, 60 × 40, 80 × 50 mm e A4, com impressão em escala 100%, lotes grandes, logo disponível/indisponível e comparação do mesmo token no mobile, painel e página pública.
3. Publicar o app e dashboard atualizados e validar o mesmo QR público na câmera comum e no scanner FIXAR em aparelho físico, incluindo tentativa cross-tenant.
4. Validar offline em aparelho físico: recuperação após encerramento, assinaturas, edição/exclusão local, logout entre usuários, resposta perdida, sincronização manual/automática e PDF local.
5. Testar login, geração, persistência e recarga de QR Code no `apps/admin-web` com a conta global.
6. Implementar API administrativa para métricas de banda e demais limites que não são expostos pelo cliente público.
7. Validar em dispositivo físico o novo formulário técnico, captura de assinaturas, geração/compartilhamento do PDF, Home e notificação local, incluindo permissão negada e fluxos em lote.
8. Confirmar se lembretes precisam de push remoto para aparelhos diferentes; em caso positivo, definir atribuição do técnico, ciclo do token, emissor backend e política de reenvio.
9. Medir em uso real taxa de acerto do cache, tempo de consulta e planos SQL depois que os índices novos acumularem tráfego; ajustar TTL e índices somente com evidência.
10. Validar listas extensas e carregamento incremental em aparelho físico, incluindo redes lentas, retomada do app e atualização manual.
11. Definir a matriz detalhada de permissões de `technician` e `viewer`.
12. Implementar convites e troca entre organizações no aplicativo.
13. Implementar upload privado de anexos e auditoria das operações sensíveis.
14. Substituir o restante do adaptador de compatibilidade por contratos de domínio tipados e ampliar os testes de integração.
15. Definir checkout, gateway e integração real de assinatura somente após a camada comercial visível e a base multiempresa estarem validadas em uso.
16. Ao avaliar plano Pro ou superior para o Supabase, habilitar manualmente a proteção contra senhas vazadas em Auth e confirmar a remoção do alerta no Security Advisor.
