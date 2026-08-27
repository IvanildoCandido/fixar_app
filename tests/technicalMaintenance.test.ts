import assert from "node:assert/strict";
import test from "node:test";
import { generateMaintenanceHtml } from "../src/components/ReportModels/SinglePDF";
import { generateMultipleHtml } from "../src/components/ReportModels/MultiplePDF";
import { generateBudgetsHtml } from "../src/components/ReportModels/Budgets";
import { maskedMoneyValue, materialTotal, withCalculatedDeltaT } from "../src/domain/technicalMaintenance";
import { completeMaintenance, fixtureCompany, simpleMaintenance } from "./fixtures/maintenanceReports";

test("calcula materiais por quantidade e valor unitário", () => assert.equal(materialTotal([{ price: 18.5, quantity: 2 }, { price: 6.25, quantity: 4 }]), 62));
test("calcula valores antes e depois da montagem do campo monetário", () => {
  assert.equal(maskedMoneyValue({ current: null }, "R$ 12,50"), 12.5);
  assert.equal(maskedMoneyValue({ current: null }, "R$ 1.234,56"), 1234.56);
  assert.equal(maskedMoneyValue({ current: { getRawValue: () => 25.75 } }, 0), 25.75);
});
test("calcula delta T sem sobrescrever valor manual", () => {
  const calculated = withCalculatedDeltaT([{ key: "return_temperature", label: "Retorno", value: 27, unit: "°C", order: 0 }, { key: "supply_temperature", label: "Insuflamento", value: 15, unit: "°C", order: 1 }]);
  assert.equal(calculated.find((item) => item.key === "delta_t")?.value, 12);
  const manual = withCalculatedDeltaT([...calculated.filter((item) => item.key !== "delta_t"), { key: "delta_t", label: "ΔT", value: 11.5, unit: "°C", source: "manual", order: 2 }]);
  assert.equal(manual.find((item) => item.key === "delta_t")?.value, 11.5);
});
test("relatório simples mantém uma manutenção sem medições, verificações ou materiais", () => {
  const html = generateMaintenanceHtml(simpleMaintenance, fixtureCompany);
  assert.match(html, /SC-0101/); assert.match(html, /Petrônio Colégio e Cursos/); assert.match(html, /Isolação Térmica/);
  assert.match(html, /Nenhum material utilizado/); assert.doesNotMatch(html, /Verificações e condições/); assert.doesNotMatch(html, /Diagnóstico técnico/);
  assert.match(html, /R\$\s*100,00/); assert.match(html, /Ivanildo Cândido Bezerra/);
});
test("relatório completo renderiza medições, checks, observações, resultado, recomendação e assinaturas", () => {
  const html = generateMaintenanceHtml(completeMaintenance, fixtureCompany);
  for (const expected of ["27 °C", "15 °C", "12 °C", "Atenção", "Não conforme", "Necessária limpeza completa", "Operacional com ressalvas", "Reavaliar desempenho", "Responsável fictício", "data:image/svg+xml", "R$ 162,00"]) assert.ok(html.includes(expected), expected);
});
test("relatório usa PT-BR e não cria cards opcionais vazios", () => {
  const html = generateMaintenanceHtml(simpleMaintenance, fixtureCompany);
  assert.match(html, /Manhã E Tarde Emi/); assert.match(html, /22\/08\/2026/); assert.doesNotMatch(html, /diagnosis-card/); assert.doesNotMatch(html, /result-card/);
});
test("relatórios individual, consolidado e orçamento compartilham o layout de referência", () => {
  const period = { start: 1, startFormatted: "01/08/2026", end: 31, endFormatted: "31/08/2026" };
  const budgetItems = [{ id: "service-1", name: "Higienização completa", description: "Unidade interna e externa", price: 180, qtd: 1, total: 180 }];
  const documents = [generateMaintenanceHtml(simpleMaintenance, fixtureCompany), generateMultipleHtml([simpleMaintenance, completeMaintenance], period, fixtureCompany), generateBudgetsHtml(budgetItems, [], 180, fixtureCompany, simpleMaintenance.Customer, "Proposta válida por 15 dias.")];
  for (const html of documents) for (const marker of ["reference-header", "reference-band", "reference-footer", "Fixar Soluções LTDA"]) assert.ok(html.includes(marker), marker);
  assert.match(documents[1], /RELATÓRIO CONSOLIDADO DE/); assert.match(documents[2], /PROPOSTA DE SERVIÇOS/);
});
test("orçamento apresenta quantidades, observações e ajustes financeiros", () => {
  const items = [{ id: "service-1", name: "Higienização", description: "Limpeza completa", price: 180, qtd: 2, total: 360 }];
  const html = generateBudgetsHtml(items, [], 350, fixtureCompany, simpleMaintenance.Customer, "Validade de 15 dias.", { surcharge: 10, discount: 20 });
  for (const expected of ["Higienização", ">2<", "Validade de 15 dias.", "Acréscimos", "R$ 10,00", "Descontos", "R$ 20,00", "R$ 350,00"]) assert.ok(html.includes(expected), expected);
});
