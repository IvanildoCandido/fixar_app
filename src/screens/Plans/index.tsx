import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { Check, Star } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { deepLinkToSubscriptions, useIAP, type Purchase } from "expo-iap";
import { Header } from "../../components/Header";
import { Button, Card, ErrorState, Spinner } from "../../design-system";
import { formatCommercialPrice } from "../../domain/commercialPlans";
import { NATIVE_BILLING_ENABLED, NATIVE_BILLING_PRODUCTS, nativeBillingPlanForProduct } from "../../domain/nativeBilling";
import { useCommercial } from "../../commercial/CommercialContext";
import { useAuth } from "../../auth/AuthContext";
import { verifyNativePurchase } from "../../services/nativeBilling";

const storeAvailable = NATIVE_BILLING_ENABLED && (Platform.OS === "android" || Platform.OS === "ios");

export function Plans() {
  const theme = useTheme();
  const { session } = useAuth();
  const { plans, entitlements, loading, error, refresh } = useCommercial();
  const [purchasePlan, setPurchasePlan] = useState<string | null>(null);
  const [storeError, setStoreError] = useState("");
  const { connected, subscriptions, fetchProducts, requestPurchase, finishTransaction, getAvailablePurchases, restorePurchases } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      const planCode = nativeBillingPlanForProduct(purchase.productId);
      if (!planCode || !session) return;
      if (purchase.purchaseState === "pending") { setPurchasePlan(null); Alert.alert("Pagamento pendente", "Sua compra ainda está sendo processada pela loja."); return; }
      try {
        const result = await verifyNativePurchase(purchase, session.organization.id, planCode);
        await finishTransaction({ purchase, isConsumable: false });
        setPurchasePlan(null);
        await refresh();
        Alert.alert("Assinatura ativada", `O plano ${result.planCode === "professional" ? "Profissional" : "Equipe"} já está disponível para sua empresa.`);
      } catch (purchaseError) {
        setPurchasePlan(null);
        Alert.alert("Não foi possível confirmar sua assinatura", purchaseError instanceof Error ? purchaseError.message : "Tente novamente.");
      }
    },
    onPurchaseError: () => { setPurchasePlan(null); Alert.alert("Compra não concluída", "A loja não concluiu a compra. Nenhuma alteração foi feita no seu plano."); },
    onError: () => setStoreError("Não foi possível conectar à loja agora."),
  });

  useEffect(() => {
    if (!storeAvailable || !connected) return;
    fetchProducts({ skus: Object.values(NATIVE_BILLING_PRODUCTS), type: "subs" }).catch(() => setStoreError("Não foi possível carregar as opções de assinatura agora."));
  }, [connected, fetchProducts]);

  const productsById = useMemo(() => new Map(subscriptions.map((product) => [product.id, product])), [subscriptions]);
  const buy = async (planCode: "professional" | "team") => {
    if (!session || session.role !== "owner") { Alert.alert("Acesso restrito", "Somente o proprietário da empresa pode contratar um plano."); return; }
    const productId = NATIVE_BILLING_PRODUCTS[planCode];
    if (!connected || !productsById.has(productId)) { Alert.alert("Compras indisponíveis", "Este produto ainda não está disponível neste ambiente."); return; }
    try { setPurchasePlan(planCode); await requestPurchase({ type: "subs", request: Platform.OS === "ios" ? { apple: { sku: productId, appAccountToken: session.user.id } } : { google: { skus: [productId], obfuscatedAccountId: session.user.id.replace(/-/g, "").slice(0, 64) } } }); }
    catch { setPurchasePlan(null); Alert.alert("Não foi possível conectar à loja", "Tente novamente em alguns instantes."); }
  };
  const restore = async () => { try { setStoreError(""); await restorePurchases(); await getAvailablePurchases({ alsoPublishToEventListenerIOS: true }); Alert.alert("Restauração iniciada", "As compras encontradas serão confirmadas com segurança para a empresa atual."); } catch { setStoreError("Não foi possível restaurar compras agora."); } };

  if (loading && !plans.length) return <View style={{ flex: 1, backgroundColor: theme.colors.background }}><Header title="Planos" icons /><Spinner /></View>;
  if (error && !plans.length) return <View style={{ flex: 1, backgroundColor: theme.colors.background }}><Header title="Planos" icons /><ErrorState title="Não foi possível carregar os planos" description={error} onRetry={refresh} /></View>;
  return <View style={{ flex: 1, backgroundColor: theme.colors.background }}><Header title="Planos" icons /><ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
    {storeAvailable && storeError ? <Card><Text style={{ color: theme.colors.warning }}>{storeError}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => fetchProducts({ skus: Object.values(NATIVE_BILLING_PRODUCTS), type: "subs" })} /></Card> : null}
    {plans.map((plan) => {
      const recommended = plan.code === "professional"; const current = plan.code === entitlements?.planCode; const product = productsById.get(NATIVE_BILLING_PRODUCTS[plan.code as "professional" | "team"]); const paid = plan.code === "professional" || plan.code === "team";
      const facts = [`${plan.limits.users} usuário${plan.limits.users === 1 ? "" : "s"}`, plan.limits.customers === null ? "Clientes e equipamentos ilimitados" : `${plan.limits.customers} clientes · ${plan.limits.equipment} equipamentos`, `${plan.limits.qr_codes} QR Codes`, plan.limits.work_orders_monthly === null ? "OS e orçamentos ilimitados" : `${plan.limits.work_orders_monthly} OS · ${plan.limits.quotes_monthly} orçamentos`, plan.features.full_history ? "Histórico completo" : `${plan.history_days} dias de histórico`, plan.features.batch_orders ? "Manutenção em lote" : "Sem manutenção em lote", plan.features.custom_branding ? "Branding da empresa" : "Identidade FIXAR nos documentos"];
      const price = paid && storeAvailable ? product?.displayPrice ? `${product.displayPrice}/mês` : "Preço indisponível" : formatCommercialPrice(plan.price_cents, plan.billing_cycle);
      return <Card key={plan.code}><View style={{ gap: 12 }}>{recommended ? <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}><Star size={15} color={theme.colors.primary} /><Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.semibold }}>Mais recomendado</Text></View> : null}<Text style={{ fontFamily: theme.fonts.semibold, fontSize: 21, color: theme.colors.foreground }}>{plan.display_name}</Text><Text style={{ fontFamily: theme.fonts.bold, fontSize: 24, color: theme.colors.foreground }}>{price}</Text>{facts.map((fact) => <View key={fact} style={{ flexDirection: "row", gap: 8 }}><Check size={16} color={theme.colors.primary} /><Text style={{ flex: 1, color: theme.colors.muted }}>{fact}</Text></View>)}{paid && storeAvailable ? <Button label={current ? "Plano atual" : purchasePlan === plan.code ? "Processando..." : "Assinar"} disabled={current || purchasePlan !== null || !product} loading={purchasePlan === plan.code} variant={recommended ? "primary" : "secondary"} onPress={() => buy(plan.code as "professional" | "team")} /> : <Button label={current ? "Plano atual" : "Tenho interesse"} disabled={current} variant={recommended ? "primary" : "secondary"} onPress={() => Alert.alert("Contratação pelo atendimento", "Nenhuma cobrança foi realizada neste ambiente.")} />}</View></Card>;
    })}
    {storeAvailable ? <Button label="Restaurar compras" variant="ghost" onPress={restore} /> : null}
    {entitlements?.provider ? <Button label="Gerenciar assinatura" variant="secondary" onPress={() => deepLinkToSubscriptions().catch(() => Alert.alert("Não foi possível abrir a loja", "Abra o gerenciamento de assinaturas diretamente na loja do seu aparelho."))} /> : null}
  </ScrollView></View>;
}
