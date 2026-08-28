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
- Rascunhos de manutenção, incluindo assinaturas SVG, ficam no sandbox do aplicativo via `AsyncStorage`, que não fornece criptografia própria. O acesso lógico é filtrado por usuário/organização, mas proteção local em repouso depende do sistema operacional; não usar esse mecanismo para anexos grandes ou dados adicionais sem nova avaliação. Evidência: `src/services/offlineMaintenance.ts`.
- `public.create_work_order_offline(jsonb)` é intencionalmente `SECURITY DEFINER` e executável por `authenticated`, por isso aparece como aviso genérico no advisor. O contrato revoga `anon`, usa `search_path` vazio, valida `owner/admin/technician` via helper privado e confirma organização/cliente/equipamento; teste transacional negou usuário sem associação. Evidências: migration e `supabase/tests/offline_maintenance.sql`.
- `public.get_public_equipment(text)` é intencionalmente executável por `anon` e `SECURITY DEFINER`. O retorno é uma lista explícita sem cliente, série, IDs internos, valores, diagnósticos, assinaturas ou anexos; token inválido, revogado e ativo removido retornam ausência indistinguível. Validação remota com rollback confirmou isolamento, grants mínimos, revogação e rotação; o advisor mantém o aviso genérico esperado para esta RPC pública.
- As RPCs `platform_admin_organizations`, `platform_admin_users` e `platform_admin_qr_codes` são `SECURITY DEFINER` para consultar agregados globais e Auth, mas exigem `private.is_platform_admin()` antes de qualquer leitura. Teste remoto confirmou acesso do administrador e erro `42501` para usuário autenticado comum.

Registro baseado em inspeção estática e testes transacionais remotos com rollback. Nenhum valor sensível foi reproduzido aqui.
