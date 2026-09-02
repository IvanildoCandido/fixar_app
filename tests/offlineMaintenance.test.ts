import assert from "node:assert/strict";
import test from "node:test";
import {
  clearOfflineMaintenances, listOfflineMaintenances, removeOfflineMaintenance, saveOfflineMaintenance, syncOfflineMaintenance, syncPendingMaintenances,
} from "../src/services/offlineMaintenance";

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: async (key: string) => values.get(key) ?? null, setItem: async (key: string, value: string) => { values.set(key, value); } };
}
const scope = { userId: "user-a", organizationId: "org-a" };
const form: any = {
  customerId: "customer", deviceId: "device", customer: { id: "customer" }, device: { id: "device" },
  services: [{ id: "service", name: "Limpeza", quantity: 1, price: 80 }],
  parts: [{ id: "part", name: "Capacitor", quantity: 2, price: 25 }],
  comments: "Observação preservada", total: 130, date: new Date().toISOString(), reminderEnabled: false,
  reminderIntervalDays: null, reminderDueAt: null,
  diagnosis: { reportedProblem: "Não refrigera", foundCondition: "Capacitor danificado", technicalDiagnosis: "Substituição necessária" },
  checks: [{ key: "compressor", label: "Compressor", status: "ok", observation: "Normal", order: 0 }],
  measurements: [{ key: "temperature", label: "Temperatura", value: 18, unit: "°C", source: "manual", order: 0 }],
  result: { equipmentStatus: "operational", problemResolved: "yes", returnRequired: false },
  technicianSignatureSvg: "<svg>tecnico</svg>", customerSignatureSvg: "<svg>cliente</svg>",
  customerSignerName: "Cliente Teste", signedAt: "2026-09-01T12:00:00.000Z",
  notification: false, reminderDays: "90", increment: "0", discount: "0",
};

test("rascunho sobrevive e permanece isolado por usuário e organização", async () => {
  const storage = memoryStorage();
  await saveOfflineMaintenance({ localId: "local-1", ...scope, status: "draft", form }, storage as any);
  assert.equal((await listOfflineMaintenances(scope, storage as any)).length, 1);
  assert.equal((await listOfflineMaintenances({ userId: "user-b", organizationId: "org-a" }, storage as any)).length, 0);
  assert.equal((await listOfflineMaintenances({ userId: "user-a", organizationId: "org-b" }, storage as any)).length, 0);
});

test("falha de sincronização preserva payload completo e nova tentativa remove após sucesso", async () => {
  const storage = memoryStorage();
  const record = await saveOfflineMaintenance({ localId: "local-2", ...scope, status: "pending", form }, storage as any);
  assert.equal(await syncOfflineMaintenance(record, async () => { throw new Error("offline"); }, storage as any), false);
  const failed = (await listOfflineMaintenances(scope, storage as any))[0];
  assert.equal(failed.status, "error");
  assert.equal(failed.form.technicianSignatureSvg, "<svg>tecnico</svg>");
  assert.equal(await syncOfflineMaintenance(failed, async () => ({ id: "server-id" }), storage as any), true);
  assert.equal((await listOfflineMaintenances(scope, storage as any)).length, 0);
});

test("exclusão local não afeta registros de outro usuário", async () => {
  const storage = memoryStorage();
  await saveOfflineMaintenance({ localId: "shared", ...scope, status: "pending", form }, storage as any);
  await saveOfflineMaintenance({ localId: "shared", userId: "user-b", organizationId: "org-a", status: "pending", form }, storage as any);
  await removeOfflineMaintenance("shared", scope, storage as any);
  assert.equal((await listOfflineMaintenances(scope, storage as any)).length, 0);
  assert.equal((await listOfflineMaintenances({ userId: "user-b", organizationId: "org-a" }, storage as any)).length, 1);
});

test("dispensa todas as manutenções somente do usuário e empresa ativos", async () => {
  const storage = memoryStorage();
  await saveOfflineMaintenance({ localId: "one", ...scope, status: "pending", form }, storage as any);
  await saveOfflineMaintenance({ localId: "two", ...scope, status: "draft", form }, storage as any);
  await saveOfflineMaintenance({ localId: "other-user", userId: "user-b", organizationId: "org-a", status: "pending", form }, storage as any);
  await clearOfflineMaintenances(scope, storage as any);
  assert.equal((await listOfflineMaintenances(scope, storage as any)).length, 0);
  assert.equal((await listOfflineMaintenances({ userId: "user-b", organizationId: "org-a" }, storage as any)).length, 1);
});

test("limite comercial bloqueia sem perder payload técnico, itens, observações e ambas as assinaturas", async () => {
  const storage = memoryStorage();
  const record = await saveOfflineMaintenance({ localId: "commercial-1", ...scope, status: "pending", form }, storage as any);
  const result = await syncOfflineMaintenance(record, async () => {
    const error = new Error("PLAN_LIMIT_REACHED") as Error & { code: string; resource: string };
    error.code = "PLAN_LIMIT_REACHED"; error.resource = "work_order";
    throw error;
  }, storage as any);
  const blocked = (await listOfflineMaintenances(scope, storage as any))[0];
  assert.equal(result, false);
  assert.equal(blocked.status, "blocked_commercial");
  assert.equal(blocked.localId, "commercial-1");
  assert.deepEqual(blocked.form.services, form.services);
  assert.deepEqual(blocked.form.parts, form.parts);
  assert.equal(blocked.form.comments, form.comments);
  assert.deepEqual(blocked.form.diagnosis, form.diagnosis);
  assert.deepEqual(blocked.form.checks, form.checks);
  assert.deepEqual(blocked.form.measurements, form.measurements);
  assert.equal(blocked.form.technicianSignatureSvg, "<svg>tecnico</svg>");
  assert.equal(blocked.form.customerSignatureSvg, "<svg>cliente</svg>");
  assert.equal(await syncPendingMaintenances(scope, async () => { throw new Error("auto retry must not run"); }, storage as any), 0);
});

test("retry manual reutiliza localId e remove local apenas após sucesso", async () => {
  const storage = memoryStorage();
  const record = await saveOfflineMaintenance({ localId: "commercial-2", ...scope, status: "blocked_commercial", form }, storage as any);
  let receivedLocalId = "";
  let receivedPayload: unknown;
  assert.equal(await syncOfflineMaintenance(record, async (localId, payload) => {
    receivedLocalId = localId;
    receivedPayload = payload;
    assert.equal((await listOfflineMaintenances(scope, storage as any)).length, 1);
    return { id: "server-id" };
  }, storage as any), true);
  assert.equal(receivedLocalId, "commercial-2");
  assert.deepEqual(receivedPayload, form);
  assert.equal((await listOfflineMaintenances(scope, storage as any)).length, 0);
});
