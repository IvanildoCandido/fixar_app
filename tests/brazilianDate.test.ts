import assert from "node:assert/strict";
import test from "node:test";
import { brazilianDateToIso, isoDateToBrazilian, todayInBrazilianFormat } from "../src/utils/brazilianDate";

test("apresenta data ISO no formato brasileiro", () => {
  assert.equal(isoDateToBrazilian("2026-08-31"), "31/08/2026");
});

test("converte data brasileira para persistência ISO", () => {
  assert.equal(brazilianDateToIso("31/08/2026"), "2026-08-31");
});

test("recusa datas inexistentes", () => {
  assert.equal(brazilianDateToIso("31/02/2026"), null);
  assert.equal(brazilianDateToIso("29/02/2025"), null);
});

test("aceita ano bissexto", () => {
  assert.equal(brazilianDateToIso("29/02/2024"), "2024-02-29");
});

test("gera a data local atual no formato brasileiro", () => {
  assert.equal(todayInBrazilianFormat(new Date(2026, 7, 31)), "31/08/2026");
});
