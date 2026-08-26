# Workflows

Todos começam com descoberta, passam por diagnóstico e plano quando houver mutação, validam o resultado e terminam com entrega clara. A autorização concedida para uma etapa não se amplia automaticamente.

## WF-001 — Corrigir bug

1. Reproduzir ou obter evidência confiável.
2. Mapear fluxo, contrato, causa e alcance.
3. Planejar a menor correção compatível e o teste de regressão.
4. Obter autorização para editar quando ainda não concedida.
5. Implementar, verificar, revisar e registrar.

Não corrigir sintomas sem explicar a causa ou a limitação da evidência.

## WF-002 — Segurança e privacidade

1. Definir ameaça, ativo, fronteira de confiança e impacto.
2. Evitar reproduzir dados sensíveis em logs ou documentação.
3. Confirmar causa e controles existentes.
4. Planejar mitigação, compatibilidade, testes negativos e risco residual.
5. Implementar somente quando autorizado; revisar independentemente quando o risco justificar.

Auditoria não autoriza correção. Rotação de credencial e ações externas exigem autorização específica.

## WF-003 — Criar feature

Confirmar necessidade, público, regras e critérios de aceitação; mapear contratos; planejar compatibilidade, observabilidade, testes e rollback; implementar incrementalmente após autorização; verificar comportamento observável e registrar.

## WF-004 — Refatorar

Definir o comportamento preservado e a dívida concreta; estabelecer uma caracterização ou teste; limitar o diff; refatorar em passos reversíveis; provar que o contrato não mudou.

## WF-005 — Performance

Definir métrica e cenário; medir uma linha de base reproduzível; localizar gargalo; planejar mudança; medir novamente nas mesmas condições; registrar custos e regressões. Não declarar melhoria sem medição comparável.

## WF-006 — Criar documentação

Definir público e decisão apoiada; localizar fontes atuais; preferir referenciar a duplicar; redigir fatos com estado explícito; validar links, comandos, datas e ausência de segredos.

## WF-007 — Criar testes

Confirmar comportamento e fronteira; escolher o nível de teste mais barato que prove o requisito; usar dados fictícios e dependências isoladas; evitar testes presos a texto ou implementação sem valor comportamental; executar e registrar resultado.

## WF-008 — Revisar código

Inspecionar diff e contexto; priorizar correção, segurança, contratos e regressões; citar arquivo e linha; separar bloqueantes de melhorias; não editar durante revisão sem autorização adicional.

## WF-009 — Preparar deploy

Confirmar versão, artefato, configuração, testes, migrations, observabilidade, compatibilidade e rollback. Preparação não autoriza deploy, publicação, migration, seed nem chamada externa.

## WF-010 — Atualizar memória

Registrar mudança material; atualizar snapshot somente quando ele mudou; manter próximas tarefas atuais; registrar decisões e riscos sem promover status por inferência; validar links; não copiar conversa nem duplicar o histórico Git.
