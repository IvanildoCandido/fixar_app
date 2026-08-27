# Fixar Admin

Painel web global do proprietário do Fixar.

## Desenvolvimento

Na raiz do monorepo:

```bash
npm run admin:dev
```

O primeiro módulo gera QR Codes de equipamentos localmente. As referências seguem o contrato de 7 caracteres usado pelo app mobile; o payload inclui `FIXAR|EQUIPMENT|` e termina com a referência compatível com o leitor atual.

## Limites atuais

- A geração, o download e a impressão são locais no navegador.
- Os indicadores exibem estado pendente até existir uma API administrativa server-side.
- Nenhuma chave administrativa do Supabase deve ser colocada neste app web.
- A autenticação do proprietário e as métricas reais são etapas seguintes.
