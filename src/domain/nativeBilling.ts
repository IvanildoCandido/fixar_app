export type NativeBillingPlan = "professional" | "team";
export const NATIVE_BILLING_ENABLED = process.env.EXPO_PUBLIC_NATIVE_BILLING_ENABLED === "true";
export const NATIVE_BILLING_PRODUCTS: Record<NativeBillingPlan, string> = {
  professional: "fixar_professional_monthly",
  team: "fixar_team_monthly",
};
export const nativeBillingPlanForProduct = (productId: string): NativeBillingPlan | null => {
  const entry = Object.entries(NATIVE_BILLING_PRODUCTS).find(([, id]) => id === productId);
  return (entry?.[0] as NativeBillingPlan | undefined) ?? null;
};
export const nativeBillingProductIds = Object.values(NATIVE_BILLING_PRODUCTS);
