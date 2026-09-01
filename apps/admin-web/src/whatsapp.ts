export function normalizeBrazilianWhatsappNumber(value: string | null | undefined) {
  let digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(1);
  }
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;

  return /^55\d{10,11}$/.test(digits) ? digits : null;
}

export function createWhatsappUrl(phone: string | null | undefined, message: string) {
  const number = normalizeBrazilianWhatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}
