import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const page = readFileSync("apps/admin-web/src/LegalPages.tsx", "utf8");
const app = readFileSync("apps/admin-web/src/App.tsx", "utf8");
const vercel = readFileSync("vercel.json", "utf8");
const nestedVercel = readFileSync("apps/admin-web/vercel.json", "utf8");

test("páginas legais possuem rotas públicas estáveis e links entre si", () => {
  assert.ok(app.includes('path === "/privacidade"'));
  assert.ok(app.includes('path === "/termos"'));
  assert.ok(page.includes('href="/privacidade"'));
  assert.ok(page.includes('href="/termos"'));
  assert.ok(vercel.includes('"source": "/privacidade"'));
  assert.ok(vercel.includes('"source": "/termos"'));
  assert.ok(nestedVercel.includes('"source": "/privacidade"'));
  assert.ok(nestedVercel.includes('"source": "/termos"'));
});

test("texto legal reflete billing, QR público e offline sem prometer exclusão existente", () => {
  assert.match(page, /Google Play ou App Store/);
  assert.match(page, /QR público/);
  assert.match(page, /temporariamente sem conexão/);
  assert.match(page, /não possui atualmente um fluxo público automatizado de exclusão/);
  assert.doesNotMatch(page, /100% seguro|criptografia militar/);
});
