export type CommercialLimitError = {
  code: "PLAN_LIMIT_REACHED";
  resource: "customer" | "equipment" | "qr_code" | "quote" | "work_order";
  usage: number;
  limit: number;
  requested: number;
  plan_code: string;
};

export function parseCommercialError(error: unknown): CommercialLimitError | null {
  const source = error as { message?: string; details?: string } | null;
  if (!source || source.message !== "PLAN_LIMIT_REACHED") return null;
  try {
    const details = JSON.parse(source.details ?? "{}") as CommercialLimitError;
    if (details.code !== "PLAN_LIMIT_REACHED") return null;
    return details;
  } catch {
    return null;
  }
}

export function normalizeCommercialError(error: unknown): Error {
  const commercialError = parseCommercialError(error);
  if (!commercialError) return error instanceof Error ? error : new Error("Não foi possível concluir a operação.");
  return Object.assign(new Error(commercialError.code), commercialError);
}

export function commercialErrorMessage(error: unknown): string | null {
  const commercialError = parseCommercialError(error) ?? (error as CommercialLimitError | null);
  if (!commercialError || commercialError.code !== "PLAN_LIMIT_REACHED") return null;
  const labels = { customer: "clientes", equipment: "equipamentos", qr_code: "QR Codes", quote: "orçamentos", work_order: "manutenções" } as const;
  return `Você atingiu o limite de ${commercialError.limit} ${labels[commercialError.resource]} do seu plano.`;
}
