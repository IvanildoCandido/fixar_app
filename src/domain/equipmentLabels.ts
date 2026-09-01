import { EquipmentLabelItem, EquipmentLabelPreferences } from "../types/data";

export const DEFAULT_LABEL_WIDTH_MM = 50;
export const DEFAULT_LABEL_HEIGHT_MM = 30;
export const DEFAULT_LABEL_MARGIN_MM = 8;
export const DEFAULT_LABEL_GAP_MM = 3;
export const EQUIPMENT_LABEL_COMPANY_COLUMN_PERCENT = 45;
export const EQUIPMENT_LABEL_QR_COLUMN_PERCENT = 55;

export type EquipmentLabelDocumentItem = EquipmentLabelItem & { qrSvg: string };
export type EquipmentLabelCompany = { name: string; phone?: string | null; logoUrl?: string | null; generatorName: string };

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]!));

export function buildEquipmentLabelContent(item: EquipmentLabelDocumentItem, company: EquipmentLabelCompany) {
  return {
    companyName: company.name,
    companyPhone: company.phone ?? null,
    companyLogoUrl: company.logoUrl ?? null,
    companyInitials: company.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
    qrSvg: item.qrSvg,
    reference: item.reference,
  };
}

export function labelsPerA4Page(preferences: EquipmentLabelPreferences, marginMm = DEFAULT_LABEL_MARGIN_MM, gapMm = DEFAULT_LABEL_GAP_MM) {
  const columns = Math.max(1, Math.floor((210 - marginMm * 2 + gapMm) / (preferences.widthMm + gapMm)));
  const rows = Math.max(1, Math.floor((297 - marginMm * 2 + gapMm) / (preferences.heightMm + gapMm)));
  return { columns, rows, total: columns * rows };
}

function labelMarkup(item: EquipmentLabelDocumentItem, company: EquipmentLabelCompany) {
  const content = buildEquipmentLabelContent(item, company);
  const phone = content.companyPhone ? `<small>${escapeHtml(content.companyPhone)}</small>` : "";
  const logo = content.companyLogoUrl
    ? `<img src="${escapeHtml(content.companyLogoUrl)}" alt="" />`
    : `<i>${escapeHtml(content.companyInitials)}</i>`;

  return `<article class="label"><section class="company-column">${logo}<b>${escapeHtml(content.companyName)}</b>${phone}</section><section class="qr-column"><div class="qr">${content.qrSvg}</div><span class="reference">${escapeHtml(content.reference)}</span></section></article>`;
}

const styles = (preferences: EquipmentLabelPreferences) => {
  const qrSizeMm = Math.max(16, Math.min(23, preferences.heightMm - 8));
  const referenceSizePt = preferences.heightMm <= 30 ? 8 : 10;
  return `*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#10261d;background:#f4f6f5}.label{width:${preferences.widthMm}mm;height:${preferences.heightMm}mm;padding:2mm;border:.25mm solid #c7d5cf;border-radius:2.2mm;overflow:hidden;display:grid;grid-template-columns:${EQUIPMENT_LABEL_COMPANY_COLUMN_PERCENT}fr ${EQUIPMENT_LABEL_QR_COLUMN_PERCENT}fr;background:#fff;box-shadow:0 1px 2px rgba(16,38,29,.05)}.company-column,.qr-column{min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.company-column{gap:1mm;padding-right:1.5mm}.company-column img{display:block;width:82%;height:10mm;object-fit:contain}.company-column i{width:11mm;height:9mm;display:flex;align-items:center;justify-content:center;border-radius:1.5mm;background:#ddf1e8;color:#167552;font-size:9pt;font-style:normal;font-weight:bold}.company-column b{max-width:100%;font-size:7pt;line-height:1.12;overflow-wrap:anywhere}.company-column small{font-size:5.4pt;line-height:1.1;color:#48625b}.qr-column{gap:.8mm;padding-left:1.5mm;border-left:.2mm solid #e3ebe7}.qr{display:flex;align-items:center;justify-content:center;min-width:0;min-height:0}.label svg{display:block;width:${qrSizeMm}mm;height:${qrSizeMm}mm}.reference{max-width:100%;font-size:${referenceSizePt}pt;font-weight:700;line-height:1;color:#10261d;overflow-wrap:anywhere}`;
};

export function generateIndividualLabelsHtml(items: EquipmentLabelDocumentItem[], company: EquipmentLabelCompany, preferences: EquipmentLabelPreferences) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${preferences.widthMm}mm ${preferences.heightMm}mm;margin:0}${styles(preferences)}.label{break-after:page}</style></head><body>${items.map((item) => labelMarkup(item, company)).join("")}</body></html>`;
}

export function generateA4LabelsHtml(items: EquipmentLabelDocumentItem[], company: EquipmentLabelCompany, preferences: EquipmentLabelPreferences) {
  const layout = labelsPerA4Page(preferences);
  const pages = Array.from({ length: Math.ceil(items.length / layout.total) }, (_, index) => items.slice(index * layout.total, (index + 1) * layout.total));
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}${styles(preferences)}.sheet{width:210mm;height:297mm;padding:8mm;display:grid;align-content:start;grid-template-columns:repeat(${layout.columns},${preferences.widthMm}mm);grid-auto-rows:${preferences.heightMm}mm;gap:3mm;break-after:page}.sheet:last-child{break-after:auto}.label{break-inside:avoid}</style></head><body>${pages.map((page) => `<section class="sheet">${page.map((item) => labelMarkup(item, company)).join("")}</section>`).join("")}</body></html>`;
}
