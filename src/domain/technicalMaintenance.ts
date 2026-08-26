import { TechnicalCheck, TechnicalMeasurement } from "../types/data";

export interface CheckDefinition { key: string; label: string; category: string; }
export interface MeasurementDefinition { key: string; label: string; unit: string; }

export const AIR_CONDITIONING_CHECKS: CheckDefinition[] = [
  { key: "indoor_unit", label: "Unidade interna", category: "Condição geral" },
  { key: "outdoor_unit", label: "Unidade externa", category: "Condição geral" },
  { key: "filters", label: "Filtros", category: "Condição geral" },
  { key: "drain", label: "Dreno e vazamentos", category: "Condição geral" },
  { key: "thermal_insulation", label: "Isolamento térmico", category: "Condição geral" },
  { key: "electrical_connections", label: "Conexões elétricas", category: "Elétrica" },
  { key: "grounding", label: "Aterramento", category: "Elétrica" },
  { key: "capacitor", label: "Capacitor", category: "Elétrica" },
  { key: "refrigerant", label: "Condição do refrigerante", category: "Refrigeração" },
  { key: "overall_performance", label: "Performance geral", category: "Resultado" },
];

export const AIR_CONDITIONING_MEASUREMENTS: MeasurementDefinition[] = [
  { key: "voltage", label: "Tensão", unit: "V" },
  { key: "current", label: "Corrente", unit: "A" },
  { key: "suction_pressure", label: "Pressão de sucção", unit: "psi" },
  { key: "discharge_pressure", label: "Pressão de descarga", unit: "psi" },
  { key: "return_temperature", label: "Temperatura de retorno", unit: "°C" },
  { key: "supply_temperature", label: "Temperatura de insuflamento", unit: "°C" },
];

export const makeDefaultChecks = (): TechnicalCheck[] => AIR_CONDITIONING_CHECKS.map((item, order) => ({
  ...item, status: "not_checked", observation: "", order,
}));

export function checksForServiceNames(serviceNames: string[], current: TechnicalCheck[] = []) {
  const normalized = serviceNames.join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const definitions = normalized.includes("isolacao")
    ? AIR_CONDITIONING_CHECKS.filter((item) => item.key === "thermal_insulation" || item.key === "overall_performance")
    : AIR_CONDITIONING_CHECKS;
  return definitions.map((definition, order) => ({
    ...definition, status: current.find((item) => item.key === definition.key)?.status ?? "not_checked",
    observation: current.find((item) => item.key === definition.key)?.observation ?? "", order,
  } as TechnicalCheck));
}

export function withCalculatedDeltaT(measurements: TechnicalMeasurement[]) {
  const manualDelta = measurements.find((item) => item.key === "delta_t" && item.source !== "calculated");
  if (manualDelta) return measurements;
  const returning = measurements.find((item) => item.key === "return_temperature");
  const supply = measurements.find((item) => item.key === "supply_temperature");
  const withoutCalculated = measurements.filter((item) => item.key !== "delta_t");
  if (!returning || !supply) return withoutCalculated;
  return [...withoutCalculated, {
    key: "delta_t", label: "ΔT", value: Number((returning.value - supply.value).toFixed(2)),
    unit: returning.unit, source: "calculated" as const, order: 99,
  }];
}

export function materialTotal(items: Array<{ price: number | string; quantity?: number }>) {
  return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity ?? 1), 0);
}

export function maskedMoneyValue(ref: { current?: { getRawValue?: () => unknown } | null }, fallback: string | number = 0) {
  const raw = ref.current?.getRawValue?.();
  const source = raw ?? fallback;
  if (typeof source === "number") return Number.isFinite(source) ? source : 0;
  const cleaned = String(source).replace(/[^0-9,.-]/g, "");
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
