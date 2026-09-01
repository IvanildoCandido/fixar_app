function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function todayInBrazilianFormat(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function isoDateToBrazilian(value: string | null | undefined) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

export function brazilianDateToIso(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;

  return `${match[3]}-${match[2]}-${match[1]}`;
}
