import assert from "node:assert/strict";
import test from "node:test";
import { organizationLogoOutput } from "../src/domain/organizationLogo";

test("reduz logo horizontal sem deformar e limita o maior lado", () => {
  assert.deepEqual(organizationLogoOutput(4000, 2000, "image/jpeg"), {
    width: 1200,
    height: 600,
    contentType: "image/webp",
    extension: "webp",
    preserveTransparency: false,
  });
});

test("não amplia imagem pequena", () => {
  const output = organizationLogoOutput(800, 400, "image/jpeg");
  assert.equal(output.width, 800);
  assert.equal(output.height, 400);
});

test("mantém PNG para preservar transparência", () => {
  const output = organizationLogoOutput(2400, 2400, "image/png");
  assert.equal(output.width, 1200);
  assert.equal(output.height, 1200);
  assert.equal(output.contentType, "image/png");
  assert.equal(output.extension, "png");
  assert.equal(output.preserveTransparency, true);
});

test("permite uma segunda redução para arquivos ainda grandes", () => {
  const output = organizationLogoOutput(2400, 1200, "image/png", 800);
  assert.equal(output.width, 800);
  assert.equal(output.height, 400);
});
