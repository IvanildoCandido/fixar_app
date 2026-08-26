export interface ReportOrganization {
  name: string;
  legal_name?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo_url?: string | null;
}

export const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const detail = (label: string, value?: string | null, wide = false) => value?.trim()
  ? `<div class="company-detail${wide ? " wide" : ""}"><small>${label}</small><strong>${escapeHtml(value)}</strong></div>`
  : "";

export const reportStyles = `
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #14231D; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; font-size: 10.5px; line-height: 1.45; }
  .document-header { display: grid; grid-template-columns: 108px 1fr; gap: 18px; padding: 16px; border: 1px solid #DCE4E0; border-top: 5px solid #167552; border-radius: 14px; background: #FFFFFF; }
  .brand-area { min-height: 86px; display: flex; align-items: center; justify-content: center; padding: 10px; border-radius: 10px; background: #F6F8F7; }
  .brand-logo { width: 88px; max-height: 72px; object-fit: contain; }
  .brand-placeholder { width: 58px; height: 58px; display: flex; align-items: center; justify-content: center; border-radius: 16px; background: #DDF1E8; color: #167552; font-size: 24px; font-weight: 700; }
  .company { min-width: 0; } .company h1 { margin: 0; font-size: 20px; line-height: 1.2; color: #14231D; }
  .company-name { margin-top: 2px; color: #68766F; font-size: 9.5px; }
  .company-details { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 18px; margin-top: 11px; padding-top: 10px; border-top: 1px solid #DCE4E0; }
  .company-detail { min-width: 0; } .company-detail.wide { grid-column: 1 / -1; }
  .company-detail small { display: block; color: #68766F; font-size: 7.5px; line-height: 1.2; text-transform: uppercase; letter-spacing: .45px; }
  .company-detail strong { display: block; margin-top: 2px; color: #34483F; font-size: 9.5px; line-height: 1.35; font-weight: 600; overflow-wrap: anywhere; }
  .report-heading { padding: 18px 0 10px; display: flex; align-items: flex-end; justify-content: space-between; }
  .report-heading h2 { margin: 0; font-size: 17px; } .report-heading p { margin: 3px 0 0; color: #68766F; }
  .badge { padding: 5px 9px; border-radius: 999px; background: #DDF1E8; color: #11553D; font-weight: 600; }
  .section { margin-top: 12px; border: 1px solid #DCE4E0; border-radius: 12px; overflow: hidden; break-inside: avoid; }
  .section-title { padding: 7px 10px; background: #EEF3F0; color: #11553D; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); }
  .field { min-height: 48px; padding: 8px 10px; border-top: 1px solid #DCE4E0; } .field:nth-child(odd) { border-right: 1px solid #DCE4E0; }
  .field.full { grid-column: 1 / -1; border-right: 0; } .label { display: block; margin-bottom: 2px; color: #68766F; font-size: 8.5px; text-transform: uppercase; letter-spacing: .35px; }
  .value { font-weight: 600; white-space: pre-wrap; } .muted { color: #68766F; font-weight: 400; }
  .items { margin: 0; padding: 8px 10px 8px 26px; } .items li { margin: 3px 0; }
  .order { margin-top: 12px; break-inside: avoid; } .order + .order { padding-top: 12px; border-top: 1px dashed #CFD9D4; }
  .total { margin-top: 14px; padding: 12px; display: flex; justify-content: space-between; border-radius: 12px; background: #167552; color: white; font-size: 14px; font-weight: 700; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 42px; break-inside: avoid; }
  .signature { padding-top: 7px; border-top: 1px solid #68766F; text-align: center; color: #68766F; }
  .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #DCE4E0; text-align: center; color: #68766F; font-size: 8px; }
`;

export function companyHeader(company: ReportOrganization) {
  const displayName = company.name?.trim() || "Empresa prestadora";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const logo = company.logo_url?.trim()
    ? `<img class="brand-logo" src="${escapeHtml(company.logo_url)}" alt="Logomarca" />`
    : `<div class="brand-placeholder">${escapeHtml(initials)}</div>`;
  return `<header class="document-header"><div class="brand-area">${logo}</div><div class="company"><h1>${escapeHtml(displayName)}</h1>${company.legal_name && company.legal_name !== displayName ? `<div class="company-name">${escapeHtml(company.legal_name)}</div>` : ""}<div class="company-details">${detail("CPF / CNPJ", company.document)}${detail("Telefone", company.phone)}${detail("E-mail", company.email)}${detail("Endereço", company.address, true)}</div></div></header>`;
}

export const htmlDocument = (company: ReportOrganization, body: string, title: string) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>${reportStyles}</style></head><body>${companyHeader(company)}${body}<footer class="footer">Documento gerado digitalmente pelo Fixar</footer></body></html>`;

export interface ReferenceReportOptions {
  documentTitle: string;
  documentLabel: string;
  reference: string;
  metaLabel: string;
  metaValue: string;
  secondaryMetaLabel?: string;
  secondaryMetaValue?: string;
  body: string;
  extraStyles?: string;
}

export const referenceStyles = `
  @page { size: A4; margin: 5mm; }
  * { box-sizing: border-box; }
  body { min-height: 287mm; margin: 0; display: flex; flex-direction: column; color: #10262A; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; font-size: 7.5px; line-height: 1.28; }
  .reference-header { display:grid; grid-template-columns:25% 33% 42%; padding:7px 10px; border:1px solid #DFE6E7; border-radius:10px; box-shadow:0 2px 10px rgba(16,38,42,.05); break-inside:avoid; }
  .reference-brand,.reference-contact,.reference-title{min-width:0;padding:3px 10px}.reference-contact,.reference-title{border-left:1px solid #D5DDDF}.reference-logo{max-width:132px;max-height:52px;object-fit:contain}.reference-logo-placeholder{width:46px;height:46px;border-radius:12px;background:#DDF1E8;color:#0C5C54;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800}.reference-brand h2{margin:5px 0 0;font-size:10px;font-weight:500}.reference-contact p{margin:0 0 4px}.reference-contact small{display:block;color:#6C787D}.reference-contact strong{display:block;font-weight:500;overflow-wrap:anywhere}.reference-title h1{margin:0;font-size:20px;line-height:.95;letter-spacing:-.4px;text-transform:uppercase}.reference-title h1 span{display:block;font-size:11px;font-weight:500;letter-spacing:0;margin-bottom:3px}.reference-badge{display:inline-block;margin-top:7px;padding:4px 10px;border-radius:5px;background:linear-gradient(90deg,#083D3B,#0D6860);color:white;font-size:9px;font-weight:700}.reference-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;padding:5px 7px;border-radius:7px;background:#F1F3F3}.reference-meta small{display:block;color:#6C787D}.reference-meta b{font-size:8px}
  .report-card{margin-top:5px;padding:7px 10px;border:1px solid #D9E1E3;border-radius:7px;break-inside:avoid}.report-card h3{display:flex;align-items:center;gap:6px;margin:0 0 6px;color:#0C514E;font-size:8.7px;text-transform:uppercase}.report-card h3 span{font-size:11px}.report-two-columns{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:5px}.report-two-columns>.report-card{margin-top:0}.report-field-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 13px}.report-field{padding:3px 0;border-bottom:1px solid #E2E7E8;min-width:0}.report-field.full{grid-column:1/-1}.report-field small{display:block;color:#54666C;margin-bottom:1px}.report-field strong{font-size:7.8px;font-weight:500;overflow-wrap:anywhere}.report-table{width:100%;border-collapse:collapse}.report-table th{padding:4px;background:#F0F2F2;text-align:left;font-size:6.5px}.report-table td{padding:4px;border-bottom:1px solid #E5EAEB}.report-empty{text-align:center;color:#8B989D;margin:10px 0}.report-total{text-align:center;color:#0B6046;font-size:16px;font-weight:800;margin:5px 0}.report-service{display:flex;gap:7px;margin:4px 0}.report-check{width:13px;height:13px;border-radius:50%;background:#10745A;color:#fff;text-align:center;line-height:13px;font-weight:700}.report-service p{margin:1px 0 0;color:#45575D}.report-signatures{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:8px}.report-signature{min-height:48px;display:flex;flex-direction:column;justify-content:flex-end;text-align:center}.report-signature-line{border-top:1px solid #9AA6AA;padding-top:3px}.report-signature-line b,.report-signature-line small{display:block}.report-signature-line small{color:#6C787D}
  .reference-band{margin-top:auto;padding:7px 12px;display:grid;grid-template-columns:repeat(3,1fr) 1.5fr;gap:10px;border-radius:0 0 8px 8px;background:linear-gradient(90deg,#073F3B,#075C57);color:white;break-inside:avoid}.reference-band small{display:block;color:#A8CBC8;text-transform:uppercase;font-size:5.8px;letter-spacing:.3px}.reference-band strong{display:block;margin-top:2px;font-size:7px}.reference-band>div+div{border-left:1px solid rgba(255,255,255,.28);padding-left:10px}.reference-footer{display:flex;justify-content:space-between;padding:5px 3px 0;color:#8A969B;font-size:6.3px}
`;

export function referenceReportDocument(company: ReportOrganization, options: ReferenceReportOptions) {
  const displayName = company.name?.trim() || "Empresa prestadora";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const logo = company.logo_url?.trim() ? `<img class="reference-logo" src="${escapeHtml(company.logo_url)}" alt="Logomarca" />` : `<div class="reference-logo-placeholder">${escapeHtml(initials)}</div>`;
  const contact = (label: string, value?: string | null) => value?.trim() ? `<p><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></p>` : "";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(options.documentTitle)}</title><style>${referenceStyles}${options.extraStyles ?? ""}</style></head><body>
  <header class="reference-header"><div class="reference-brand">${logo}<h2>${escapeHtml(company.legal_name || displayName)}</h2></div><div class="reference-contact">${contact("CNPJ / CPF", company.document)}${contact("Telefone", company.phone)}${contact("E-mail", company.email)}${contact("Endereço", company.address)}</div><div class="reference-title"><h1><span>${escapeHtml(options.documentLabel)}</span>${escapeHtml(options.documentTitle)}</h1><div class="reference-badge">${escapeHtml(options.reference)}</div><div class="reference-meta"><div><small>${escapeHtml(options.metaLabel)}</small><b>${escapeHtml(options.metaValue)}</b></div><div><small>${escapeHtml(options.secondaryMetaLabel || "Documento")}</small><b>${escapeHtml(options.secondaryMetaValue || "Gerado pelo Fixar")}</b></div></div></div></header>
  ${options.body}
  <div class="reference-band"><div><small>Documento</small><strong>Registro digital</strong></div><div><small>Atendimento</small><strong>${escapeHtml(options.documentTitle)}</strong></div><div><small>Empresa</small><strong>${escapeHtml(displayName)}</strong></div><div><small>FIXAR</small><strong>Gestão técnica e rastreabilidade</strong></div></div>
  <footer class="reference-footer"><span>Documento gerado digitalmente pelo Fixar - ${escapeHtml(displayName)}</span><span>${escapeHtml(options.reference)} · ${escapeHtml(options.metaValue)}</span></footer></body></html>`;
}
