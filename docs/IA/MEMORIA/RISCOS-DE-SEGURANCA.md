# Riscos de segurança

Não inclua payloads reais, credenciais, dados pessoais, URLs internas ou detalhes exploráveis desnecessários.

## Riscos observados

- A sessão usa Supabase Auth e `expo-secure-store` em plataformas nativas; no web, a persistência usa o armazenamento compatível do navegador. Evidência: `src/services/supabase.ts`.
- O aplicativo manipula dados pessoais de clientes. Política de retenção, autenticação, autorização e proteção em repouso permanecem `[PENDENTE DE CONFIRMAÇÃO]`. Evidências: `src/types/data.ts` e `docs/ARQUITETURA-SAAS.md`.
- O isolamento multiempresa está implementado com chaves compostas, RLS e validação de referências de usuário por organização. `assigned_to`, `uploaded_by` e `invited_by` exigem membro ativo ao gravar; `actor_id` aceita membro atual ou histórico. Saída posterior do membro preserva as referências já registradas. Evidências: `supabase/migrations/20260827180000_security_audit_hardening.sql` e `supabase/tests/security_audit_hardening.sql`.
- A matriz de escrita para `technician` e `viewer` permanece `[PENDENTE DE CONFIRMAÇÃO]`; até lá, as políticas permitem escrita de negócio somente a `owner` e `admin`.
- `public.rls_auto_enable()` continua `SECURITY DEFINER` para atender ao event trigger `ensure_rls`, mas não é mais executável diretamente por `PUBLIC`, `anon`, `authenticated` ou `service_role`. A criação transacional de uma tabela pública confirmou que o event trigger continua habilitando RLS.
- A proteção contra senhas vazadas permanece desativada. O advisor recomenda habilitá-la, mas a funcionalidade está disponível apenas no plano Pro ou superior e a organização observada está no plano Free. Ação manual necessária após eventual mudança de plano: habilitar **Prevent use of leaked passwords** nas configurações de Auth.
- O aplicativo solicita permissões de notificação e câmera. O uso e a comunicação dessas permissões devem ser preservados em mudanças futuras. Evidências: `App.tsx`, `app.json` e `src/components/ScannerQR/index.tsx`.

Registro baseado em inspeção estática e testes transacionais remotos com rollback. Nenhum valor sensível foi reproduzido aqui.
