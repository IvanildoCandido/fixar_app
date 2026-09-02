import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { commercialErrorMessage, parseCommercialError } from "../src/services/commercialErrors";

const migration = readFileSync("supabase/migrations/20260901190740_com3_resource_creation_enforcement.sql", "utf8");
const correction = readFileSync("supabase/migrations/20260901191004_com3_fix_asset_payload_argument.sql", "utf8");
const workOrderMigration = readFileSync("supabase/migrations/20260901193925_com3c_work_order_enforcement.sql", "utf8");
const workOrderGrantCorrection = readFileSync("supabase/migrations/20260901223000_com3c_minimum_work_order_grants.sql", "utf8");

function limitError(resource: "customer" | "equipment" | "qr_code") {
  return { message: "PLAN_LIMIT_REACHED", details: JSON.stringify({ code: "PLAN_LIMIT_REACHED", resource, usage: 10, limit: 10, requested: 1, plan_code: "free" }) };
}

test("interpreta erro comercial estruturado", () => {
  assert.deepEqual(parseCommercialError(limitError("customer")), { code: "PLAN_LIMIT_REACHED", resource: "customer", usage: 10, limit: 10, requested: 1, plan_code: "free" });
});

test("traduz limite de cliente sem decidir plano na UI", () => {
  assert.equal(commercialErrorMessage(limitError("customer")), "Você atingiu o limite de 10 clientes do seu plano.");
});

test("enforcement central cobre os três recursos", () => {
  assert.match(migration, /private\.assert_can_create_resource/);
  assert.match(migration, /p_resource not in \('customer', 'equipment', 'qr_code'\)/);
});

test("enforcement consulta entitlements e usage efetivos", () => {
  assert.match(migration, /private\.get_effective_organization_entitlements/);
  assert.match(migration, /private\.get_organization_commercial_usage/);
});

test("enforcement serializa criação por organização", () => {
  assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\(p_organization_id::text, 0\)\)/);
});

test("cliente só pode ser criado pela RPC autoritativa", () => {
  assert.match(migration, /create or replace function public\.create_customer/);
  assert.match(migration, /revoke insert on table public\.customers, public\.assets from authenticated/);
});

test("reserva QR valida o lote inteiro antes de inserir", () => {
  assert.match(migration, /requested_count integer/);
  assert.match(migration, /assert_can_create_resource\(target_organization_id, 'qr_code', requested_count\)/);
});

test("equipamento valida equipment e QR, exceto QR reservado", () => {
  assert.match(migration, /assert_can_create_resource\(target_organization_id, 'equipment', 1\)/);
  assert.match(migration, /if reservation\.id is null[\s\S]*private\.assert_can_create_resource\(target_organization_id, 'qr_code', 1\)/);
});

test("restauração de cliente e equipamento passa pelo enforcement", () => {
  assert.match(migration, /enforce_customer_restore/);
  assert.match(migration, /enforce_equipment_restore/);
  assert.match(migration, /old\.deleted_at is not null and new\.deleted_at is null/);
});

test("correção do parâmetro da RPC de equipamento foi aplicada", () => {
  assert.match(correction, /create function public\.create_asset_with_reserved_qr\(p_payload jsonb\)/);
  assert.match(correction, /p_payload->>'reference'/);
});

test("work_order usa o mesmo guard e quota mensal UTC", () => {
  assert.match(workOrderMigration, /when 'work_order' then 'work_orders_monthly'/);
  assert.match(workOrderMigration, /private\.assert_can_create_resource\(v_organization_id, 'work_order', 1\)/);
  assert.match(workOrderMigration, /pg_advisory_xact_lock/);
});

test("idempotência é resolvida antes da quota de work_order", () => {
  assert.ok(workOrderMigration.indexOf("if existing_order is not null then return existing_order") < workOrderMigration.indexOf("assert_can_create_resource(v_organization_id, 'work_order', 1)"));
});

test("INSERT direto de work_order é revogado e o batch permanece fora da quota", () => {
  assert.match(workOrderMigration, /revoke insert on table public\.work_orders from authenticated/);
  assert.match(workOrderMigration, /alter function public\.create_work_orders_batch\(jsonb\) security definer/);
  assert.doesNotMatch(workOrderMigration, /assert_can_create_resource\([^;]*'batch|feature_batch_orders/);
});

test("correção COM-3C remove privilégios que contornam RLS", () => {
  assert.match(workOrderGrantCorrection, /revoke truncate, references, trigger on table public\.work_orders from authenticated/);
});
