export type CommercialPlanCode = "free" | "professional" | "team" | "grandfathered";
export type CommercialOfferCode = "founder" | "annual" | "trial" | "standard";

export type PlanLimits = {
  users: number | null;
  customers: number | null;
  equipment: number | null;
  qr_codes: number | null;
  work_orders_monthly: number | null;
  quotes_monthly: number | null;
};

export type FeatureFlags = {
  batch_orders: boolean;
  custom_branding: boolean;
  full_history: boolean;
};

export type BackendCommercialPlan = {
  code: CommercialPlanCode;
  display_name: string;
  limits: PlanLimits;
  features: FeatureFlags;
  history_days: number | null;
};

export type CommercialPlanOverride = {
  offerCode?: CommercialOfferCode;
  limits?: Partial<PlanLimits>;
  features?: Partial<FeatureFlags>;
  historyDays?: number | null;
};

export type EffectiveEntitlements = {
  planCode: CommercialPlanCode;
  offerCode?: CommercialOfferCode;
  limits: PlanLimits;
  features: FeatureFlags;
  historyDays: number | null;
};

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "paused" | "incomplete" | "grandfathered";
export type CommercialEntitlements = EffectiveEntitlements & {
  displayName: string;
  subscriptionStatus: SubscriptionStatus;
  billingCycle: "monthly" | "annual" | "none";
  priceCents: number;
  provider?: "manual" | "google_play" | "app_store" | null;
  providerProductId?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  autoRenew?: boolean | null;
};
export type CommercialUsage = PlanLimits & { timezone: string };
export type CommercialResource = keyof PlanLimits;
export type CommercialFeature = keyof FeatureFlags;

export const getLimit = (entitlements: CommercialEntitlements, resource: CommercialResource) => entitlements.limits[resource];
export const getUsage = (usage: CommercialUsage, resource: CommercialResource) => usage[resource] ?? 0;
export const hasFeature = (entitlements: CommercialEntitlements, feature: CommercialFeature) => entitlements.features[feature];
export const canCreateResource = (entitlements: CommercialEntitlements, usage: CommercialUsage, resource: CommercialResource, requested = 1) => {
  const limit = getLimit(entitlements, resource);
  return limit === null || getUsage(usage, resource) + requested <= limit;
};
export const usageState = (usage: number, limit: number | null) => limit === null ? "unlimited" : usage >= limit ? "reached" : usage / limit >= .8 ? "near" : "normal";
export const formatCommercialPrice = (priceCents: number, cycle: string) => priceCents === 0 ? "R$ 0" : `${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(priceCents / 100)}${cycle === "monthly" ? "/mês" : cycle === "annual" ? "/ano" : ""}`;

export function mapCommercialEntitlements(payload: any): CommercialEntitlements {
  return {
    planCode: payload.plan_code, displayName: payload.display_name,
    subscriptionStatus: payload.subscription_status, offerCode: payload.offer_code ?? undefined,
    billingCycle: payload.billing_cycle ?? "none", priceCents: Number(payload.price_cents ?? 0),
    limits: payload.limits, features: payload.features, historyDays: payload.history_days,
    provider: payload.provider ?? null, providerProductId: payload.provider_product_id ?? null,
    currentPeriodEnd: payload.current_period_end ?? null, cancelAtPeriodEnd: Boolean(payload.cancel_at_period_end), autoRenew: payload.auto_renew ?? null,
  };
}

export function countDistinctQrIdentities(tokens: string[]): number {
  return new Set(tokens.filter(Boolean)).size;
}

function mergeLimits(base: PlanLimits, next?: Partial<PlanLimits>): PlanLimits {
  return {
    users: next?.users ?? base.users,
    customers: next?.customers ?? base.customers,
    equipment: next?.equipment ?? base.equipment,
    qr_codes: next?.qr_codes ?? base.qr_codes,
    work_orders_monthly: next?.work_orders_monthly ?? base.work_orders_monthly,
    quotes_monthly: next?.quotes_monthly ?? base.quotes_monthly,
  };
}

function mergeFeatures(base: FeatureFlags, next?: Partial<FeatureFlags>): FeatureFlags {
  return {
    batch_orders: next?.batch_orders ?? base.batch_orders,
    custom_branding: next?.custom_branding ?? base.custom_branding,
    full_history: next?.full_history ?? base.full_history,
  };
}

export function resolveEffectiveEntitlements(
  plan: BackendCommercialPlan,
  overrides: CommercialPlanOverride = {},
): EffectiveEntitlements {
  return {
    planCode: plan.code,
    offerCode: overrides.offerCode,
    limits: mergeLimits(plan.limits, overrides.limits),
    features: mergeFeatures(plan.features, overrides.features),
    historyDays: overrides.historyDays ?? plan.history_days,
  };
}

export function resolvePlanDisplayName(plan: Pick<BackendCommercialPlan, "code" | "display_name">, offerCode?: CommercialOfferCode): string {
  if (offerCode === "founder" && plan.code === "professional") {
    return "Professional · Founder";
  }
  return plan.display_name;
}
