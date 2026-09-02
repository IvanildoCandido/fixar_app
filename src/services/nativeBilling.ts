import { supabase } from "./supabase";
import { NativeBillingPlan } from "../domain/nativeBilling";
import type { Purchase } from "expo-iap";

export type VerifiedSubscription = { planCode: NativeBillingPlan; provider: "google_play" | "app_store"; currentPeriodEnd: string | null; autoRenew: boolean };

export async function verifyNativePurchase(purchase: Purchase, organizationId: string, planCode: NativeBillingPlan) {
  const provider = purchase.store === "apple" ? "app_store" : "google_play";
  const { data, error } = await supabase.functions.invoke("billing-verify-purchase", {
    body: {
      organization_id: organizationId,
      plan_code: planCode,
      provider,
      product_id: purchase.productId,
      transaction_id: purchase.transactionId ?? purchase.id,
      purchase_token: purchase.purchaseToken ?? null,
      signed_transaction_info: purchase.store === "apple" ? purchase.purchaseToken ?? null : null,
      app_account_token: (purchase as Purchase & { appAccountToken?: string }).appAccountToken ?? null,
    },
  });
  if (error) throw new Error("Não foi possível confirmar sua assinatura. Tente novamente.");
  if (!data?.verified) throw new Error(data?.message || "Não foi possível confirmar sua assinatura.");
  return data as VerifiedSubscription;
}
