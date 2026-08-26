# Framework de engenharia assistida por IA

Este diretório organiza como agentes analisam, planejam, alteram e documentam `Fixar`. O ponto de entrada é o [Orquestrador](ORQUESTRADOR.md).

## Estrutura

- [MEMORIA](MEMORIA/CONTEXTO-DO-PROJETO.md): contexto, estado, decisões, riscos e histórico.
- [WORKFLOWS](WORKFLOWS/README.md): processos por intenção.
- [PROMPTS](PROMPTS/README.md): contexto e resultados esperados por etapa.
- [PERSONAS](PERSONAS/README.md): responsabilidades e limites.
- [CHECKLISTS](CHECKLISTS/README.md): critérios de passagem.
- [TEMPLATES](TEMPLATES/README.md): formatos reutilizáveis.

## Estados independentes

- **Analisado:** inspecionado.
- **Confirmado:** sustentado por evidência citada.
- **Planejado:** solução definida, não aplicada.
- **Implementado:** presente no worktree.
- **Testado:** comando executado e resultado registrado.
- **Commitado:** presente em hash Git informado.

Não copie conversas para a memória. Registre conclusões verificáveis e use `[PENDENTE DE CONFIRMAÇÃO]` para lacunas.

## Princípios

- Autorização é específica: analisar não autoriza editar; preparar não autoriza publicar.
- Documentação histórica não prova o estado atual.
- Contratos públicos e alterações preexistentes devem ser preservados.
- Segurança, privacidade, rollback e testes são proporcionais ao risco.
- O framework se adapta à tecnologia encontrada; não obriga uma stack.
