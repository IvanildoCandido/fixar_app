import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const onboarding = readFileSync("src/screens/Onboarding/index.tsx", "utf8");
const home = readFileSync("src/screens/Home/index.tsx", "utf8");
const service = readFileSync("src/services/onboarding.ts", "utf8");
const routes = readFileSync("src/routes/main.routes.tsx", "utf8");

test("onboarding apresenta as seis mensagens reais e pode ser pulado", () => {
  for (const text of ["Organize sua operação técnica", "Seus clientes e equipamentos", "QR Code", "Registre tudo durante o atendimento", "conexão falhar", "Transforme cada atendimento em histórico"]) assert.match(onboarding, new RegExp(text));
  assert.match(onboarding, /Pular/);
  assert.match(onboarding, /Configuração inicial/i);
});

test("onboarding e checklist respeitam escopo de usuário e organização", () => {
  assert.match(service, /onboarding:pending/);
  assert.match(service, /userId: string, organizationId: string/);
  assert.match(service, /count: "exact", head: true/);
  assert.match(home, /Primeiros passos/);
  assert.match(home, /loadFirstSteps/);
  assert.match(routes, /isOnboardingPending/);
});
