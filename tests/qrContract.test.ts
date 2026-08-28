import { test } from "node:test";
import assert from "node:assert/strict";
import { createEquipmentQrPayload, extractEquipmentReference, normalizeEquipmentReference } from "@fixar/qr-contract";

test("preserva referências de equipamento com hífen", () => {
  assert.equal(normalizeEquipmentReference("sc-0400"), "SC-0400");
  assert.equal(createEquipmentQrPayload("SC-0400"), "FIXAR|EQUIPMENT|SC-0400");
  assert.equal(extractEquipmentReference("FIXAR|EQUIPMENT|SC-0400"), "SC-0400");
});

test("continua lendo payloads legados de sete caracteres", () => {
  assert.equal(extractEquipmentReference("SC-0400"), "SC-0400");
});
