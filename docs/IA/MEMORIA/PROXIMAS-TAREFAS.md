# Próximas tarefas

**Atualizado em:** `2026-08-27`

## Objetivo confirmado

Evoluir o Fixar para um produto multiempresa e multiusuário, com possibilidade de assinatura futura.

## Sequência proposta

1. Validar em dispositivo físico o novo formulário técnico, captura de assinaturas, geração/compartilhamento do PDF, Home e notificação local, incluindo permissão negada e fluxos em lote.
2. Confirmar se lembretes precisam de push remoto para aparelhos diferentes; em caso positivo, definir atribuição do técnico, ciclo do token, emissor backend e política de reenvio.
3. Medir em uso real taxa de acerto do cache, tempo de consulta e planos SQL depois que os índices novos acumularem tráfego; ajustar TTL e índices somente com evidência.
4. Validar listas extensas e carregamento incremental em aparelho físico, incluindo redes lentas, retomada do app e atualização manual.
5. Definir a matriz detalhada de permissões de `technician` e `viewer`.
6. Implementar convites e troca entre organizações no aplicativo.
7. Implementar upload privado de anexos e auditoria das operações sensíveis.
8. Substituir o restante do adaptador de compatibilidade por contratos de domínio tipados e ampliar os testes de integração.
9. Definir planos e integração de assinatura somente após a base multiempresa estar validada.
10. Ao avaliar plano Pro ou superior para o Supabase, habilitar manualmente a proteção contra senhas vazadas em Auth e confirmar a remoção do alerta no Security Advisor.
