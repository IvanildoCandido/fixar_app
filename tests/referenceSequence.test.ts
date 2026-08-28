import assert from "node:assert/strict";
import test from "node:test";
import { createReferenceSequence } from "../apps/admin-web/src/referenceSequence";

test("preserva prefixo, zeros e incrementa a parte numérica", () => {
  assert.deepEqual(createReferenceSequence("SC-0600", 4), ["SC-0600", "SC-0601", "SC-0602", "SC-0603"]);
});

test("normaliza referência única sem sufixo numérico", () => {
  assert.deepEqual(createReferenceSequence(" fxr8k2m ", 1), ["FXR8K2M"]);
});

test("recusa sequência sem sufixo numérico", () => {
  assert.throws(() => createReferenceSequence("FXR8K2M", 2), /terminar em números/);
});
