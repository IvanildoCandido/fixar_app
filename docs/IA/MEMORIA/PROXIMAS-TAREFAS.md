# Próximas tarefas

**Atualizado em:** `2026-08-27`

## Objetivo confirmado

Evoluir o Fixar para um produto multiempresa e multiusuário, com possibilidade de assinatura futura.

## Sequência proposta

1. Conectar autenticação server-side do proprietário ao `apps/admin-web` sem expor chave administrativa no navegador.
2. Criar API administrativa para métricas de usuários, organizações, banco, armazenamento e banda, com autorização global explícita.
3. Validar em dispositivo físico o novo formulário técnico, captura de assinaturas, geração/compartilhamento do PDF, Home e notificação local, incluindo permissão negada e fluxos em lote.
4. Confirmar se lembretes precisam de push remoto para aparelhos diferentes; em caso positivo, definir atribuição do técnico, ciclo do token, emissor backend e política de reenvio.
5. Medir em uso real taxa de acerto do cache, tempo de consulta e planos SQL depois que os índices novos acumularem tráfego; ajustar TTL e índices somente com evidência.
6. Validar listas extensas e carregamento incremental em aparelho físico, incluindo redes lentas, retomada do app e atualização manual.
7. Definir a matriz detalhada de permissões de `technician` e `viewer`.
8. Implementar convites e troca entre organizações no aplicativo.
9. Implementar upload privado de anexos e auditoria das operações sensíveis.
10. Substituir o restante do adaptador de compatibilidade por contratos de domínio tipados e ampliar os testes de integração.
11. Definir planos e integração de assinatura somente após a base multiempresa estar validada.
12. Ao avaliar plano Pro ou superior para o Supabase, habilitar manualmente a proteção contra senhas vazadas em Auth e confirmar a remoção do alerta no Security Advisor.
