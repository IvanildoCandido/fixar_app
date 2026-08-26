import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateMaintenanceHtml } from "../src/components/ReportModels/SinglePDF";
import { generateMultipleHtml } from "../src/components/ReportModels/MultiplePDF";
import { generateBudgetsHtml } from "../src/components/ReportModels/Budgets";
import { completeMaintenance, fixtureCompany, simpleMaintenance } from "../tests/fixtures/maintenanceReports";

async function main() {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const output = join(root, "output/pdf");
  const previews = join(root, "tmp/pdfs");
  await mkdir(output, { recursive: true }); await mkdir(previews, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const period = { start: 1, startFormatted: "01/08/2026", end: 31, endFormatted: "31/08/2026" };
  const budgetItems = [{ id: "service-budget", name: "Manutenção preventiva completa", description: "Limpeza, inspeção elétrica e teste operacional", price: 180, qtd: 2, total: 360 }];
  const documents: [string, string][] = [
    ["relatorio-sc-0101", generateMaintenanceHtml(simpleMaintenance, fixtureCompany)],
    ["relatorio-manutencao-completa-ficticia", generateMaintenanceHtml(completeMaintenance, fixtureCompany)],
    ["relatorio-manutencoes-consolidado", generateMultipleHtml([simpleMaintenance, completeMaintenance], period, fixtureCompany)],
    ["orcamento-servicos", generateBudgetsHtml(budgetItems, [{ id: "part-budget", name: "Fita elastomérica", description: "Material previsto", price: 18.5, qtd: 2, total: 37 }], 397, fixtureCompany, simpleMaintenance.Customer, "Proposta válida por 15 dias. Agendamento sujeito à disponibilidade.")],
  ];
  for (const [name, html] of documents) {
  await writeFile(join(previews, `${name}.html`), html, "utf8");
  const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "networkidle" }); await page.emulateMedia({ media: "print" });
  const pdfPath = join(output, `${name}.pdf`);
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true, preferCSSPageSize: true });
  await page.screenshot({ path: join(previews, `${name}.png`), fullPage: true });
  const pdf = await PDFDocument.load(await (await import("node:fs/promises")).readFile(pdfPath));
  if (pdf.getPageCount() !== 1) throw new Error(`${name}: esperado 1 página, obtido ${pdf.getPageCount()}`);
  console.log(`${name}: ${pdf.getPageCount()} página(s)`);
  await page.close();
  }
  await browser.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
