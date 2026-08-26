# Riscos de segurança

Não inclua payloads reais, credenciais, dados pessoais, URLs internas ou detalhes exploráveis desnecessários.

## Riscos observados

- A sessão usa Supabase Auth e `expo-secure-store` em plataformas nativas; no web, a persistência usa o armazenamento compatível do navegador. Evidência: `src/services/supabase.ts`.
- O aplicativo manipula dados pessoais de clientes. Política de retenção, autenticação, autorização e proteção em repouso permanecem `[PENDENTE DE CONFIRMAÇÃO]`. Evidências: `src/types/data.ts` e `docs/ARQUITETURA-SAAS.md`.
- O isolamento multiempresa está implementado com chaves compostas e RLS e foi validado em transação com duas identidades fictícias, leitura isolada e negação de escrita cruzada. Evidências estruturais: `supabase/migrations/`.
- A matriz de escrita para `technician` e `viewer` permanece `[PENDENTE DE CONFIRMAÇÃO]`; até lá, as políticas permitem escrita de negócio somente a `owner` e `admin`.
- O advisor do Supabase reporta a função preexistente `public.rls_auto_enable()` como `SECURITY DEFINER` executável por papéis da API. Sua origem e necessidade permanecem `[PENDENTE DE CONFIRMAÇÃO]`; ela não foi criada nem alterada pelas migrations do Fixar.
- O aplicativo solicita permissões de notificação e câmera. O uso e a comunicação dessas permissões devem ser preservados em mudanças futuras. Evidências: `App.tsx`, `app.json` e `src/components/ScannerQR/index.tsx`.

Registro baseado em inspeção estática, não em auditoria de segurança. Nenhum valor sensível foi reproduzido aqui.
