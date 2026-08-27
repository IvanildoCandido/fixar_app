import moment from "moment";
import { MaintenanceDiagnosis, MaintenanceResult, Part, Repair, Service, TechnicalCheck, TechnicalMeasurement } from "../../types/data";
import { escapeHtml, referenceReportDocument, reportIcon, ReportOrganization } from "./reportDocument";

const money = (value: string | number) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const present = (value?: string | null) => value?.trim() ? escapeHtml(value) : "Não informado";
const field = (label: string, value?: string | number | null) => value === undefined || value === null || String(value).trim() === "" ? "" : `<div class="report-field"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`;
const section = (title: string, icon: string, content: string, extra = "") => content.trim() ? `<section class="report-card ${extra}"><h3>${reportIcon(icon)}${escapeHtml(title)}</h3>${content}</section>` : "";
const statusLabels: Record<string, string> = { ok: "OK", attention: "Atenção", non_conforming: "Não conforme", not_checked: "Não verificado", not_applicable: "Não aplicável" };
const resultLabels: Record<string, string> = { operational: "Operacional", operational_with_notes: "Operacional com ressalvas", requires_repair: "Requer reparo", out_of_service: "Fora de operação", yes: "Sim", partial: "Parcialmente", no: "Não", low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente" };

const servicesHtml = (services: Service[]) => services.length ? `<div class="service-list">${services.map((item) => `<div class="service-item"><span class="check-dot">✓</span><div><strong>${escapeHtml(item.name)}</strong>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}</div></div>`).join("")}</div>` : "<p class=\"empty\">Nenhum serviço registrado.</p>";
const checksHtml = (checks: TechnicalCheck[], measurements: TechnicalMeasurement[]) => {
  if (!checks.length && !measurements.length) return "";
  const checkRows = checks.map((item) => `<div class="technical-row"><span>${escapeHtml(item.label)}</span><b class="status ${item.status}">${statusLabels[item.status]}</b>${item.observation ? `<small>${escapeHtml(item.observation)}</small>` : ""}</div>`).join("");
  const measurementRows = measurements.map((item) => `<div class="technical-row measurement"><span>${escapeHtml(item.label)}</span><b>${escapeHtml(String(item.value).replace(".", ","))} ${escapeHtml(item.unit)}</b></div>`).join("");
  return `<div class="technical-grid">${checkRows}${measurementRows}</div><div class="legend"><span>✓ OK</span><span>⚠ Atenção</span><span>✕ Não conforme</span><span>— Não verificado</span></div>`;
};
const partsHtml = (parts: Part[]) => parts.length ? `<table><thead><tr><th>Descrição</th><th>Qtde.</th><th>Valor unit.</th><th>Total</th></tr></thead><tbody>${parts.map((item) => { const quantity = Number(item.quantity ?? 1); const price = Number(item.price ?? 0); return `<tr><td>${escapeHtml(item.name)}</td><td>${quantity.toLocaleString("pt-BR")}</td><td>${money(price)}</td><td>${money(item.total ?? quantity * price)}</td></tr>`; }).join("")}</tbody></table>` : `<p class="empty materials-empty">Nenhum material utilizado.</p>`;
const diagnosisHtml = (diagnosis?: MaintenanceDiagnosis) => diagnosis ? [field("Problema relatado", diagnosis.reportedProblem), field("Condição encontrada", diagnosis.foundCondition), field("Diagnóstico técnico", diagnosis.technicalDiagnosis)].join("") : "";
const resultHtml = (result?: MaintenanceResult) => result ? [field("Status do equipamento", result.equipmentStatus ? resultLabels[result.equipmentStatus] : ""), field("Problema resolvido", result.problemResolved ? resultLabels[result.problemResolved] : ""), result.returnRequired === undefined ? "" : field("Retorno necessário", result.returnRequired ? "Sim" : "Não"), field("Motivo do retorno", result.returnReason), field("Recomendação ao cliente", result.customerRecommendation), field("Prioridade", result.recommendationPriority ? resultLabels[result.recommendationPriority] : "")].join("") : "";
const signatureImage = (svg?: string) => svg?.trim() ? `<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}" alt="Assinatura" />` : "";

export type MaintenanceReportData = Pick<Repair, "id" | "Customer" | "Device" | "date" | "comments" | "parts" | "services" | "total" | "diagnosis" | "checks" | "measurements" | "result" | "technicianName" | "customerSignerName" | "technicianSignatureSvg" | "customerSignatureSvg" | "signedAt">;

export function generateMaintenanceHtml(report: MaintenanceReportData, company: ReportOrganization) {
  const { Customer: customer, Device: device, date } = report;
  const technical = checksHtml(report.checks ?? [], report.measurements ?? []);
  const diagnosis = diagnosisHtml(report.diagnosis);
  const result = resultHtml(report.result);
  const denseReport = Boolean(technical || diagnosis || result || report.parts?.length || report.comments?.trim());
  const phaseLabels = { single: "Monofásico", two: "Bifásico", three: "Trifásico", other: "Outro" };
  const equipmentDetails = [field("Referência / Tag", device.reference), field("Ambiente", device.location), field("Tipo", device.equipmentType), field("Marca", device.brand), field("Modelo", device.model), field("Nº de série", device.serialNumber), field("Capacidade", device.capacityBtu ? `${device.capacityBtu.toLocaleString("pt-BR")} BTU/h` : ""), field("Tensão", device.voltage ? `${device.voltage} V` : ""), field("Fase", device.phase ? phaseLabels[device.phase] : ""), field("Refrigerante", device.refrigerant), field("Data de instalação", device.installedAt ? moment(device.installedAt).format("DD/MM/YYYY") : "")].join("");
  const optionalTechnical = section("Diagnóstico", "diagnosis", diagnosis, "diagnosis-card") + section("Resultado e recomendações", "check", result, "result-card");
  const body = `
  <div class="report-two-columns">${section("Cliente", "client", `<div class="report-field-grid">${field("Nome / Razão social", customer.name)}${field("Documento", customer.document)}${field("Telefone", customer.phone)}${field("Endereço", customer.address)}</div>`)}${section("Equipamento", "equipment", `<div class="report-field-grid">${equipmentDetails}</div>`)}</div>
  ${section("Serviços executados", "service", servicesHtml(report.services ?? []))}${section("Verificações e condições", "shield", technical)}
  <div class="optional-grid">${optionalTechnical}</div><div class="closing-grid">${section("Peças e materiais utilizados", "package", partsHtml(report.parts ?? []))}${section("Valor total dos serviços", "money", `<div class="total-value">${money(report.total)}</div>`)}</div>
  ${report.comments?.trim() ? section("Observações técnicas", "note", `<div class="comments">${escapeHtml(report.comments)}</div>`) : ""}
  <section class="report-card"><div class="report-signatures"><div class="report-signature">${signatureImage(report.technicianSignatureSvg)}<div class="report-signature-line"><b>${present(report.technicianName)}</b><small>Responsável técnico</small></div></div><div class="report-signature">${signatureImage(report.customerSignatureSvg)}<div class="report-signature-line"><b>${present(report.customerSignerName)}</b><small>Cliente / responsável</small></div></div></div></section>`;
  return referenceReportDocument(company, {
    documentTitle: "MANUTENÇÃO", documentLabel: "RELATÓRIO DE", reference: device.reference || report.id,
    metaLabel: "Data do atendimento", metaValue: moment(date).format("DD/MM/YYYY"),
    secondaryMetaLabel: "Horário", secondaryMetaValue: moment(date).format("HH:mm"), body,
    extraStyles: `
  @page { size: A4; margin: 5mm; } body { font-size: 7.5px; line-height: 1.28; color: #10262A; }
  ${denseReport ? `.reference-header{min-height:104px;padding:8px 12px}.reference-logo{height:56px}.reference-brand h2{margin-top:5px;font-size:10px}.reference-contact p{margin-bottom:4px}.reference-title h1{font-size:21px}.reference-title h1 span{font-size:11px}.reference-badge{margin-top:6px;padding:4px 10px}.reference-meta{margin-top:6px;padding:5px 7px}.report-card{margin-top:5px;padding:7px 10px}.report-two-columns{gap:5px;margin-top:5px}.report-card h3{margin-bottom:6px;font-size:8.7px}.report-field{min-height:0;padding:3px 0}.report-field strong{font-size:7.8px}.report-signature{min-height:48px}.reference-band{min-height:42px;margin-top:5px;padding:7px 12px}.reference-footer{padding-top:5px}` : ""}
  .service-item{display:flex;gap:7px;margin:4px 0}.service-item p{margin:1px 0 0;color:#45575D}.check-dot{width:13px;height:13px;border-radius:50%;background:#10745A;color:#fff;text-align:center;line-height:13px;font-weight:700}.technical-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0 13px}.technical-row{display:grid;grid-template-columns:1fr auto;gap:3px;padding:3px 0;border-bottom:1px solid #EEF1F2}.technical-row small{grid-column:1/-1;color:#8A4A34}.status{padding:1px 4px;border-radius:4px;background:#F1F3F3;color:#607077;font-size:6.5px}.status.ok{background:#E9F8EF;color:#11734E}.status.attention{background:#FFF4DF;color:#9A6214}.status.non_conforming{background:#FFF0F0;color:#C83C3C}.legend{display:flex;gap:10px;margin-top:5px;color:#617177;font-size:6.3px}.measurement b{color:#0C514E}.closing-grid{display:grid;grid-template-columns:58% 42%;gap:5px}.closing-grid>.report-card{margin-top:5px}table{width:100%;border-collapse:collapse}th{padding:4px;background:#F0F2F2;text-align:left;font-size:6.5px}td{padding:4px;border-bottom:1px solid #E5EAEB}.empty{text-align:center;color:#8B989D;margin:10px 0}.total-value{text-align:center;color:#0B6046;font-size:16px;font-weight:800;margin:5px 0}.comments{white-space:pre-wrap}.report-signature img{max-height:32px;max-width:160px;margin:0 auto -1px}.optional-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}.optional-grid>.report-card{margin-top:5px}`,
  });
}

/** Compatibilidade temporária com chamadas legadas. */
export const generateHtml = (customer: Repair["Customer"], device: Repair["Device"], parts: Part[], services: Service[], comments: string, total: string | number, date: string, company: ReportOrganization, technician?: string) => generateMaintenanceHtml({ id: device.reference, Customer: customer, Device: device, parts, services, comments, total: String(total), date, technicianName: technician }, company);
