import { Customer } from "../../types/data";
import { servicesTotal } from "../../screens/Budgets";
import { escapeHtml, htmlDocument, ReportOrganization } from "./reportDocument";

const money = (value: number) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const itemList = (items: servicesTotal[]) => items.length ? items.map((item) => `<div class="field full"><span class="value">${escapeHtml(item.name)}</span>${item.description ? `<br><span class="muted">${escapeHtml(item.description)}</span>` : ""}<br><span class="muted">${item.qtd} × ${money(item.price)} · ${money(item.total)}</span></div>`).join("") : `<div class="field full"><span class="muted">Nenhum item</span></div>`;

export const generateBudgetsHtml = (services: servicesTotal[], parts: servicesTotal[], total: number, company: ReportOrganization, customer: Customer, comments?: string) => htmlDocument(company, `
  <section class="report-heading"><div><h2>Orçamento de serviços</h2><p>Proposta comercial</p></div><span class="badge">Aguardando aprovação</span></section>
  <section class="section"><div class="section-title">Cliente</div><div class="grid"><div class="field"><span class="label">Nome</span><span class="value">${escapeHtml(customer.name)}</span></div><div class="field"><span class="label">Documento</span><span class="value">${escapeHtml(customer.document || "—")}</span></div><div class="field"><span class="label">Telefone</span><span class="value">${escapeHtml(customer.phone || "—")}</span></div><div class="field"><span class="label">Endereço</span><span class="value">${escapeHtml(customer.address || "—")}</span></div></div></section>
  <section class="section"><div class="section-title">Serviços</div><div class="grid">${itemList(services)}</div></section>
  <section class="section"><div class="section-title">Peças e materiais</div><div class="grid">${itemList(parts)}</div></section>
  ${comments ? `<section class="section"><div class="section-title">Observações</div><div class="field full"><span class="value">${escapeHtml(comments)}</span></div></section>` : ""}
  <div class="total"><span>Valor total</span><span>${money(total)}</span></div><div class="signatures"><div class="signature">Empresa prestadora</div><div class="signature">Cliente / responsável</div></div>`, "Orçamento de serviços");
