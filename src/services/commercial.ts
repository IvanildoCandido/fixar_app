import { supabase } from "./supabase";
import { BackendCommercialPlan, CommercialEntitlements, CommercialUsage, mapCommercialEntitlements } from "../domain/commercialPlans";

let latestEntitlements: CommercialEntitlements | null = null;
export const commercialBrandingEnabled = () => latestEntitlements?.features.custom_branding ?? false;

export async function loadCommercialState(organizationId: string) {
  const [entitlements, usage, plans] = await Promise.all([
    supabase.rpc("get_current_organization_entitlements", { p_organization_id: organizationId }),
    supabase.rpc("get_current_organization_commercial_usage", { p_organization_id: organizationId }),
    supabase.from("commercial_plan_catalog").select("code,display_name,price_cents,billing_cycle,limit_users,limit_customers,limit_equipment,limit_qr_codes,limit_work_orders_monthly,limit_quotes_monthly,feature_batch_orders,feature_custom_branding,feature_full_history,history_days").eq("is_active", true).eq("is_public", true).order("price_cents"),
  ]);
  if (entitlements.error) throw entitlements.error;
  if (usage.error) throw usage.error;
  if (plans.error) throw plans.error;
  latestEntitlements = mapCommercialEntitlements(entitlements.data);
  return {
    entitlements: latestEntitlements as CommercialEntitlements,
    usage: usage.data as CommercialUsage,
    plans: (plans.data ?? []).map((row: any) => ({
      code: row.code, display_name: row.display_name, price_cents: row.price_cents, billing_cycle: row.billing_cycle,
      limits: { users: row.limit_users, customers: row.limit_customers, equipment: row.limit_equipment, qr_codes: row.limit_qr_codes, work_orders_monthly: row.limit_work_orders_monthly, quotes_monthly: row.limit_quotes_monthly },
      features: { batch_orders: row.feature_batch_orders, custom_branding: row.feature_custom_branding, full_history: row.feature_full_history }, history_days: row.history_days,
    })) as Array<BackendCommercialPlan & { price_cents: number; billing_cycle: string }>,
  };
}
