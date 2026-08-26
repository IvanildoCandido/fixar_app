import { MaintenanceReportData } from "../../src/components/ReportModels/SinglePDF";
import { ReportOrganization } from "../../src/components/ReportModels/reportDocument";

export const fixtureCompany: ReportOrganization = {
  name: "Systech Tecnologia", legal_name: "Fixar Soluções LTDA", document: "06.125.978/0001-94",
  phone: "(83) 9 9815-7585", email: "systechtecnologia@gmail.com",
  address: "Rua Antônio Guedes de Andrade, 337 - Rebouças",
};

const customer = { id: "customer-1", name: "Petrônio Colégio e Cursos", document: "00.000.000/0000-00", phone: "(00) 00000-0000", email: "", address: "00000000000000" };
const device = { id: "device-1", Customer: customer, reference: "SC-0101", location: "Infantil 5 Manhã E Tarde Emi", brand: "Gree", model: "Gree 18 K Convencional" };

export const simpleMaintenance: MaintenanceReportData = {
  id: "SC-0101", Customer: customer, Device: device, date: "2026-08-22T10:15:00-03:00",
  services: [{ id: "service-1", name: "Isolação Térmica", description: "Envolver os tubos de sucção e descarga com isotubos, fita PVC e fita elastomérica.", price: 100, quantity: 1 }],
  parts: [], comments: "", total: "100", technicianName: "Ivanildo Cândido Bezerra",
};

export const completeMaintenance: MaintenanceReportData = {
  ...simpleMaintenance, id: "OS-FICTICIA-001", Device: { ...device, reference: "OS-FICTICIA-001", equipmentType: "Ar-condicionado split", serialNumber: "FICT-2026-001", capacityBtu: 18000, voltage: 220, phase: "single", refrigerant: "R-410A", installedAt: "2025-03-10" },
  diagnosis: { reportedProblem: "Baixo rendimento durante a tarde.", foundCondition: "Filtro saturado e isolamento com desgaste.", technicalDiagnosis: "Fluxo de ar reduzido e perda térmica na linha de sucção." },
  checks: [
    { key: "filters", label: "Filtros", category: "Condição geral", status: "attention", observation: "Necessária limpeza completa.", order: 0 },
    { key: "drain", label: "Dreno e vazamentos", category: "Condição geral", status: "ok", order: 1 },
    { key: "electrical_connections", label: "Conexões elétricas", category: "Elétrica", status: "non_conforming", observation: "Terminal com aquecimento; reaperto realizado.", order: 2 },
    { key: "overall_performance", label: "Performance geral", category: "Resultado", status: "ok", order: 3 },
  ],
  measurements: [
    { key: "voltage", label: "Tensão", value: 220, unit: "V", source: "manual", order: 0 },
    { key: "current", label: "Corrente", value: 7.2, unit: "A", source: "manual", order: 1 },
    { key: "return_temperature", label: "Temperatura de retorno", value: 27, unit: "°C", source: "manual", order: 2 },
    { key: "supply_temperature", label: "Temperatura de insuflamento", value: 15, unit: "°C", source: "manual", order: 3 },
    { key: "delta_t", label: "ΔT", value: 12, unit: "°C", source: "calculated", order: 99 },
  ],
  parts: [
    { id: "part-1", name: "Fita elastomérica", price: 18.5, quantity: 2, total: 37 },
    { id: "part-2", name: "Terminal elétrico", price: 6.25, quantity: 4, total: 25 },
  ],
  result: { equipmentStatus: "operational_with_notes", problemResolved: "partial", returnRequired: true, returnReason: "Reavaliar desempenho após sete dias.", customerRecommendation: "Manter filtros limpos e programar revisão preventiva.", recommendationPriority: "normal" },
  comments: "Equipamento liberado para operação com acompanhamento recomendado.", total: "162",
  customerSignerName: "Responsável fictício",
  technicianSignatureSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="50"><path d="M5 38 C35 3,40 48,70 18 S95 40,130 10 S150 42,210 22" fill="none" stroke="#17383A" stroke-width="2"/></svg>`,
  customerSignatureSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="50"><path d="M8 32 Q48 5 80 30 T150 20 T210 28" fill="none" stroke="#17383A" stroke-width="2"/></svg>`,
  signedAt: "2026-08-22T11:05:00-03:00",
};
