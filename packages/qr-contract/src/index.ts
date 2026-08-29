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

export function extractFixarEquipmentToken(data: string, publicBaseUrl: string): string | null {
  try {
    const scanned = new URL(data);
    const expected = new URL(publicBaseUrl);
    if (scanned.origin !== expected.origin) return null;
    const match = scanned.pathname.match(/^\/e\/([0-9a-f-]{36})\/?$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function createEquipmentPublicUrl(publicBaseUrl: string, token: string): string {
  const baseUrl = new URL(publicBaseUrl);
  if (baseUrl.protocol !== "https:") throw new Error("A URL pública deve usar HTTPS.");
  if (!/^[0-9a-f-]{36}$/i.test(token)) throw new Error("Token de equipamento inválido.");
  baseUrl.pathname = `/e/${token}`;
  baseUrl.search = "";
  baseUrl.hash = "";
  return baseUrl.toString().replace(/\/$/, "");
}

export function createEquipmentReference(randomValues?: Uint32Array): string {
  const values = randomValues ?? crypto.getRandomValues(new Uint32Array(REFERENCE_LENGTH));
  return Array.from({ length: REFERENCE_LENGTH }, (_, index) => (
    REFERENCE_ALPHABET[values[index] % REFERENCE_ALPHABET.length]
  )).join("");
}
