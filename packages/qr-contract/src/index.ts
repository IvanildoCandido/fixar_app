const REFERENCE_LENGTH = 7;
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const EQUIPMENT_REFERENCE_LENGTH = REFERENCE_LENGTH;

export function normalizeEquipmentReference(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-REFERENCE_LENGTH);
}

export function createEquipmentQrPayload(reference: string): string {
  const normalizedReference = normalizeEquipmentReference(reference);
  if (normalizedReference.length !== REFERENCE_LENGTH) {
    throw new Error(`A referência deve ter ${REFERENCE_LENGTH} caracteres.`);
  }
  return `FIXAR|EQUIPMENT|${normalizedReference}`;
}

export function createEquipmentReference(randomValues?: Uint32Array): string {
  const values = randomValues ?? crypto.getRandomValues(new Uint32Array(REFERENCE_LENGTH));
  return Array.from({ length: REFERENCE_LENGTH }, (_, index) => (
    REFERENCE_ALPHABET[values[index] % REFERENCE_ALPHABET.length]
  )).join("");
}
