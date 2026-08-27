# Contexto do projeto

**Atualizado em:** `2026-08-24`

## Propósito

Aplicativo móvel para operações de assistência técnica: cadastro de clientes, equipamentos, peças e serviços; abertura de manutenções; consulta de serviços concluídos; geração de orçamentos e relatórios. Evidências: `src/routes/app.routes.tsx`, `src/routes/main.routes.tsx`, `src/screens/Home/index.tsx` e `src/types/data.ts`.

O produto `Fixar` atual nasceu de uma base móvel legada, mas foi iniciado como repositório novo e reconstrução limpa, sem vínculo de identidade ou continuidade arquitetural automática com um repositório FIXAR anterior posteriormente abandonado. O projeto Supabase foi reutilizado; por isso estruturas remotas sem evidência neste repositório não devem ser promovidas a funcionalidades atuais. O objetivo confirmado pelo responsável é atender múltiplas empresas e usuários, com assinatura em uma etapa posterior. Autenticação, onboarding de empresa e persistência operacional estão conectados ao Supabase.

## Estrutura e tecnologias confirmadas

- Aplicativo Expo 52 com React Native 0.76 e React 18, escrito principalmente em TypeScript estrito. Evidências: `package.json` e `tsconfig.json`.
- Entrada em `index.js` e componente raiz em `App.tsx`; projetos nativos Android e iOS estão versionados em `android/` e `ios/`. Evidências: `package.json`, `index.js`, `android/` e `ios/`.
- Navegação com React Navigation: stack principal e abas para Peças, Equipamentos, Home, Serviços e Clientes. Evidências: `src/routes/main.routes.tsx` e `src/routes/app.routes.tsx`.
- Interface estilizada com `styled-components`; formulários usam React Hook Form e Yup. Evidência: `package.json` e arquivos em `src/components/Form/`.
- Acesso ao Supabase centralizado em `src/services/supabase.ts`; o adaptador `src/services/API.ts` preserva temporariamente os contratos consumidos pelas telas.
- `src/services/db.json` e o script `server` oferecem um servidor JSON local para desenvolvimento. Evidências: `package.json` e `src/services/db.json`.

## Comandos confirmados

- Instalar dependências: `[PENDENTE DE CONFIRMAÇÃO]`; existem `yarn.lock` e `package-lock.json`, portanto o gerenciador canônico não está inequívoco.
- Iniciar Expo: `npm run start`.
- Executar servidor JSON local: `npm run server` (o host configurado pode exigir adaptação à rede local).
- Executar Android/iOS/web: `npm run android`, `npm run ios` e `npm run web`.
- Build iOS via EAS: `npm run build`; submissão via EAS: `npm run submit`. Esses comandos podem consumir serviços externos e exigem autorização explícita antes da execução.

Evidência dos comandos: `package.json`. O `README.md` também registra exemplos operacionais, mas diverge do host atual do script `server`.

## Contratos, integrações e restrições

- Entidades observadas: cliente, equipamento, peça, serviço, manutenção e período. Evidência: `src/types/data.ts`.
- Integrações: Supabase, Expo Updates, notificações locais/push, câmera para leitura de código, impressão e compartilhamento de relatórios. Evidências: `src/services/`, `App.tsx`, `src/components/ScannerQR/index.tsx`, `src/screens/Repair/index.tsx` e `src/screens/FinishedServices/index.tsx`.
- Dados do domínio incluem informações pessoais de clientes; logs, fixtures e documentação não devem reproduzir dados reais. Evidência: `src/types/data.ts`.
- Não foram encontrados scripts ou arquivos de teste, lint, formatação ou CI. Evidências: `package.json` e busca no repositório em 2026-08-24.
- Regras detalhadas do negócio, contrato do backend, ambientes suportados e processo oficial de release permanecem `[PENDENTE DE CONFIRMAÇÃO]`.
- Projeto EAS, ambientes e endpoint real de API ainda precisam ser definidos antes de qualquer publicação.

Cada fato deve citar o arquivo que o sustenta. Nunca registrar valores secretos.
