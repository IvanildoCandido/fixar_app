# Fixar Admin

Painel web global do proprietário do Fixar.

## Desenvolvimento

Na raiz do monorepo:

```bash
npm run admin:dev
```

O primeiro módulo gera QR Codes de equipamentos e persiste o histórico no Supabase. As referências seguem o contrato de 7 caracteres usado pelo app mobile; o payload inclui `FIXAR|EQUIPMENT|` e termina com a referência compatível com o leitor atual.

O acesso usa Supabase Auth e é liberado apenas para usuários cadastrados em `platform_admins`. O painel consulta métricas reais por meio da RPC protegida `platform_admin_metrics`.

## Limites atuais

- A geração visual, o download e a impressão são locais no navegador; o histórico é persistido no banco.
- Usuários, organizações, clientes, equipamentos, ordens e armazenamento são consultados por uma RPC protegida.
- Banda e limites de consumo exigem uma fonte administrativa específica da plataforma e permanecem como próxima etapa.
- Nenhuma chave administrativa do Supabase deve ser colocada neste app web.
- A autenticação do proprietário e as métricas reais são etapas seguintes.
