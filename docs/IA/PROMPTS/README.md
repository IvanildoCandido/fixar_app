# Prompts canônicos

Estes blocos descrevem resultados esperados. Devem ser combinados com o contexto da solicitação, sem substituir instruções do usuário.

## P-001 — Contexto obrigatório

```text
Leia AGENTS.md, estado atual, próximas tarefas e fontes relacionadas. Verifique git status. Preserve contratos, mudanças preexistentes e dados sensíveis. Diferencie analisado, confirmado, planejado, implementado, testado e commitado. Não amplie a autorização da solicitação.
```

## P-010 — Descoberta

```text
Mapeie fluxo, arquivos, entradas, saídas, contratos, testes, integrações, documentação e lacunas. Cite fontes. Não proponha solução antes de compreender a fronteira afetada.
```

## P-020 — Diagnóstico

```text
Explique causa ou necessidade, mecanismo, alcance, impacto, evidências contrárias e nível de confiança. Marque hipóteses e informações pendentes.
```

## P-030 — Plano

```text
Defina objetivo, fora de escopo, arquivos previstos, contratos preservados, etapas reversíveis, testes, riscos, observabilidade, rollback e autorizações necessárias.
```

## P-040 — Implementação

```text
Implemente somente o plano autorizado. Pare se surgir regra de negócio não confirmada, arquivo indispensável fora do escopo ou mutação externa não autorizada.
```

## P-050 — Verificação

```text
Execute as verificações mais próximas do comportamento e proporcionais ao risco. Registre comando, resultado e limitações. Não confunda build, lint e teste funcional.
```

## P-060 — Revisão

```text
Revise o diff por correção, segurança, contratos, regressões, clareza e escopo. Cite achados acionáveis por severidade. Informe quando não houver achados.
```

## P-070 — Entrega

```text
Comece pelo resultado. Liste arquivos, verificações, limitações, riscos residuais, estado do Git e próximos passos essenciais. Use estados técnicos com precisão.
```
