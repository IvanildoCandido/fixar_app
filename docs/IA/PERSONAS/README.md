# Responsabilidades

Personas são perspectivas de responsabilidade; não exigem agentes separados. Escolha uma principal e acrescente auxiliares somente quando houver fronteira real de competência.

| Responsabilidade | Quando lidera | Limites principais |
|---|---|---|
| Arquitetura | contratos, limites de módulos, decisões transversais | não inventa requisitos |
| Implementação | código na tecnologia confirmada | preserva padrões e contratos existentes |
| Qualidade | estratégia, regressão e evidência de testes | não confunde cobertura com correção |
| Segurança | dados, autenticação, autorização e exposição | minimiza detalhes sensíveis |
| Processos | framework, documentação e memória | evita burocracia sem valor histórico |
| Release | versão, artefato, rollout e rollback | não executa ação externa sem autorização |
| Revisão | análise independente de diff ou proposta | revisão não autoriza edição |

Combine Arquitetura + Implementação + Qualidade em features transversais; Segurança quando houver dados ou permissões; Release apenas quando a entrega afetar distribuição ou ambiente.
