import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nativeBillingPlanForProduct, NATIVE_BILLING_PRODUCTS } from "../src/domain/nativeBilling";

const plans = readFileSync("src/screens/Plans/index.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20260903100000_native_billing_subscriptions.sql", "utf8");
const verifier = readFileSync("supabase/functions/billing-verify-purchase/index.ts", "utf8");
const docs = readFileSync("docs/native-billing.md", "utf8");

test("produtos nativos mapeiam somente Professional e Team", () => {
  assert.equal(nativeBillingPlanForProduct(NATIVE_BILLING_PRODUCTS.professional), "professional");
  assert.equal(nativeBillingPlanForProduct(NATIVE_BILLING_PRODUCTS.team), "team");
  assert.equal(nativeBillingPlanForProduct("fixar_founder"), null);
  assert.match(plans, /restaurar/i);
  assert.match(plans, /finishTransaction/);
});

test("billing server-side exige produto correspondente, owner e vínculo único", () => {
  assert.match(verifier, /PRODUCT_MISMATCH/);
  assert.match(verifier, /requireOwner/);
  assert.match(verifier, /applyVerifiedSubscription/);
  assert.match(migration, /provider_purchase_token/);
  assert.match(migration, /billing_webhook_events/);
  assert.doesNotMatch(verifier, /organization_id.*from.*client/i);
});

test("documentação não declara produtos ou credenciais como criados", () => {
  assert.match(docs, /Cadastrar manualmente|Cadastre manualmente/);
  assert.match(docs, /ainda dependem de configuração externa/i);
  assert.match(docs, /GOOGLE_PLAY_SERVICE_ACCOUNT_JSON/);
  assert.doesNotMatch(docs, /service account.*senha|private key.*=/i);
});
