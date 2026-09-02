# Instruções permanentes para agentes

Este é o repositório `Fixar`. Antes de qualquer atividade, leia `docs/IA/ORQUESTRADOR.md` e siga sua inicialização.

- Consulte `docs/IA/README.md`, `docs/IA/MEMORIA/ESTADO-ATUAL.md` e `docs/IA/MEMORIA/PROXIMAS-TAREFAS.md`.
- Consulte também `docs/commercial-plans.md` para seguir a base comercial implementada em COM-1/COM-2.
- Toda criação de recurso sujeito a limite deve possuir enforcement autoritativo no backend; pré-validação no cliente nunca substitui validação transacional do servidor.
- Preserve contratos e alterações preexistentes; prefira mudanças pequenas e reversíveis.
- Não invente regras de negócio; use `[PENDENTE DE CONFIRMAÇÃO]` quando faltar evidência.
- Diferencie: analisado, confirmado, planejado, implementado, testado e commitado.
- Nunca exponha segredos, credenciais, dados pessoais ou infraestrutura sensível.
- Não execute migrations, seeds, deploy, chamadas externas ou ações destrutivas sem autorização explícita.
- Verifique `git status` antes e depois.
- Selecione o workflow aplicável em `docs/IA/WORKFLOWS/README.md`.
- Após mudança material, atualize a memória com `WF-010`.
- Não faça commit, push, publicação ou comunicação externa sem pedido explícito.
- Antes de criar ou modificar qualquer interface, leia `docs/design/DESIGN_SYSTEM.md`. Toda UI deve reutilizar seus componentes, tokens, interações e regras responsivas; não introduza valores ou padrões visuais arbitrários quando já houver equivalente.
