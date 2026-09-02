import { admin, bearer, json } from "../_shared/billing.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ message: "Method not allowed" }, 405);
  const token = bearer(request);
  if (!token) return json({ code: "AUTH_REQUIRED", message: "Sessão inválida." }, 401);
  const body = await request.json().catch(() => ({}));
  if (body.confirmation !== "EXCLUIR") return json({ code: "CONFIRMATION_REQUIRED", message: "Confirmação necessária." }, 400);
  const client = admin();
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return json({ code: "AUTH_REQUIRED", message: "Sessão inválida." }, 401);
  const userId = authData.user.id;
  const { data: memberships, error: membershipError } = await client.from("organization_members").select("organization_id, role, status").eq("user_id", userId).eq("status", "active");
  if (membershipError) return json({ code: "DELETE_FAILED", message: "Não foi possível verificar a conta." }, 500);
  const active = memberships ?? [];
  const owners = active.filter((membership) => membership.role === "owner");
  if (owners.length > 0) {
    const pendingReason = "owner_requires_organization_review";
    const { data: existingRequest } = await client.from("account_deletion_requests").select("id").eq("user_id", userId).eq("status", "pending").maybeSingle();
    if (existingRequest) await client.from("account_deletion_requests").update({ reason: pendingReason }).eq("id", existingRequest.id);
    else await client.from("account_deletion_requests").insert({ user_id: userId, reason: pendingReason, status: "pending" });
    return json({ status: "pending", code: "OWNER_REQUIRES_REVIEW", message: "Sua conta é proprietária de uma empresa. A exclusão precisa preservar ou encerrar essa organização com segurança e foi registrada para revisão." }, 202);
  }
  const { error: requestError } = await client.from("account_deletion_requests").insert({ user_id: userId, reason: "member_account_deletion", status: "completed", completed_at: new Date().toISOString() });
  if (requestError) return json({ code: "DELETE_FAILED", message: "Não foi possível registrar a exclusão." }, 500);
  const { error: deleteError } = await client.auth.admin.deleteUser(userId);
  if (deleteError && !/not found|does not exist/i.test(deleteError.message)) return json({ code: "DELETE_FAILED", message: "Não foi possível concluir a exclusão agora." }, 500);
  return json({ status: "completed", message: "Conta excluída." });
});
