export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  document: string;
}
export interface Device {
  Customer: Customer;
  id: string;
  reference: string;
  model: string;
  brand: string;
  location: string;
  equipmentType?: string;
  serialNumber?: string;
  capacityBtu?: number | null;
  voltage?: number | null;
  phase?: "single" | "two" | "three" | "other" | null;
  refrigerant?: string;
  installedAt?: string | null;
}
export interface Part {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  total?: number;
}
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity?: number;
  total?: number;
}
export interface Repair {
  id: string;
  Customer: Customer;
  Device: Device;
  date: string;
  comments: string;
  parts: Part[];
  services: Service[];
  total: string;
  diagnosis?: MaintenanceDiagnosis;
  checks?: TechnicalCheck[];
  measurements?: TechnicalMeasurement[];
  result?: MaintenanceResult;
  technicianName?: string;
  customerSignerName?: string;
  technicianSignatureSvg?: string;
  customerSignatureSvg?: string;
  signedAt?: string;
  offlineStatus?: "draft" | "pending" | "syncing" | "error" | "blocked_commercial";
  offlineLocalId?: string;
}

export type TechnicalCheckStatus = "ok" | "attention" | "non_conforming" | "not_checked" | "not_applicable";
export interface TechnicalCheck { key: string; label: string; category?: string; status: TechnicalCheckStatus; observation?: string; order: number; }
export interface TechnicalMeasurement { key: string; label: string; value: number; unit: string; source?: "manual" | "calculated"; order: number; }
export interface MaintenanceDiagnosis { reportedProblem?: string; foundCondition?: string; technicalDiagnosis?: string; }
export type EquipmentStatus = "operational" | "operational_with_notes" | "requires_repair" | "out_of_service";
export type ProblemResolution = "yes" | "partial" | "no";
export type RecommendationPriority = "low" | "normal" | "high" | "urgent";
export interface MaintenanceResult { equipmentStatus?: EquipmentStatus; problemResolved?: ProblemResolution; returnRequired?: boolean; returnReason?: string; customerRecommendation?: string; recommendationPriority?: RecommendationPriority; }

export interface MaintenanceReminder {
  id: string;
  dueAt: string;
  intervalDays: number;
  Customer: Customer;
  Device: Device;
}
export interface Page<T> { items: T[]; total: number; page: number; pageSize: number; hasMore: boolean; }
export interface EquipmentLabelItem {
  id: string; assetId: string | null; reference: string; brand: string; model: string; location: string;
  equipmentType: string; customerId: string; customerName: string; publicToken: string | null;
}
export interface EquipmentLabelPreferences {
  widthMm: 50 | 60 | 80; heightMm: 30 | 40 | 50;
  showOrganizationPhone: boolean; showEquipmentType: boolean;
  showBrandModel: boolean; showLocation: boolean;
}
export interface RepairFilters { customerId?: string; deviceId?: string; startAt?: string; endAt?: string; }
export interface Period {
  start: number;
  startFormatted: string;
  end: number;
  endFormatted: string;
}
export interface CustomerDevices extends Customer {
  Devices: Device;
}

export interface CustomerStats extends Customer {
  devicesQuantity: number;
}
