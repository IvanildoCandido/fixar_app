# Orquestrador

## Inicialização obrigatória

1. Ler o `AGENTS.md` aplicável.
2. Ler este framework, o estado atual e as próximas tarefas.
3. Consultar decisões, riscos e documentação relacionados.
4. Verificar `git status` e preservar mudanças preexistentes.
5. Classificar objetivo, escopo e autorização da solicitação.
6. Selecionar o [workflow](WORKFLOWS/README.md), a [persona](PERSONAS/README.md) e os [prompts](PROMPTS/README.md) aplicáveis.
7. Informar brevemente objetivo, workflow, responsabilidade e etapa atual.
8. Executar uma etapa por vez e validar os [gates](CHECKLISTS/README.md) antes de avançar.
9. Revisar o diff e executar verificações proporcionais ao risco.
10. Entregar estados separados e atualizar a memória quando houver mudança durável.

## Roteamento

| Intenção principal | Workflow |
|---|---|
| corrigir comportamento incorreto | WF-001 Bug |
| vulnerabilidade, privacidade ou autorização | WF-002 Segurança |
| criar comportamento novo | WF-003 Feature |
| refatorar sem mudar comportamento | WF-004 Refatoração |
| investigar ou melhorar desempenho | WF-005 Performance |
| criar ou atualizar documentação | WF-006 Documentação |
| criar ou melhorar testes | WF-007 Testes |
| revisar código ou diff | WF-008 Revisão |
| preparar release ou deploy | WF-009 Deploy |
| atualizar contexto, decisão ou histórico | WF-010 Memória |

Segurança prevalece quando houver risco a confidencialidade, integridade ou autorização. Preparar deploy não autoriza executá-lo. Diagnosticar ou revisar não autoriza corrigir. Feature prevalece sobre refatoração quando existe comportamento observável novo.

## Gates

Nenhuma edição ocorre sem escopo e autorização. Nenhuma entrega declara teste sem comando e resultado. Nenhum fato histórico prova o estado atual sem confirmação no código ou configuração.

## Encerramento

Entregue: resultado, arquivos afetados, comandos executados, resultados, limitações, riscos residuais, estado do Git e próximos passos realmente necessários. Execute WF-010 somente quando houver estado técnico durável; não crie memória sem valor histórico.
