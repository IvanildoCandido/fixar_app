import moment from "moment";
import { Period, Repair } from "../../types/data";
import { escapeHtml, htmlDocument, ReportOrganization } from "./reportDocument";

const money = (value: string | number) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const generateMultipleHtml = (repairs: Repair[], period: Period, company: ReportOrganization) => {
  const customer = repairs[0]?.Customer;
  const periodLabel = period.start ? `${period.startFormatted} a ${period.endFormatted}` : "Período não informado";
  const orders = repairs.map((repair) => `<article class="order"><div class="section">
    <div class="section-title">${escapeHtml(repair.Device.reference)} · ${moment(repair.date).format("DD/MM/YYYY")}</div><div class="grid">
    <div class="field"><span class="label">Equipamento</span><span class="value">${escapeHtml(`${repair.Device.brand || "—"} ${repair.Device.model || ""}`.trim())}</span></div>
    <div class="field"><span class="label">Ambiente</span><span class="value">${escapeHtml(repair.Device.location || "—")}</span></div>
    <div class="field full"><span class="label">Serviços executados</span><ul class="items">${repair.services.length ? repair.services.map((service) => `<li><span class="value">${escapeHtml(service.name)}</span>${service.description ? `<br><span class="muted">${escapeHtml(service.description)}</span>` : ""}</li>`).join("") : "<li>Nenhum serviço registrado</li>"}</ul></div>
    <div class="field"><span class="label">Peças e materiais</span><span class="value">${repair.parts.length ? repair.parts.map((part) => escapeHtml(part.name)).join(", ") : "Nenhum"}</span></div>
    <div class="field"><span class="label">Valor</span><span class="value">${money(repair.total)}</span></div>
    ${repair.comments ? `<div class="field full"><span class="label">Observações técnicas</span><span class="value">${escapeHtml(repair.comments)}</span></div>` : ""}</div></div></article>`).join("");
  return htmlDocument(company, `<section class="report-heading"><div><h2>Relatório consolidado de manutenção</h2><p>${escapeHtml(periodLabel)}</p></div><span class="badge">${repairs.length} ${repairs.length === 1 ? "atendimento" : "atendimentos"}</span></section>
    <section class="section"><div class="section-title">Cliente</div><div class="grid"><div class="field"><span class="label">Nome</span><span class="value">${escapeHtml(customer?.name || "—")}</span></div><div class="field"><span class="label">Documento</span><span class="value">${escapeHtml(customer?.document || "—")}</span></div><div class="field"><span class="label">Telefone</span><span class="value">${escapeHtml(customer?.phone || "—")}</span></div><div class="field"><span class="label">Endereço</span><span class="value">${escapeHtml(customer?.address || "—")}</span></div></div></section>
    ${orders}<div class="total"><span>Total do período</span><span>${money(repairs.reduce((sum, repair) => sum + Number(repair.total || 0), 0))}</span></div><div class="signatures"><div class="signature">Responsável técnico</div><div class="signature">Cliente / responsável</div></div>`, "Relatório consolidado de manutenção");
};
