import { supabase } from "./supabase";
import { Page, Repair, RepairFilters } from "../types/data";
import { cachedQuery, clearQueryCache, invalidateQueries } from "./queryCache";
import type { OfflineMaintenancePayload } from "./offlineMaintenance";

let activeOrganizationId: string | null = null;

export function setActiveOrganizationId(organizationId: string | null) {
  if (activeOrganizationId !== organizationId) clearQueryCache();
  activeOrganizationId = organizationId;
}

function requireOrganization() {
  if (!activeOrganizationId) throw new Error("Nenhuma organização ativa.");
  return activeOrganizationId;
}

function unwrap<T>({ data, error }: { data: T | null; error: Error | null }): T {
  if (error) throw error;
  return data as T;
}

function mapCustomer(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    document: row.document ?? "",
    devicesQuantity: row.assets?.[0]?.count ?? 0,
  };
}

function mapDevice(row: any) {
  return {
    id: row.id,
    customerId: row.customer_id,
    reference: row.reference,
    model: row.model ?? "",
    brand: row.brand ?? "",
    location: row.location,
    equipmentType: row.equipment_type ?? "",
    serialNumber: row.serial_number ?? "",
    capacityBtu: row.capacity_btu ?? null,
    voltage: row.voltage ?? null,
    phase: row.phase ?? null,
    refrigerant: row.refrigerant ?? "",
    installedAt: row.installed_at ?? null,
    Customer: mapCustomer(row.Customer ?? row.customers ?? {}),
  };
}

function mapCatalogItem(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.unit_price),
    quantity: Number(row.quantity ?? 1),
    total: Number(row.total ?? row.unit_price ?? 0),
  };
}

function mapRepair(row: any) {
  const items = row.work_order_items ?? [];
  return {
    id: row.id,
    Customer: mapCustomer(row.Customer ?? {}),
    Device: mapDevice({ ...row.Device, Customer: row.Customer }),
    date: row.completed_at ?? row.created_at,
    comments: row.comments ?? "",
    parts: items.filter((item: any) => item.kind === "part").map(mapCatalogItem),
    services: items.filter((item: any) => item.kind === "service").map(mapCatalogItem),
    total: String(row.total),
    diagnosis: {
      reportedProblem: row.reported_problem ?? "",
      foundCondition: row.found_condition ?? "",
      technicalDiagnosis: row.technical_diagnosis ?? "",
    },
    checks: (row.work_order_technical_checks ?? []).map((item: any) => ({
      key: item.key, label: item.label, category: item.category ?? "",
      status: item.status, observation: item.observation ?? "", order: item.sort_order,
    })),
    measurements: (row.work_order_measurements ?? []).map((item: any) => ({
      key: item.key, label: item.label, value: Number(item.value), unit: item.unit,
      source: item.source, order: item.sort_order,
    })),
    result: {
      equipmentStatus: row.equipment_status ?? undefined,
      problemResolved: row.problem_resolved ?? undefined,
      returnRequired: row.return_required ?? undefined,
      returnReason: row.return_reason ?? "",
      customerRecommendation: row.customer_recommendation ?? "",
      recommendationPriority: row.recommendation_priority ?? undefined,
    },
    technicianName: row.technician_name ?? "",
    customerSignerName: row.customer_signer_name ?? "",
    technicianSignatureSvg: row.technician_signature_svg ?? "",
    customerSignatureSvg: row.customer_signature_svg ?? "",
    signedAt: row.signed_at ?? undefined,
  };
}

function mapMaintenanceReminder(row: any) {
  return {
    id: row.id,
    dueAt: row.reminder_due_at,
    intervalDays: row.reminder_interval_days,
    Customer: mapCustomer(row.Customer ?? {}),
    Device: mapDevice({ ...row.Device, Customer: row.Customer }),
  };
}

async function listCustomers() {
  const organizationId = requireOrganization();
  return cachedQuery(`customers:${organizationId}`, 300000, async () => {
  const result = await supabase.from("customers").select("id, name, email, phone, address, document, assets(count)")
    .eq("organization_id", requireOrganization()).is("deleted_at", null).order("name");
  return unwrap<any[]>(result as any).map(mapCustomer);
  });
}

async function listDevices() {
  const organizationId = requireOrganization();
  return cachedQuery(`devices:${organizationId}`, 300000, async () => {
  const result = await supabase.from("assets").select("id, customer_id, reference, model, brand, location, equipment_type, serial_number, capacity_btu, voltage, phase, refrigerant, installed_at, Customer:customers(id, name, email, phone, address, document)")
    .eq("organization_id", requireOrganization()).is("deleted_at", null).order("reference");
  return unwrap<any[]>(result as any).map(mapDevice);
  });
}

export async function listDevicesByCustomer(customerId: string) {
  const organizationId = requireOrganization();
  return cachedQuery(`devices:${organizationId}:customer:${customerId}`, 300000, async () => {
    const result = await supabase.from("assets")
      .select("id, customer_id, reference, model, brand, location, equipment_type, serial_number, capacity_btu, voltage, phase, refrigerant, installed_at, Customer:customers(id, name, email, phone, address, document)")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("reference");
    return unwrap<any[]>(result as any).map(mapDevice);
  });
}

async function listCatalog(kind: "part" | "service") {
  const organizationId = requireOrganization();
  return cachedQuery(`catalog:${organizationId}:${kind}`, 300000, async () => {
  const result = await supabase.from("catalog_items").select("id, name, description, unit_price")
    .eq("organization_id", requireOrganization()).eq("kind", kind)
    .is("deleted_at", null).order("name");
  return unwrap<any[]>(result as any).map(mapCatalogItem);
  });
}

async function listRepairs() {
  const result = await supabase.from("work_orders")
    .select("*, Customer:customers(*), Device:assets(*), work_order_items(*), work_order_technical_checks(*), work_order_measurements(*)")
    .eq("organization_id", requireOrganization()).is("deleted_at", null)
    .order("completed_at", { ascending: false, nullsFirst: false });
  return unwrap<any[]>(result as any).map(mapRepair);
}

const repairSummarySelect = "id, total, completed_at, created_at, comments, Customer:customers(id, name, email, phone, address, document), Device:assets(id, customer_id, reference, model, brand, location)";
export async function listRepairSummaries(page = 0, pageSize = 20, filters: RepairFilters = {}): Promise<Page<Repair>> {
  const organizationId = requireOrganization();
  const key = `repair-summaries:${organizationId}:${page}:${pageSize}:${JSON.stringify(filters)}`;
  return cachedQuery(key, 60000, async () => {
    let query = supabase.from("work_orders").select(repairSummarySelect, { count: "exact" })
      .eq("organization_id", organizationId).is("deleted_at", null)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false });
    if (filters.customerId) query = query.eq("customer_id", filters.customerId);
    if (filters.deviceId) query = query.eq("asset_id", filters.deviceId);
    if (filters.startAt) query = query.gte("completed_at", filters.startAt);
    if (filters.endAt) query = query.lte("completed_at", filters.endAt);
    const from = page * pageSize;
    const result = await query.range(from, from + pageSize - 1);
    if (result.error) throw result.error;
    const items = (result.data ?? []).map(mapRepair);
    const total = result.count ?? items.length;
    return { items, total, page, pageSize, hasMore: from + items.length < total };
  });
}

export async function getRepairDetail(id: string): Promise<Repair> {
  const organizationId = requireOrganization();
  return cachedQuery(`repair-detail:${organizationId}:${id}`, 300000, async () => {
    const result = await supabase.from("work_orders")
      .select("*, Customer:customers(*), Device:assets(*), work_order_items(*), work_order_technical_checks(*), work_order_measurements(*)")
      .eq("organization_id", organizationId).eq("id", id).is("deleted_at", null).single();
    return mapRepair(unwrap<any>(result as any));
  });
}

export type EquipmentPublicLink = { publicToken: string };
export async function getEquipmentQrIdentity(assetId: string): Promise<EquipmentPublicLink> {
  const { data, error } = await supabase.rpc("manage_equipment_public_link", {
    target_asset_id: assetId,
    next_enabled: true,
    rotate_token: false,
  });
  if (error) throw error;
  const link = data?.[0];
  if (!link) throw new Error("Não foi possível gerar o QR Code público.");
  return { publicToken: link.public_token };
}

export async function resolveEquipmentQr(token: string): Promise<string> {
  const organizationId = requireOrganization();
  const { data, error } = await supabase.rpc("resolve_equipment_qr", {
    token,
    target_organization_id: organizationId,
  });
  if (error) throw error;
  if (!data) throw new Error("Este QR Code não pertence à organização ativa.");
  return data as string;
}
export async function listRepairDetailsForReport(filters: RepairFilters = {}): Promise<Repair[]> {
  const organizationId = requireOrganization();
  let query = supabase.from("work_orders")
    .select("*, Customer:customers(*), Device:assets(*), work_order_items(*), work_order_technical_checks(*), work_order_measurements(*)")
    .eq("organization_id", organizationId).is("deleted_at", null).order("completed_at", { ascending: false });
  if (filters.customerId) query = query.eq("customer_id", filters.customerId);
  if (filters.deviceId) query = query.eq("asset_id", filters.deviceId);
  if (filters.startAt) query = query.gte("completed_at", filters.startAt);
  if (filters.endAt) query = query.lte("completed_at", filters.endAt);
  const result = await query;
  return unwrap<any[]>(result as any).map(mapRepair);
}

export type ReminderScope = "all" | "overdue" | "today" | "next7";
export async function listMaintenanceRemindersPage(page = 0, pageSize = 20, scope: ReminderScope = "all") {
  const { data: authData, error: authError } = await supabase.auth.getSession();
  if (authError) throw authError;
  if (!authData.session?.user) return { items: [], total: 0, page, pageSize, hasMore: false };

  const organizationId = requireOrganization();
  const userId = authData.session.user.id;
  return cachedQuery(`reminders:${organizationId}:${userId}:${scope}:${page}:${pageSize}`, 60000, async () => {
  const from = page * pageSize;
  let query = supabase.from("work_orders")
    .select("id, reminder_due_at, reminder_interval_days, Customer:customers(id, name, email, phone, address, document), Device:assets(id, customer_id, reference, model, brand, location)", { count: "exact" })
    .eq("organization_id", organizationId)
    .eq("assigned_to", userId)
    .eq("reminder_enabled", true)
    .not("reminder_due_at", "is", null)
    .is("deleted_at", null);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const tomorrow = new Date(start); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(start); nextWeek.setDate(nextWeek.getDate() + 8);
  if (scope === "overdue") query = query.lt("reminder_due_at", start.toISOString());
  if (scope === "today") query = query.gte("reminder_due_at", start.toISOString()).lt("reminder_due_at", tomorrow.toISOString());
  if (scope === "next7") query = query.gte("reminder_due_at", tomorrow.toISOString()).lt("reminder_due_at", nextWeek.toISOString());
  const result = await query.order("reminder_due_at", { ascending: true }).order("id", { ascending: true }).range(from, from + pageSize - 1);
  const items = unwrap<any[]>(result as any).map(mapMaintenanceReminder);
  const total = result.count ?? items.length;
  return { items, total, page, pageSize, hasMore: from + items.length < total };
  });
}

async function listMaintenanceReminders() { return (await listMaintenanceRemindersPage(0, 5)).items; }

async function createRepair(payload: any) {
  const organizationId = requireOrganization();
  const services = payload.services ?? [];
  const parts = payload.parts ?? [];
  const subtotal = [...services, ...parts].reduce(
    (sum, item) => sum + Number(item.quantity ?? 1) * Number(item.price ?? 0), 0
  );
  const order = unwrap<any>((await supabase.from("work_orders").insert({
    organization_id: organizationId,
    customer_id: payload.customerId,
    asset_id: payload.deviceId,
    status: "completed",
    comments: payload.comments || null,
    subtotal,
    total: Number(payload.total ?? subtotal),
    completed_at: payload.date ?? new Date().toISOString(),
    assigned_to: payload.assignedTo ?? null,
    reminder_enabled: Boolean(payload.reminderEnabled),
    reminder_interval_days: payload.reminderIntervalDays ?? null,
    reminder_due_at: payload.reminderDueAt ?? null,
    reported_problem: payload.diagnosis?.reportedProblem || null,
    found_condition: payload.diagnosis?.foundCondition || null,
    technical_diagnosis: payload.diagnosis?.technicalDiagnosis || null,
    equipment_status: payload.result?.equipmentStatus ?? null,
    problem_resolved: payload.result?.problemResolved ?? null,
    return_required: payload.result?.returnRequired ?? null,
    return_reason: payload.result?.returnReason || null,
    customer_recommendation: payload.result?.customerRecommendation || null,
    recommendation_priority: payload.result?.recommendationPriority ?? null,
    technician_name: payload.technicianName || null,
    customer_signer_name: payload.customerSignerName || null,
    technician_signature_svg: payload.technicianSignatureSvg || null,
    customer_signature_svg: payload.customerSignatureSvg || null,
    signed_at: payload.signedAt ?? null,
  }).select("id").single()) as any);

  const items = [
    ...services.map((item: any) => ({ ...item, kind: "service" })),
    ...parts.map((item: any) => ({ ...item, kind: "part" })),
  ].map((item) => ({
    organization_id: organizationId,
    work_order_id: order.id,
    catalog_item_id: item.id,
    kind: item.kind,
    name: item.name,
    description: item.description || null,
    quantity: Number(item.quantity ?? 1),
    unit_price: Number(item.price ?? 0),
  }));
  if (items.length) {
    const result = await supabase.from("work_order_items").insert(items);
    if (result.error) {
      await supabase.from("work_orders").delete().eq("id", order.id);
      throw result.error;
    }
  }
  const checks = (payload.checks ?? []).map((item: any) => ({
    organization_id: organizationId, work_order_id: order.id, key: item.key,
    label: item.label, category: item.category || null, status: item.status,
    observation: item.observation || null, sort_order: item.order ?? 0,
  }));
  const measurements = (payload.measurements ?? []).map((item: any) => ({
    organization_id: organizationId, work_order_id: order.id, key: item.key,
    label: item.label, value: Number(item.value), unit: item.unit,
    source: item.source ?? "manual", sort_order: item.order ?? 0,
  }));
  for (const [table, rows] of [
    ["work_order_technical_checks", checks],
    ["work_order_measurements", measurements],
  ] as const) {
    if (!rows.length) continue;
    const result = await supabase.from(table).insert(rows as any);
    if (result.error) {
      await supabase.from("work_orders").delete().eq("id", order.id);
      throw result.error;
    }
  }
  invalidateQueries(`repair-summaries:${organizationId}`); invalidateQueries(`reminders:${organizationId}`);
  return order;
}

export async function createRepairIdempotent(localId: string, payload: OfflineMaintenancePayload) {
  const organizationId = requireOrganization();
  const result = await supabase.rpc("create_work_order_offline", {
    payload: { ...payload, localId, organizationId },
  });
  if (result.error) throw result.error;
  invalidateQueries(`repair-summaries:${organizationId}`);
  invalidateQueries(`reminders:${organizationId}`);
  return { id: result.data as string };
}

export async function createRepairsBatch(payload: any): Promise<Array<{ id: string; asset_id: string }>> {
  const organizationId = requireOrganization();
  const items = [
    ...(payload.services ?? []).map((item: any) => ({ ...item, kind: "service" })),
    ...(payload.parts ?? []).map((item: any) => ({ ...item, kind: "part" })),
  ];
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity ?? 1) * Number(item.price ?? 0), 0);
  const result = await supabase.rpc("create_work_orders_batch", { payload: {
    organizationId, customerId: payload.customerId, devices: payload.devices, assignedTo: payload.assignedTo,
    comments: payload.comments, subtotal, total: Number(payload.total ?? subtotal), date: payload.date,
    reminderEnabled: Boolean(payload.reminderEnabled), reminderIntervalDays: payload.reminderIntervalDays,
    reminderDueAt: payload.reminderDueAt, items,
  } });
  if (result.error) throw result.error;
  invalidateQueries(`repair-summaries:${organizationId}`); invalidateQueries(`reminders:${organizationId}`);
  return (result.data ?? []) as Array<{ id: string; asset_id: string }>;
}

async function createQuote(payload: any) {
  const organizationId = requireOrganization();
  const items = [...(payload.services ?? []), ...(payload.parts ?? [])];
  const subtotal = items.reduce((sum, item) => sum + Number(item.total ?? item.price ?? 0), 0);
  const quote = unwrap<any>((await supabase.from("quotes").insert({
    organization_id: organizationId,
    customer_id: payload.customerId,
    status: "draft",
    notes: payload.comments || null,
    subtotal,
    discount: Number(payload.discount ?? 0),
    surcharge: Number(payload.surcharge ?? 0),
    total: Number(payload.total ?? subtotal),
  }).select("id").single()) as any);
  const rows = [
    ...(payload.services ?? []).map((item: any) => ({ ...item, kind: "service" })),
    ...(payload.parts ?? []).map((item: any) => ({ ...item, kind: "part" })),
  ].map((item) => ({
    organization_id: organizationId,
    quote_id: quote.id,
    catalog_item_id: item.id,
    kind: item.kind,
    name: item.name,
    description: item.description || null,
    quantity: Number(item.qtd ?? 1),
    unit_price: Number(item.price ?? 0),
  }));
  if (rows.length) {
    const result = await supabase.from("quote_items").insert(rows);
    if (result.error) {
      await supabase.from("quotes").delete().eq("id", quote.id);
      throw result.error;
    }
  }
  invalidateQueries(`quotes:${organizationId}`);
  return quote;
}

function parseId(path: string) {
  const id = path.split("/").filter(Boolean).pop();
  if (!id) throw new Error("Identificador ausente.");
  return id;
}

const API = {
  async get(path: string): Promise<{ data: any }> {
    if (path === "/customers/list") return { data: await listCustomers() };
    if (path === "/devices/list") return { data: await listDevices() };
    if (path === "/parts/list") return { data: await listCatalog("part") };
    if (path === "/services/list") return { data: await listCatalog("service") };
    if (path === "/repairs/list") return { data: await listRepairs() };
    if (path === "/reminders/list") return { data: await listMaintenanceReminders() };
    throw new Error(`Rota não suportada: GET ${path}`);
  },

  async post(path: string, payload: any): Promise<{ data: any }> {
    const organizationId = requireOrganization();
    if (path === "/customers/add") {
      const result = await supabase.from("customers")
        .insert({ organization_id: organizationId, ...payload }).select().single();
      invalidateQueries(`customers:${organizationId}`);
      return { data: mapCustomer(unwrap<any>(result as any)) };
    }
    if (path === "/devices/add") {
      const result = await supabase.from("assets").insert({
        organization_id: organizationId,
        customer_id: payload.customerId,
        reference: payload.reference,
        model: payload.model || null,
        brand: payload.brand || null,
        location: payload.location,
        equipment_type: payload.equipmentType || null,
        serial_number: payload.serialNumber || null,
        capacity_btu: payload.capacityBtu || null,
        voltage: payload.voltage || null,
        phase: payload.phase || null,
        refrigerant: payload.refrigerant || null,
        installed_at: payload.installedAt || null,
      }).select().single();
      invalidateQueries(`devices:${organizationId}`); invalidateQueries(`customers:${organizationId}`);
      return { data: unwrap(result as any) };
    }
    if (path === "/parts/add" || path === "/services/add") {
      const kind = path.includes("parts") ? "part" : "service";
      const result = await supabase.from("catalog_items").insert({
        organization_id: organizationId,
        kind,
        name: payload.name,
        description: payload.description || null,
        unit_price: Number(payload.price),
      }).select().single();
      invalidateQueries(`catalog:${organizationId}:${kind}`);
      return { data: mapCatalogItem(unwrap<any>(result as any)) };
    }
    if (path === "/repairs/add") return { data: await createRepair(payload) };
    if (path === "/quotes/add") return { data: await createQuote(payload) };
    if (path === "devices/reference" || path === "/devices/reference") {
      const result = await supabase.from("assets").select("*, Customer:customers(*)")
        .eq("organization_id", organizationId).eq("reference", payload.reference)
        .is("deleted_at", null).single();
      return { data: mapDevice(unwrap<any>(result as any)) };
    }
    throw new Error(`Rota não suportada: POST ${path}`);
  },

  async put(path: string, payload: any): Promise<{ data: any }> {
    const organizationId = requireOrganization();
    const id = parseId(path);
    if (path.startsWith("/customers/")) {
      unwrap((await supabase.from("customers").update(payload)
        .eq("organization_id", organizationId).eq("id", id)) as any);
      invalidateQueries(`customers:${organizationId}`); return { data: true };
    }
    if (path.startsWith("/devices/")) {
      unwrap((await supabase.from("assets").update({
        customer_id: payload.customerId,
        reference: payload.reference,
        model: payload.model || null,
        brand: payload.brand || null,
        location: payload.location,
        equipment_type: payload.equipmentType || null,
        serial_number: payload.serialNumber || null,
        capacity_btu: payload.capacityBtu || null,
        voltage: payload.voltage || null,
        phase: payload.phase || null,
        refrigerant: payload.refrigerant || null,
        installed_at: payload.installedAt || null,
      }).eq("organization_id", organizationId).eq("id", id)) as any);
      invalidateQueries(`devices:${organizationId}`); invalidateQueries(`customers:${organizationId}`); return { data: true };
    }
    if (path.startsWith("/parts/") || path.startsWith("/services/")) {
      unwrap((await supabase.from("catalog_items").update({
        name: payload.name,
        description: payload.description || null,
        unit_price: Number(payload.price),
      }).eq("organization_id", organizationId).eq("id", id)) as any);
      invalidateQueries(`catalog:${organizationId}`); return { data: true };
    }
    throw new Error(`Rota não suportada: PUT ${path}`);
  },

  async delete(path: string): Promise<{ data: any }> {
    const organizationId = requireOrganization();
    const id = parseId(path);
    const table = path.startsWith("/customers/") ? "customers"
      : path.startsWith("/devices/") ? "assets"
      : path.startsWith("/parts/") || path.startsWith("/services/") ? "catalog_items"
      : path.startsWith("/repairs/") ? "work_orders" : null;
    if (!table) throw new Error(`Rota não suportada: DELETE ${path}`);
    unwrap((await supabase.from(table).update({ deleted_at: new Date().toISOString() })
      .eq("organization_id", organizationId).eq("id", id)) as any);
    if (table === "customers") invalidateQueries(`customers:${organizationId}`);
    if (table === "assets") { invalidateQueries(`devices:${organizationId}`); invalidateQueries(`customers:${organizationId}`); }
    if (table === "catalog_items") invalidateQueries(`catalog:${organizationId}`);
    if (table === "work_orders") { invalidateQueries(`repair-summaries:${organizationId}`); invalidateQueries(`repair-detail:${organizationId}:${id}`); invalidateQueries(`reminders:${organizationId}`); }
    return { data: true };
  },
};

export default API;
