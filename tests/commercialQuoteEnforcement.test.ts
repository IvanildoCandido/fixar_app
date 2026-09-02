import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { commercialErrorMessage, parseCommercialError } from "../src/services/commercialErrors";

const migration = readFileSync("supabase/migrations/20260901191616_com3b_quote_creation_enforcement.sql", "utf8");
const correction = readFileSync("supabase/migrations/20260901191653_com3b_fix_quote_item_enum.sql", "utf8");

function quoteLimitError() {
  return { message: "PLAN_LIMIT_REACHED", details: JSON.stringify({ code: "PLAN_LIMIT_REACHED", resource: "quote", usage: 3, limit: 3, requested: 1, plan_code: "free" }) };
}

test("reutiliza o erro comercial para orçamento", () => {
  assert.equal(parseCommercialError(quoteLimitError())?.resource, "quote");
  assert.equal(commercialErrorMessage(quoteLimitError()), "Você atingiu o limite de 3 orçamentos do seu plano.");
});

test("guard central inclui quote sem duplicar quota", () => {
  assert.match(migration, /when 'quote' then 'quotes_monthly'/);
  assert.match(migration, /private\.assert_can_create_resource\(target_organization_id, 'quote', 1\)/);
});

test("criação de quote e itens é uma RPC única", () => {
  assert.match(migration, /create or replace function public\.create_quote\(payload jsonb\)/);
  assert.match(migration, /insert into public\.quote_items/);
});

test("quote não pode ser inserido diretamente por authenticated", () => {
  assert.match(migration, /revoke insert on table public\.quotes from authenticated/);
});

test("a RPC de quote mantém autorização da organização", () => {
  assert.match(migration, /private\.has_organization_role\(target_organization_id/);
  assert.match(migration, /organization_id, customer_id/);
});

test("a criação usa lock transacional compartilhado", () => {
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /private\.get_organization_commercial_usage/);
});

test("soft delete não consome quota mensal", () => {
  assert.match(migration, /quotes_commercial_restore/);
  assert.match(migration, /old\.deleted_at is not null and new\.deleted_at is null/);
});

test("override de quotes_monthly é resolvido pelo guard central", () => {
  assert.match(migration, /limit_key text.*quotes_monthly/s);
  assert.match(migration, /limit_value is not null and usage_value \+ p_requested > limit_value/s);
});

test("itens preservam o enum catalog_item_kind", () => {
  assert.match(correction, /'service'::public\.catalog_item_kind/);
  assert.match(correction, /'part'::public\.catalog_item_kind/);
});

test("ordens não são tocadas pela migration de quote", () => {
  assert.doesNotMatch(migration, /create_work_orders_batch|create_work_order_offline|work_orders.*insert/i);
});
