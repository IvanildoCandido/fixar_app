import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LABEL_HEIGHT_MM,
  DEFAULT_LABEL_WIDTH_MM,
  generateA4LabelsHtml,
  generateIndividualLabelsHtml,
  labelsPerA4Page,
} from "../src/domain/equipmentLabels";
import { EquipmentLabelPreferences } from "../src/types/data";

const preferences: EquipmentLabelPreferences = { widthMm: 60, heightMm: 40, showOrganizationPhone: true, showEquipmentType: true, showBrandModel: true, showLocation: true };
const item = { id:"asset",assetId:"asset",reference:"AR-001",brand:"LG",model:"Dual",location:"Sala",equipmentType:"Split",customerId:"customer",customerName:"Cliente",publicToken:"token",qrSvg:"<svg></svg>" };
const company = { name:"ClimaTech",phone:"(83) 99999-9999",generatorName:"João",logoUrl:null };
const defaultPreferences: EquipmentLabelPreferences = {
  widthMm: DEFAULT_LABEL_WIDTH_MM,
  heightMm: DEFAULT_LABEL_HEIGHT_MM,
  showOrganizationPhone: true,
  showEquipmentType: false,
  showBrandModel: false,
  showLocation: false,
};

test("calcula a capacidade física da folha A4", () => {
  assert.deepEqual(labelsPerA4Page(preferences), { columns: 3, rows: 6, total: 18 });
});

test("tamanho padrão do FIXAR é 50x30 e cabem 24 etiquetas por folha A4", () => {
  assert.deepEqual(labelsPerA4Page(defaultPreferences), { columns: 3, rows: 8, total: 24 });
});

test("PDF individual usa a dimensão física escolhida e mantém a identidade da empresa", () => {
  const html = generateIndividualLabelsHtml([item], company, preferences);
  assert.match(html, /size:60mm 40mm/);
  assert.match(html, /AR-001/);
  assert.match(html, /ClimaTech/);
  assert.doesNotMatch(html, /Técnico:/);
  assert.match(html, /<i>C<\/i>/);
});

test("usa a logomarca quando a empresa possui uma", () => {
  const html = generateIndividualLabelsHtml([item], { ...company, logoUrl:"https://example.com/logo.png" }, preferences);
  assert.match(html, /<img src="https:\/\/example.com\/logo.png"/);
  assert.doesNotMatch(html, /<i>C<\/i>/);
});

test("PDF A4 cria páginas explícitas sem dividir etiquetas", () => {
  const html = generateA4LabelsHtml(Array.from({length:19},(_,index)=>({...item,id:String(index),reference:`AR-${index}`})), company, preferences);
  assert.equal((html.match(/<section class="sheet">/g) ?? []).length, 2);
  assert.match(html, /break-inside:avoid/);
});

test("A4 com 10 etiquetas usa uma única página em 50x30", () => {
  const html = generateA4LabelsHtml(Array.from({ length: 10 }, (_, index) => ({ ...item, id: String(index), reference: `AR-${String(index + 1).padStart(3, "0")}` })), company, defaultPreferences);
  assert.equal((html.match(/<section class="sheet">/g) ?? []).length, 1);
  assert.equal((html.match(/<article class="label">/g) ?? []).length, 10);
});

test("A4 com 25 etiquetas gera duas páginas quando excede a capacidade da folha", () => {
  const html = generateA4LabelsHtml(Array.from({ length: 25 }, (_, index) => ({ ...item, id: String(index), reference: `AR-${String(index + 1).padStart(3, "0")}` })), company, defaultPreferences);
  assert.equal((html.match(/<section class="sheet">/g) ?? []).length, 2);
  assert.equal((html.match(/<article class="label">/g) ?? []).length, 25);
});

test("20 etiquetas em 50x30 continuam em uma única página", () => {
  const html = generateA4LabelsHtml(Array.from({ length: 20 }, (_, index) => ({ ...item, id: String(index), reference: `AR-${String(index + 1).padStart(3, "0")}` })), company, defaultPreferences);
  assert.equal((html.match(/<section class="sheet">/g) ?? []).length, 1);
  assert.equal((html.match(/<article class="label">/g) ?? []).length, 20);
});

test("etiqueta compacta usa apenas empresa, QR e referência", () => {
  const compact = { ...preferences, widthMm:50 as const, heightMm:30 as const, showEquipmentType:false, showBrandModel:false, showLocation:false };
  const html = generateIndividualLabelsHtml([item], company, compact);
  assert.match(html, /grid-template-columns:45fr 55fr/);
  assert.match(html, /<section class="company-column">/);
  assert.match(html, /<section class="qr-column">/);
  assert.match(html, /ClimaTech/);
  assert.match(html, /\(83\) 99999-9999/);
  assert.match(html, /AR-001/);
  assert.doesNotMatch(html, /Técnico:/);
  assert.doesNotMatch(html, /LG Dual/);
  assert.doesNotMatch(html, />Sala</);
  assert.doesNotMatch(html, />Split</);
  assert.ok(html.indexOf("<svg></svg>") < html.indexOf("AR-001"));
});

test("campos opcionais antigos não alteram o conteúdo visual da etiqueta", () => {
  const html = generateIndividualLabelsHtml([item], company, { ...preferences, showOrganizationPhone:false });
  assert.match(html, /\(83\) 99999-9999/);
  assert.doesNotMatch(html, /LG/);
  assert.doesNotMatch(html, /Dual/);
  assert.doesNotMatch(html, /Cliente/);
});
