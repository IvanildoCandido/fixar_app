import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20260904100000_account_deletion_requests.sql", "utf8");
const fn = readFileSync("supabase/functions/account-delete/index.ts", "utf8");
const screen = readFileSync("src/screens/DeleteAccount/index.tsx", "utf8");
const page = readFileSync("apps/admin-web/src/LegalPages.tsx", "utf8");

test("exclusão mantém dados compartilhados e protege solicitações", () => {
  assert.match(migration, /account_deletion_requests/);
  assert.match(migration, /enable row level security/);
  assert.match(fn, /auth\.admin\.deleteUser\(userId\)/);
  assert.match(fn, /OWNER_REQUIRES_REVIEW/);
  assert.match(fn, /body\.confirmation !== "EXCLUIR"/);
  assert.doesNotMatch(fn, /organization.*delete|delete\(\).*organizations/i);
});

test("app e página pública oferecem instruções reais", () => {
  assert.match(screen, /Excluir minha conta/);
  assert.match(screen, /EXCLUIR/);
  assert.match(page, /AccountDeletionPage/);
  assert.match(page, /\/excluir-conta/);
  assert.match(page, /Google Play ou App Store/);
});
