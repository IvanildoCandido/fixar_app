import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

export const onboardingPendingKey = (userId: string) => `fixar:onboarding:pending:${userId}`;
const onboardingStateKey = (userId: string, organizationId: string) => `fixar:onboarding:state:${userId}:${organizationId}`;
const checklistHiddenKey = (userId: string, organizationId: string) => `fixar:onboarding:checklist-hidden:${userId}:${organizationId}`;
const completedKey = (userId: string, organizationId: string) => `fixar:onboarding:completed:${userId}:${organizationId}`;

export async function isOnboardingPending(userId: string) { return (await AsyncStorage.getItem(onboardingPendingKey(userId))) === "1"; }
export async function finishOnboarding(userId: string, organizationId: string) {
  await AsyncStorage.multiSet([[onboardingStateKey(userId, organizationId), "done"], [completedKey(userId, organizationId), "1"], [onboardingPendingKey(userId), "0"]]);
}
export async function shouldShowCoach(userId: string, organizationId: string) { return (await AsyncStorage.getItem(completedKey(userId, organizationId))) === "1" && (await AsyncStorage.getItem(`fixar:onboarding:coach:${userId}`)) !== "1"; }
export async function completeCoach(userId: string) { await AsyncStorage.setItem(`fixar:onboarding:coach:${userId}`, "1"); }
export async function isChecklistHidden(userId: string, organizationId: string) { return (await AsyncStorage.getItem(checklistHiddenKey(userId, organizationId))) === "1"; }
export async function hideChecklist(userId: string, organizationId: string) { await AsyncStorage.setItem(checklistHiddenKey(userId, organizationId), "1"); }

export async function loadFirstSteps(organizationId: string) {
  const [customers, devices, qrs, repairs] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("generated_qr_codes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("work_orders").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null),
  ]);
  const error = customers.error || devices.error || qrs.error || repairs.error;
  if (error) throw error;
  return { customer: (customers.count ?? 0) > 0, equipment: (devices.count ?? 0) > 0, qr: (qrs.count ?? 0) > 0, maintenance: (repairs.count ?? 0) > 0 };
}
