import moment from "moment";
import { Customer } from "../../types/data";
import { servicesTotal } from "../../screens/Budgets";
import { escapeHtml, referenceReportDocument, reportIcon, ReportOrganization } from "./reportDocument";

const money = (value: number) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const reportField = (label: string, value?: string | null) => value?.trim() ? `<div class="report-field"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>` : "";
const itemsTable = (items: servicesTotal[], empty: string) => items.length ? `<table class="report-table"><thead><tr><th>Descrição</th><th>Qtde.</th><th>Valor unit.</th><th>Total</th></tr></thead><tbody>${items.map((item) => `<tr><td><strong>${escapeHtml(item.name)}</strong>${item.description ? `<br><small>${escapeHtml(item.description)}</small>` : ""}</td><td>${item.qtd}</td><td>${money(item.price)}</td><td>${money(item.total)}</td></tr>`).join("")}</tbody></table>` : `<p class="report-empty">${escapeHtml(empty)}</p>`;

export const generateBudgetsHtml = (services: servicesTotal[], parts: servicesTotal[], total: number, company: ReportOrganization, customer: Customer, comments?: string, adjustments?: { discount?: number; surcharge?: number }) => {
  const issuedAt = moment();
  const customerCard = `<section class="report-card"><h3>${reportIcon("client")}Cliente</h3><div class="report-field-grid">${reportField("Nome / Razão social", customer.name)}${reportField("Documento", customer.document)}${reportField("Telefone", customer.phone)}${reportField("Endereço", customer.address)}</div></section>`;
  const adjustmentRows = `${adjustments?.surcharge ? `<div class="proposal-adjustment"><span>Acréscimos</span><b>+ ${money(adjustments.surcharge)}</b></div>` : ""}${adjustments?.discount ? `<div class="proposal-adjustment"><span>Descontos</span><b>- ${money(adjustments.discount)}</b></div>` : ""}`;
  const valueCard = `<section class="report-card"><h3>${reportIcon("money")}Valor total da proposta</h3>${adjustmentRows}<div class="report-total">${money(total)}</div><div class="proposal-status">Aguardando aprovação</div></section>`;
  const body = `<div class="report-two-columns">${customerCard}${valueCard}</div><section class="report-card"><h3>${reportIcon("service")}Serviços propostos</h3>${itemsTable(services, "Nenhum serviço informado.")}</section><div class="report-two-columns"><section class="report-card"><h3>${reportIcon("package")}Peças e materiais</h3>${itemsTable(parts, "Nenhum material previsto.")}</section>${comments?.trim() ? `<section class="report-card"><h3>${reportIcon("note")}Observações da proposta</h3><div class="proposal-comments">${escapeHtml(comments)}</div></section>` : ""}</div><section class="report-card"><div class="report-signatures"><div class="report-signature"><div class="report-signature-line"><b>Empresa prestadora</b><small>Nome / Assinatura</small></div></div><div class="report-signature"><div class="report-signature-line"><b>Cliente / responsável</b><small>Nome / Assinatura</small></div></div></div></section>`;
  return referenceReportDocument(company, {
    documentTitle: "ORÇAMENTO", documentLabel: "PROPOSTA DE SERVIÇOS",
    reference: `ORC-${issuedAt.format("YYYYMMDD")}`, metaLabel: "Data da proposta", metaValue: issuedAt.format("DD/MM/YYYY"),
    secondaryMetaLabel: "Horário", secondaryMetaValue: issuedAt.format("HH:mm"), body,
    extraStyles: `.proposal-status{text-align:center;color:#6C787D;font-weight:600}.proposal-comments{white-space:pre-wrap}.proposal-adjustment{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #E2E7E8;color:#54666C}.proposal-adjustment b{color:#17383A}.report-table td small{color:#607077}`,
  });
};
