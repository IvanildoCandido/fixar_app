import assert from "node:assert/strict";
import test from "node:test";
import { createWhatsappUrl, normalizeBrazilianWhatsappNumber } from "../apps/admin-web/src/whatsapp";

test("adiciona o código do Brasil ao telefone da empresa", () => {
  assert.equal(normalizeBrazilianWhatsappNumber("(83) 99815-7585"), "5583998157585");
});

test("preserva número brasileiro que já possui código internacional", () => {
  assert.equal(normalizeBrazilianWhatsappNumber("+55 83 99815-7585"), "5583998157585");
});

test("remove o zero de longa distância antes de montar o número", () => {
  assert.equal(normalizeBrazilianWhatsappNumber("083 99815-7585"), "5583998157585");
});

test("não cria conversa sem um telefone brasileiro válido", () => {
  assert.equal(createWhatsappUrl("123", "Olá"), null);
});

test("cria link do WhatsApp com número e mensagem codificada", () => {
  assert.equal(
    createWhatsappUrl("(83) 99815-7585", "Olá! Equipamento SC-0001."),
    "https://wa.me/5583998157585?text=Ol%C3%A1!%20Equipamento%20SC-0001."
  );
});
