# FIXAR — Declarações de dados para as lojas

Use esta lista como rascunho para Google Play Data Safety e Apple App Privacy. Confirme cada resposta na console; ela não substitui revisão jurídica.

| Dado | Uso observado no código | Compartilhamento | Armazenamento |
|---|---|---|---|
| E-mail, nome e sessão | Login, organização e autorização | Supabase | Supabase Auth; sessão local segura no nativo |
| Organização, telefone e logo | Perfil e identidade nos relatórios/QR | Supabase; logo pode aparecer na página pública se entitlement permitir | Banco/Storage |
| Clientes e equipamentos | Operação de manutenção e QR público | Supabase; dados minimizados na página pública | Banco |
| Ordens, itens, observações e assinaturas manuscritas | Relatórios e histórico técnico | Supabase/Storage conforme operação | Banco/Storage |
| Token e produto de assinatura | Vincular compra verificada à organização | Supabase server-side; não exposto ao app como segredo | Banco |
| QR público de equipamento | Abrir ficha pública e histórico permitido | Qualquer pessoa com a URL pode consultar dados minimizados | Banco |
| Câmera | Ler QR/barcodes | Não é enviada por si só; apenas o valor lido é usado | Temporário no dispositivo |
| Fotos | Selecionar logo da empresa | Enviada ao Storage quando o usuário confirma | Storage |
| Notificações | Lembretes locais de manutenção | Não há push remoto implementado | Agendamento local |
| Diagnósticos/analytics | Não há SDK de analytics identificado | Nenhum compartilhamento adicional identificado | — |

Permissões observadas: câmera; biblioteca de fotos para logo; notificações locais; internet e armazenamento de sessão exigidos pela operação. Não foi identificada permissão de localização ou biometria. O texto da câmera atualmente menciona leitura de códigos; valide o texto final no binário antes do envio.

Exclusão de conta e dados: o aplicativo possui logout, mas não foi identificado fluxo completo de solicitação/exclusão de conta. Trate como pendência de publicação até implementar ou disponibilizar o procedimento exigido pela loja.
