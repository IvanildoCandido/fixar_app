import moment from "moment";
import { Period, Repair } from "../../types/data";
import { escapeHtml, referenceReportDocument, ReportOrganization } from "./reportDocument";

const money = (value: string | number) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const reportField = (label: string, value?: string | number | null, full = false) => value === undefined || value === null || String(value).trim() === "" ? "" : `<div class="report-field${full ? " full" : ""}"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`;

export const generateMultipleHtml = (repairs: Repair[], period: Period, company: ReportOrganization) => {
  const customer = repairs[0]?.Customer;
  const periodLabel = period.start ? `${period.startFormatted} a ${period.endFormatted}` : "Período não informado";
  const orders = repairs.map((repair, index) => `<section class="report-card maintenance-summary"><h3><span>▣</span>${escapeHtml(repair.Device.reference)} · ${moment(repair.date).format("DD/MM/YYYY HH:mm")}<b>${money(repair.total)}</b></h3><div class="report-field-grid">${reportField("Equipamento", `${repair.Device.brand || ""} ${repair.Device.model || ""}`.trim())}${reportField("Ambiente", repair.Device.location)}${reportField("Serviços executados", repair.services.map((service) => service.name).join(", ") || "Nenhum serviço registrado", true)}${reportField("Peças e materiais", repair.parts.map((part) => `${part.name} (${part.quantity ?? 1})`).join(", ") || "Nenhum material", true)}${reportField("Observações técnicas", repair.comments, true)}</div></section>`).join("");
  const customerCard = `<section class="report-card"><h3><span>◉</span>Cliente</h3><div class="report-field-grid">${reportField("Nome / Razão social", customer?.name)}${reportField("Documento", customer?.document)}${reportField("Telefone", customer?.phone)}${reportField("Endereço", customer?.address)}</div></section>`;
  const summary = `<section class="report-card"><h3><span>▤</span>Resumo do período</h3><div class="report-field-grid">${reportField("Atendimentos", repairs.length)}${reportField("Período", periodLabel)}${reportField("Valor total", money(repairs.reduce((sum, repair) => sum + Number(repair.total || 0), 0)), true)}</div></section>`;
  return referenceReportDocument(company, {
    documentTitle: "MANUTENÇÕES", documentLabel: "RELATÓRIO CONSOLIDADO DE",
    reference: `${repairs.length} ${repairs.length === 1 ? "ATENDIMENTO" : "ATENDIMENTOS"}`,
    metaLabel: "Período", metaValue: periodLabel,
    secondaryMetaLabel: "Emitido em", secondaryMetaValue: moment().format("DD/MM/YYYY HH:mm"),
    body: `<div class="report-two-columns">${customerCard}${summary}</div>${orders}<section class="report-card"><div class="report-signatures"><div class="report-signature"><div class="report-signature-line"><b>Responsável técnico</b><small>Nome / Assinatura</small></div></div><div class="report-signature"><div class="report-signature-line"><b>Cliente / responsável</b><small>Nome / Assinatura</small></div></div></div></section>`,
    extraStyles: `.maintenance-summary h3 b{margin-left:auto;color:#0B6046}.maintenance-summary{break-inside:avoid}.maintenance-summary+.maintenance-summary{margin-top:5px}`,
  });
};
