import assert from "node:assert/strict";
import test from "node:test";
import {
  listOfflineMaintenances, removeOfflineMaintenance, saveOfflineMaintenance, syncOfflineMaintenance,
} from "../src/services/offlineMaintenance";

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: async (key: string) => values.get(key) ?? null, setItem: async (key: string, value: string) => { values.set(key, value); } };
}
const scope = { userId: "user-a", organizationId: "org-a" };
const form: any = { customerId: "customer", deviceId: "device", customer: { id: "customer" }, device: { id: "device" }, services: [], parts: [], comments: "", total: 0, date: new Date().toISOString(), reminderEnabled: false, reminderIntervalDays: null, reminderDueAt: null, diagnosis: {}, checks: [], measurements: [], result: {}, technicianSignatureSvg: "<svg />", customerSignatureSvg: "", customerSignerName: "", signedAt: null, notification: false, reminderDays: "90", increment: "0", discount: "0" };

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
  assert.equal(failed.form.technicianSignatureSvg, "<svg />");
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
