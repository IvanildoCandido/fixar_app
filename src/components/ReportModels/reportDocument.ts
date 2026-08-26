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

const iconPaths: Record<string, string> = {
  client: '<circle cx="12" cy="8" r="3"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>',
  equipment: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M7 9h4v4H7zm7 8v3m-6-3v3m8-11h2"/>',
  service: '<path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 8.4 7.2 6.1 4.9a4 4 0 0 0 5 5L4 17l3 3 7.1-7.1a4 4 0 0 0 .6-6.6z"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.4 9.1 8 11 4.6-1.9 8-6 8-11V5l-8-3z"/><path d="m9 12 2 2 4-4"/>',
  package: '<path d="m3 7 9 5 9-5-9-5-9 5zM3 7v10l9 5 9-5V7M12 12v10"/>',
  money: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 12h.01M17 12h.01M12 9v6m2-5.5c-.5-.5-1.2-.7-2-.7-1.1 0-2 .5-2 1.3s.9 1.2 2 1.4 2 .6 2 1.4-.9 1.3-2 1.3c-.8 0-1.5-.2-2-.7"/>',
  note: '<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/>',
  diagnosis: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4M11 8v3l2 2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 2-2z"/>',
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2"/>',
  warranty: '<path d="M12 2 4 5v6c0 5 3.4 9.1 8 11 4.6-1.9 8-6 8-11V5l-8-3z"/><path d="m9 12 2 2 4-4"/>',
};
export const reportIcon = (name: string, className = "report-icon") => `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.note}</svg>`;

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
  body { margin: 0; color: #10262A; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; font-size: 8.6px; line-height: 1.34; }
  .report-icon{width:15px;height:15px;display:inline-block;flex:0 0 auto;color:#075854}.reference-header { display:grid; grid-template-columns:28% 32% 40%; min-height:132px; padding:14px 18px; border:1px solid #E1E7E8; border-radius:12px; box-shadow:0 2px 12px rgba(16,38,42,.055); break-inside:avoid; }
  .reference-brand,.reference-contact,.reference-title{min-width:0;padding:4px 14px}.reference-contact,.reference-title{border-left:1px solid #CFD8DA}.reference-logo{width:165px;max-width:100%;height:74px;object-fit:contain;object-position:left center}.reference-logo-placeholder{width:58px;height:58px;border-radius:14px;background:#DDF1E8;color:#0C5C54;display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:800}.reference-brand h2{margin:8px 0 0;font-size:12px;font-weight:500}.reference-contact p{position:relative;margin:0 0 7px;padding-left:24px}.reference-contact small{display:block;color:#66777C}.reference-contact strong{display:block;font-size:8.8px;font-weight:500;overflow-wrap:anywhere}.reference-title h1{margin:0;font-size:25px;line-height:.96;letter-spacing:-.55px;text-transform:uppercase}.reference-title h1 span{display:block;font-size:13px;font-weight:500;letter-spacing:0;margin-bottom:4px}.reference-badge{display:inline-block;margin-top:10px;padding:5px 13px;border-radius:5px;background:linear-gradient(90deg,#073F3B,#096660);color:white;font-size:10px;font-weight:700;letter-spacing:.4px}.reference-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;padding:8px 10px;border-radius:8px;background:#F1F3F3}.reference-meta small{display:block;color:#69777B}.reference-meta b{font-size:9px}.meta-item{display:flex;gap:8px;align-items:center}.meta-item .report-icon{width:20px;height:20px}
  .report-card{margin-top:8px;padding:12px 14px;border:1px solid #D9E1E3;border-radius:9px;break-inside:avoid}.report-card h3{display:flex;align-items:center;gap:8px;margin:0 0 10px;color:#064E4B;font-size:10.7px;text-transform:uppercase;letter-spacing:.12px}.report-two-columns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.report-two-columns>.report-card{margin-top:0}.report-field-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.report-field{min-height:35px;padding:5px 0;border-bottom:1px solid #DEE5E6;min-width:0}.report-field.full{grid-column:1/-1}.report-field small{display:block;color:#53656A;margin-bottom:2px}.report-field strong{font-size:9px;font-weight:500;overflow-wrap:anywhere}.report-table{width:100%;border-collapse:collapse}.report-table th{padding:6px 7px;background:#F0F2F2;text-align:left;font-size:7.6px}.report-table td{padding:6px 7px;border-bottom:1px solid #E5EAEB}.report-empty{text-align:center;color:#8B989D;margin:15px 0}.report-total{text-align:center;color:#076044;font-size:22px;font-weight:800;margin:9px 0}.report-service{display:flex;gap:9px;margin:6px 0}.report-check{width:16px;height:16px;border-radius:50%;background:#10745A;color:#fff;text-align:center;line-height:16px;font-weight:700}.report-service p{margin:2px 0 0;color:#45575D}.report-signatures{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:10px}.report-signature{min-height:72px;display:flex;flex-direction:column;justify-content:flex-end;text-align:center}.report-signature-line{border-top:1px solid #87969A;padding-top:5px}.report-signature-line b,.report-signature-line small{display:block}.report-signature-line small{color:#6C787D}
  .reference-band{margin-top:8px;min-height:52px;padding:9px 18px;display:grid;grid-template-columns:repeat(3,1fr) 1.7fr;align-items:center;gap:0;border-radius:0 0 10px 10px;background:linear-gradient(105deg,#063E3A,#075C57);color:white;break-inside:avoid}.band-item{display:flex;align-items:center;gap:10px;min-width:0}.band-item .report-icon{width:25px;height:25px;color:#91BDB8}.reference-band small{display:block;color:#A9CDCA;text-transform:uppercase;font-size:6.8px;letter-spacing:.35px}.reference-band strong{display:block;margin-top:2px;font-size:8.3px}.reference-band>div+div{border-left:1px solid rgba(255,255,255,.32);padding-left:16px}.band-message{text-align:right}.band-message span{display:block;margin-top:2px;font-size:7.4px}.reference-footer{display:flex;justify-content:space-between;padding:10px 5px 0;color:#8A969B;font-size:7px}.reference-contact .report-icon{position:absolute;left:0;top:2px;width:16px;height:16px}
`;

export function referenceReportDocument(company: ReportOrganization, options: ReferenceReportOptions) {
  const displayName = company.name?.trim() || "Empresa prestadora";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const logo = company.logo_url?.trim() ? `<img class="reference-logo" src="${escapeHtml(company.logo_url)}" alt="Logomarca" />` : `<div class="reference-logo-placeholder">${escapeHtml(initials)}</div>`;
  const contact = (label: string, value: string | null | undefined, icon: string) => value?.trim() ? `<p>${reportIcon(icon)}<small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></p>` : "";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(options.documentTitle)}</title><style>${referenceStyles}${options.extraStyles ?? ""}</style></head><body>
  <header class="reference-header"><div class="reference-brand">${logo}<h2>${escapeHtml(company.legal_name || displayName)}</h2></div><div class="reference-contact">${contact("CNPJ / CPF", company.document, "client")}${contact("Telefone", company.phone, "phone")}${contact("E-mail", company.email, "note")}${contact("Endereço", company.address, "pin")}</div><div class="reference-title"><h1><span>${escapeHtml(options.documentLabel)}</span>${escapeHtml(options.documentTitle)}</h1><div class="reference-badge">${escapeHtml(options.reference)}</div><div class="reference-meta"><div class="meta-item">${reportIcon("calendar")}<div><small>${escapeHtml(options.metaLabel)}</small><b>${escapeHtml(options.metaValue)}</b></div></div><div class="meta-item">${reportIcon("clock")}<div><small>${escapeHtml(options.secondaryMetaLabel || "Documento")}</small><b>${escapeHtml(options.secondaryMetaValue || "Gerado pelo Fixar")}</b></div></div></div></div></header>
  ${options.body}
  <div class="reference-band"><div class="band-item">${reportIcon("warranty")}<div><small>Garantia de serviço</small><strong>Conforme proposta</strong></div></div><div class="band-item">${reportIcon("phone")}<div><small>Atendimento</small><strong>Rápido e especializado</strong></div></div><div class="band-item">${reportIcon("pin")}<div><small>Área de atuação</small><strong>Conforme contratação</strong></div></div><div class="band-message"><strong>Soluções completas em climatização</strong><span>Confiança que gera conforto.</span></div></div>
  <footer class="reference-footer"><span>Documento gerado digitalmente pelo Fixar - ${escapeHtml(displayName)}</span><span>${escapeHtml(options.reference)} · ${escapeHtml(options.metaValue)}</span></footer></body></html>`;
}
