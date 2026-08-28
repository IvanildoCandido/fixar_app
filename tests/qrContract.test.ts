import { test } from "node:test";
import assert from "node:assert/strict";
import { createEquipmentQrPayload, extractEquipmentReference, extractFixarEquipmentToken, normalizeEquipmentReference } from "@fixar/qr-contract";

test("preserva referências de equipamento com hífen", () => {
  assert.equal(normalizeEquipmentReference("sc-0400"), "SC-0400");
  assert.equal(createEquipmentQrPayload("SC-0400"), "FIXAR|EQUIPMENT|SC-0400");
  assert.equal(extractEquipmentReference("FIXAR|EQUIPMENT|SC-0400"), "SC-0400");
});

test("continua lendo payloads legados de sete caracteres", () => {
  assert.equal(extractEquipmentReference("SC-0400"), "SC-0400");
});

test("extrai token somente da URL oficial de equipamento", () => {
  const token = "123e4567-e89b-42d3-a456-426614174000";
  assert.equal(extractFixarEquipmentToken(`https://fixar.systechsolucoes.com.br/e/${token}`, "https://fixar.systechsolucoes.com.br"), token);
  assert.equal(extractFixarEquipmentToken(`https://outro.example/e/${token}`, "https://fixar.systechsolucoes.com.br"), null);
  assert.equal(extractFixarEquipmentToken("SC-0400", "https://fixar.systechsolucoes.com.br"), null);
});
