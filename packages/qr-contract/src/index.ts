const REFERENCE_LENGTH = 7;
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EQUIPMENT_PAYLOAD_PREFIX = "FIXAR|EQUIPMENT|";

export const EQUIPMENT_REFERENCE_LENGTH = REFERENCE_LENGTH;

export function normalizeEquipmentReference(value: string): string {
  return value.trim().toUpperCase();
}

export function createEquipmentQrPayload(reference: string): string {
  const normalizedReference = normalizeEquipmentReference(reference);
  if (normalizedReference.length !== REFERENCE_LENGTH) {
    throw new Error(`A referência deve ter ${REFERENCE_LENGTH} caracteres.`);
  }
  return `${EQUIPMENT_PAYLOAD_PREFIX}${normalizedReference}`;
}

export function extractEquipmentReference(data: string): string {
  const reference = data.startsWith(EQUIPMENT_PAYLOAD_PREFIX)
    ? data.slice(EQUIPMENT_PAYLOAD_PREFIX.length)
    : data.length > REFERENCE_LENGTH ? data.slice(-REFERENCE_LENGTH) : data;
  return normalizeEquipmentReference(reference);
}

export function createEquipmentReference(randomValues?: Uint32Array): string {
  const values = randomValues ?? crypto.getRandomValues(new Uint32Array(REFERENCE_LENGTH));
  return Array.from({ length: REFERENCE_LENGTH }, (_, index) => (
    REFERENCE_ALPHABET[values[index] % REFERENCE_ALPHABET.length]
  )).join("");
}
