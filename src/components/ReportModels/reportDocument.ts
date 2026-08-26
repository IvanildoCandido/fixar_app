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
