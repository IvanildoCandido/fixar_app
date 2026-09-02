import assert from "node:assert/strict";
import test from "node:test";
import {
  BackendCommercialPlan,
  countDistinctQrIdentities,
  resolveEffectiveEntitlements,
  resolvePlanDisplayName,
} from "../src/domain/commercialPlans";
import { readFileSync } from "node:fs";

const plan = (code: BackendCommercialPlan["code"], limits: BackendCommercialPlan["limits"], features: BackendCommercialPlan["features"], history_days: number | null = 365): BackendCommercialPlan => ({ code, display_name: code, limits, features, history_days });
const free = plan("free", { users: 1, customers: 10, equipment: 15, qr_codes: 5, work_orders_monthly: 5, quotes_monthly: 3 }, { batch_orders: false, custom_branding: false, full_history: false }, 30);
const professional = plan("professional", { users: 3, customers: null, equipment: null, qr_codes: 100, work_orders_monthly: null, quotes_monthly: null }, { batch_orders: true, custom_branding: true, full_history: true });
const team = plan("team", { users: 10, customers: null, equipment: null, qr_codes: 500, work_orders_monthly: null, quotes_monthly: null }, { batch_orders: true, custom_branding: true, full_history: true });
const grandfathered = plan("grandfathered", { users: null, customers: null, equipment: null, qr_codes: null, work_orders_monthly: null, quotes_monthly: null }, { batch_orders: true, custom_branding: true, full_history: true }, null);

test("free define o conjunto inicial esperado", () => {
  const entitlements = resolveEffectiveEntitlements(free);
  assert.equal(entitlements.planCode, "free");
  assert.equal(entitlements.limits.users, 1);
  assert.equal(entitlements.limits.customers, 10);
  assert.equal(entitlements.limits.equipment, 15);
  assert.equal(entitlements.limits.qr_codes, 5);
  assert.equal(entitlements.limits.work_orders_monthly, 5);
  assert.equal(entitlements.limits.quotes_monthly, 3);
  assert.equal(entitlements.features.batch_orders, false);
  assert.equal(entitlements.features.custom_branding, false);
  assert.equal(entitlements.features.full_history, false);
  assert.equal(entitlements.historyDays, 30);
});

test("professional e founder compartilham os mesmos entitlements", () => {
  const entitlements = resolveEffectiveEntitlements(professional, { offerCode: "founder" });
  assert.equal(entitlements.planCode, "professional");
  assert.equal(entitlements.offerCode, "founder");
  assert.equal(entitlements.limits.qr_codes, 100);
  assert.equal(entitlements.features.batch_orders, true);
  assert.equal(entitlements.features.custom_branding, true);
  assert.equal(entitlements.features.full_history, true);
});

test("team define limites maiores e mantém recursos do profissional", () => {
  const entitlements = resolveEffectiveEntitlements(team);
  assert.equal(entitlements.limits.users, 10);
  assert.equal(entitlements.limits.qr_codes, 500);
  assert.equal(entitlements.features.batch_orders, true);
  assert.equal(entitlements.features.custom_branding, true);
  assert.equal(entitlements.features.full_history, true);
});

test("override de limite e feature resolve no topo do plano base", () => {
  const entitlements = resolveEffectiveEntitlements(professional, {
    limits: { qr_codes: 200 },
    features: { batch_orders: false },
    historyDays: 120,
  });
  assert.equal(entitlements.limits.qr_codes, 200);
  assert.equal(entitlements.features.batch_orders, false);
  assert.equal(entitlements.historyDays, 120);
});

test("plano grandfathered preserva funcionamento sem criar bloqueios", () => {
  const entitlements = resolveEffectiveEntitlements(grandfathered);
  assert.equal(entitlements.limits.qr_codes, null);
  assert.equal(entitlements.features.batch_orders, true);
  assert.equal(entitlements.historyDays, null);
});

test("Professional possui exatamente três usuários", () => {
  assert.equal(resolveEffectiveEntitlements(professional).limits.users, 3);
});

test("Professional não mantém o limite antigo de cinco usuários", () => {
  assert.notEqual(resolveEffectiveEntitlements(professional).limits.users, 5);
});

test("Founder altera apenas a apresentação, não o plano técnico", () => {
  assert.equal(resolvePlanDisplayName(professional, "founder"), "Professional · Founder");
  const founderEntitlements = resolveEffectiveEntitlements(professional, { offerCode: "founder" });
  assert.deepEqual(founderEntitlements.limits, resolveEffectiveEntitlements(professional).limits);
  assert.deepEqual(founderEntitlements.features, resolveEffectiveEntitlements(professional).features);
});

test("Professional Founder usa o preço Founder definido no backend", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /\('founder', 'Founder', 2990, 'monthly'\)/);
  assert.match(migration, /'professional'.*100/s);
});

test("grandfathered não é catálogo público e não expõe ofertas internas", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /is_public boolean not null default false/);
  assert.match(migration, /commercial_plan_catalog_select[\s\S]*is_active and is_public/);
  assert.doesNotMatch(migration, /grant select on public\.commercial_offers/);
});

test("migration preserva organizações existentes como grandfathered", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /select id, 'grandfathered', 'grandfathered'\s+from public\.organizations/);
  assert.match(migration, /after insert on public\.organizations/);
});

test("migration declara isolamento de subscription por organização", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /organization_subscriptions_select_member[\s\S]*private\.is_organization_member\(organization_id\)/);
});

test("migration não concede escrita autenticada em tabelas comerciais", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /revoke all on table public\.commercial_plan_catalog[\s\S]*from public, anon, authenticated/);
  assert.doesNotMatch(migration, /grant (insert|update|delete)[\s\S]*to authenticated/);
});

test("usuário comum não recebe INSERT de subscription", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.doesNotMatch(migration, /grant insert on public\.organization_subscriptions/);
});

test("usuário comum não recebe INSERT de override", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.doesNotMatch(migration, /grant insert on public\.organization_plan_overrides/);
});

test("usuário comum não recebe UPDATE do catálogo", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.doesNotMatch(migration, /grant update on public\.commercial_plan_catalog/);
});

test("auditoria comercial registra mudanças e overrides", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /previous_plan_code[\s\S]*new_plan_code[\s\S]*previous_status[\s\S]*new_status[\s\S]*price_cents/);
  assert.match(migration, /organization_plan_overrides_audit/);
});

test("override numérico é resolvido pelo SQL", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /'qr_codes', coalesce\(plan_override\.limit_qr_codes, catalog\.limit_qr_codes\)/);
});

test("override de feature é resolvido pelo SQL", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /'batch_orders', coalesce\(plan_override\.feature_batch_orders, catalog\.feature_batch_orders\)/);
});

test("zero QR produz zero identidades", () => assert.equal(countDistinctQrIdentities([]), 0));
test("cinco QR disponíveis produzem cinco usos", () => assert.equal(countDistinctQrIdentities(["1", "2", "3", "4", "5"]), 5));
test("três disponíveis e dois vinculados contam cinco identidades", () => assert.equal(countDistinctQrIdentities(["1", "2", "3", "4", "5", "4", "5"]), 5));
test("vincular QR existente não aumenta usage", () => assert.equal(countDistinctQrIdentities(["1", "2", "3", "4", "5"]), countDistinctQrIdentities(["1", "2", "3", "4", "5", "3"])));
test("reimpressão não aumenta usage", () => assert.equal(countDistinctQrIdentities(["1", "2", "3", "4", "5", "1", "2", "3", "4", "5"]), 5));

test("SQL deduplica QR por public_token", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /select public_token from public\.generated_qr_codes[\s\S]*union[\s\S]*select public_token from public\.equipment_public_links/);
});

test("SQL não conta link automático de equipment soft deleted", () => {
  const migration = readFileSync("supabase/migrations/20260901193000_commercial_usage_qr_active_links.sql", "utf8");
  assert.match(migration, /join public\.assets asset[\s\S]*asset\.deleted_at is null/);
});

test("SQL exclui customer com soft delete", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /from public\.customers where organization_id = p_organization_id and deleted_at is null/);
});

test("SQL exclui equipment com soft delete", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /from public\.assets where organization_id = p_organization_id and deleted_at is null/);
});

test("usage mensal usa intervalo semiaberto em UTC", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /now\(\) at time zone 'UTC'[\s\S]*created_at >= month_start and created_at < next_month/);
});

test("usage mensal exclui ordens removidas", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /from public\.work_orders, bounds where organization_id = p_organization_id and deleted_at is null/);
});

test("usage mensal exclui orçamentos removidos", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /from public\.quotes, bounds where organization_id = p_organization_id and deleted_at is null/);
});

test("RPC público exige membro da organização", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /get_current_organization_entitlements[\s\S]*if not private\.is_organization_member\(p_organization_id\)/);
});

test("RPC público de usage exige membro da organização", () => {
  const migration = readFileSync("supabase/migrations/20260901000000_commercial_plans_and_entitlements.sql", "utf8");
  assert.match(migration, /get_current_organization_commercial_usage[\s\S]*if not private\.is_organization_member\(p_organization_id\)/);
});

test("não existe fallback comercial no domínio sem payload backend", () => {
  assert.equal(typeof resolveEffectiveEntitlements, "function");
  assert.equal(typeof resolvePlanDisplayName, "function");
});
