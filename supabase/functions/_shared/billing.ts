import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const PRODUCT_PLANS: Record<string, "professional" | "team"> = {
  fixar_professional_monthly: "professional",
  fixar_team_monthly: "team",
};
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
export const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
export const bearer = (request: Request) => request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

export async function requireOwner(request: Request, organizationId: string, requestedProvider?: string) {
  const token = bearer(request);
  if (!token) throw new Error("AUTH_REQUIRED");
  const client = admin();
  const { data: user, error } = await client.auth.getUser(token);
  if (error || !user.user) throw new Error("AUTH_REQUIRED");
  const { data: member } = await client.from("organization_members").select("role").eq("organization_id", organizationId).eq("user_id", user.user.id).eq("status", "active").maybeSingle();
  if (!member || member.role !== "owner") throw new Error("OWNER_REQUIRED");
  if (requestedProvider) {
    const { data: existing } = await client.from("organization_subscriptions").select("provider, subscription_status, current_period_end").eq("organization_id", organizationId).maybeSingle();
    if (existing?.provider && existing.provider !== "manual" && existing.provider !== requestedProvider && !["canceled", "grandfathered"].includes(existing.subscription_status) && (!existing.current_period_end || new Date(existing.current_period_end) > new Date())) throw new Error("PROVIDER_CONFLICT");
  }
  return user.user;
}

export async function applyVerifiedSubscription(input: {
  organizationId: string; provider: "google_play" | "app_store"; planCode: "professional" | "team"; productId: string;
  providerSubscriptionId?: string | null; purchaseToken?: string | null; originalTransactionId?: string | null;
  environment?: "sandbox" | "production"; periodStart?: string | null; periodEnd?: string | null; autoRenew?: boolean | null;
  providerStatus: "active" | "past_due" | "paused" | "canceled" | "incomplete";
}) {
  const client = admin();
  const { data: conflict } = await client.from("organization_subscriptions").select("organization_id").eq("provider", input.provider).or(`provider_purchase_token.eq.${input.purchaseToken ?? "__none__"},provider_original_transaction_id.eq.${input.originalTransactionId ?? "__none__"}`).neq("organization_id", input.organizationId).maybeSingle();
  if (conflict) throw new Error("PURCHASE_ALREADY_LINKED");
  const { data: current, error: currentError } = await client.from("organization_subscriptions").select("*").eq("organization_id", input.organizationId).single();
  if (currentError) throw currentError;
  if (current.provider && current.provider !== "manual" && current.provider !== input.provider && !["canceled", "grandfathered"].includes(current.subscription_status) && (!current.current_period_end || new Date(current.current_period_end) > new Date())) throw new Error("PROVIDER_CONFLICT");
  const next = { plan_code: input.planCode, subscription_status: input.providerStatus, provider: input.provider, provider_product_id: input.productId, provider_subscription_id: input.providerSubscriptionId ?? null, provider_purchase_token: input.purchaseToken ?? null, provider_original_transaction_id: input.originalTransactionId ?? null, provider_environment: input.environment ?? "production", current_period_start: input.periodStart ?? current.current_period_start, current_period_end: input.periodEnd ?? null, auto_renew: input.autoRenew ?? null, last_verified_at: new Date().toISOString() };
  const changed = ["plan_code", "subscription_status", "provider", "provider_product_id", "provider_subscription_id", "provider_purchase_token", "provider_original_transaction_id", "provider_environment", "current_period_end", "auto_renew"].some((key) => String((current as Record<string, unknown>)[key] ?? "") !== String((next as Record<string, unknown>)[key] ?? ""));
  if (changed) { const { error } = await client.from("organization_subscriptions").update(next).eq("organization_id", input.organizationId); if (error) throw error; }
  return { changed, planCode: input.planCode, provider: input.provider, currentPeriodEnd: next.current_period_end, autoRenew: next.auto_renew };
}
