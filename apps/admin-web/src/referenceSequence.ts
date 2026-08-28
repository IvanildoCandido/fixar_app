import { createEquipmentReference, normalizeEquipmentReference } from "@fixar/qr-contract";

export function createReferenceSequence(input: string, quantity: number) {
  const normalized = normalizeEquipmentReference(input);
  if (!normalized) return Array.from({ length: quantity }, () => createEquipmentReference());
  const match = normalized.match(/^(.*?)(\d+)$/);
  if (quantity > 1 && !match) throw new Error("Para gerar uma sequência, a referência deve terminar em números.");
  if (!match) return [normalized];
  const [, prefix, number] = match;
  return Array.from({ length: quantity }, (_, index) => `${prefix}${String(Number(number) + index).padStart(number.length, "0")}`);
}
