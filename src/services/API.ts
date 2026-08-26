import { supabase } from "./supabase";

let activeOrganizationId: string | null = null;

export function setActiveOrganizationId(organizationId: string | null) {
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
  const result = await supabase.from("customers").select("*, assets(count)")
    .eq("organization_id", requireOrganization()).is("deleted_at", null).order("name");
  return unwrap<any[]>(result as any).map(mapCustomer);
}

async function listDevices() {
  const result = await supabase.from("assets").select("*, Customer:customers(*)")
    .eq("organization_id", requireOrganization()).is("deleted_at", null).order("reference");
  return unwrap<any[]>(result as any).map(mapDevice);
}

async function listCatalog(kind: "part" | "service") {
  const result = await supabase.from("catalog_items").select("*")
    .eq("organization_id", requireOrganization()).eq("kind", kind)
    .is("deleted_at", null).order("name");
  return unwrap<any[]>(result as any).map(mapCatalogItem);
}

async function listRepairs() {
  const result = await supabase.from("work_orders")
    .select("*, Customer:customers(*), Device:assets(*), work_order_items(*), work_order_technical_checks(*), work_order_measurements(*)")
    .eq("organization_id", requireOrganization()).is("deleted_at", null)
    .order("completed_at", { ascending: false, nullsFirst: false });
  return unwrap<any[]>(result as any).map(mapRepair);
}

async function listMaintenanceReminders() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return [];

  const result = await supabase.from("work_orders")
    .select("id, reminder_due_at, reminder_interval_days, Customer:customers(*), Device:assets(*)")
    .eq("organization_id", requireOrganization())
    .eq("assigned_to", authData.user.id)
    .eq("reminder_enabled", true)
    .not("reminder_due_at", "is", null)
    .is("deleted_at", null)
    .order("reminder_due_at", { ascending: true })
    .limit(10);
  return unwrap<any[]>(result as any).map(mapMaintenanceReminder);
}

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
  return order;
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
      return { data: true };
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
      return { data: true };
    }
    if (path.startsWith("/parts/") || path.startsWith("/services/")) {
      unwrap((await supabase.from("catalog_items").update({
        name: payload.name,
        description: payload.description || null,
        unit_price: Number(payload.price),
      }).eq("organization_id", organizationId).eq("id", id)) as any);
      return { data: true };
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
    return { data: true };
  },
};

export default API;
