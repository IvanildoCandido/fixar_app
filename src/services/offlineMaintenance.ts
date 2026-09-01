import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { Customer, Device, MaintenanceDiagnosis, MaintenanceResult, Repair, TechnicalCheck, TechnicalMeasurement } from "../types/data";

const STORAGE_KEY = "@fixar:offline-maintenance:v1";

export type OfflineMaintenanceStatus = "draft" | "pending" | "syncing" | "error";
export type OfflineMaintenancePayload = {
  customerId: string; deviceId: string; services: any[]; parts: any[]; comments: string;
  total: number; date: string; assignedTo?: string; reminderEnabled: boolean;
  reminderIntervalDays: number | null; reminderDueAt: string | null;
  diagnosis: MaintenanceDiagnosis; checks: TechnicalCheck[]; measurements: TechnicalMeasurement[];
  result: MaintenanceResult; technicianName?: string; technicianSignatureSvg: string;
  customerSignatureSvg: string; customerSignerName: string; signedAt: string | null;
};
export type OfflineMaintenanceForm = OfflineMaintenancePayload & {
  customer: Customer; device: Device; notification: boolean; reminderDays: string;
  increment: string; discount: string;
};
export type OfflineMaintenanceRecord = {
  localId: string; userId: string; organizationId: string; status: OfflineMaintenanceStatus;
  form: OfflineMaintenanceForm; createdAt: string; updatedAt: string; lastError?: string;
};

type Storage = Pick<typeof AsyncStorage, "getItem" | "setItem">;
export type OfflineScope = { userId: string; organizationId: string };

async function readAll(storage: Storage = AsyncStorage): Promise<OfflineMaintenanceRecord[]> {
  const value = await storage.getItem(STORAGE_KEY);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error("Formato local inválido.");
    return parsed;
  } catch {
    throw new Error("Os dados locais de manutenção não puderam ser lidos.");
  }
}

async function writeAll(records: OfflineMaintenanceRecord[], storage: Storage = AsyncStorage) {
  await storage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function createOfflineMaintenanceId() {
  return String(uuid.v4());
}

export function isNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /network request failed|failed to fetch|networkerror|fetch failed|connection|offline|timeout/i.test(message);
}

export async function listOfflineMaintenances(scope: OfflineScope, storage: Storage = AsyncStorage) {
  const records = await readAll(storage);
  return records
    .filter((item) => item.userId === scope.userId && item.organizationId === scope.organizationId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getOfflineMaintenance(localId: string, scope: OfflineScope, storage: Storage = AsyncStorage) {
  return (await listOfflineMaintenances(scope, storage)).find((item) => item.localId === localId) ?? null;
}

export async function saveOfflineMaintenance(
  input: Omit<OfflineMaintenanceRecord, "createdAt" | "updatedAt">,
  storage: Storage = AsyncStorage
) {
  const records = await readAll(storage);
  const index = records.findIndex((item) => item.localId === input.localId && item.userId === input.userId && item.organizationId === input.organizationId);
  const now = new Date().toISOString();
  const next: OfflineMaintenanceRecord = { ...input, createdAt: index >= 0 ? records[index].createdAt : now, updatedAt: now };
  if (index >= 0) records[index] = next; else records.push(next);
  await writeAll(records, storage);
  return next;
}

export async function removeOfflineMaintenance(localId: string, scope: OfflineScope, storage: Storage = AsyncStorage) {
  const records = await readAll(storage);
  await writeAll(records.filter((item) => !(item.localId === localId && item.userId === scope.userId && item.organizationId === scope.organizationId)), storage);
}

export async function clearOfflineMaintenances(scope: OfflineScope, storage: Storage = AsyncStorage) {
  const records = await readAll(storage);
  await writeAll(records.filter((item) => item.userId !== scope.userId || item.organizationId !== scope.organizationId), storage);
}

export async function markOfflineMaintenance(
  localId: string, scope: OfflineScope, status: OfflineMaintenanceStatus, lastError?: string, storage: Storage = AsyncStorage
) {
  const record = await getOfflineMaintenance(localId, scope, storage);
  if (!record) return null;
  return saveOfflineMaintenance({ ...record, status, lastError }, storage);
}

export async function syncOfflineMaintenance(
  record: OfflineMaintenanceRecord,
  send: (localId: string, payload: OfflineMaintenancePayload) => Promise<unknown>,
  storage: Storage = AsyncStorage
) {
  const scope = { userId: record.userId, organizationId: record.organizationId };
  await markOfflineMaintenance(record.localId, scope, "syncing", undefined, storage);
  try {
    await send(record.localId, record.form);
    await removeOfflineMaintenance(record.localId, scope, storage);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível sincronizar.";
    await markOfflineMaintenance(record.localId, scope, "error", message, storage);
    return false;
  }
}

export async function syncPendingMaintenances(
  scope: OfflineScope,
  send: (localId: string, payload: OfflineMaintenancePayload) => Promise<unknown>,
  storage: Storage = AsyncStorage
) {
  const pending = (await listOfflineMaintenances(scope, storage)).filter((item) => item.status !== "draft");
  const results = [];
  for (const record of pending) results.push(await syncOfflineMaintenance(record, send, storage));
  return results.filter(Boolean).length;
}

export function offlineMaintenanceToRepair(record: OfflineMaintenanceRecord): Repair {
  return {
    id: `local:${record.localId}`, Customer: record.form.customer, Device: record.form.device,
    date: record.form.date, comments: record.form.comments, parts: record.form.parts,
    services: record.form.services, total: String(record.form.total), diagnosis: record.form.diagnosis,
    checks: record.form.checks, measurements: record.form.measurements, result: record.form.result,
    technicianName: record.form.technicianName, customerSignerName: record.form.customerSignerName,
    technicianSignatureSvg: record.form.technicianSignatureSvg,
    customerSignatureSvg: record.form.customerSignatureSvg, signedAt: record.form.signedAt ?? undefined,
    offlineStatus: record.status, offlineLocalId: record.localId,
  };
}
