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
