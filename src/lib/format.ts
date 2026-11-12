const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (v: number) => brl.format(v).replace(/\u00a0/g, " ");

// Aceita o jeito que a pessoa digita no celular: "129,90", "1.299,90" ou "129.90".
export function parseMoney(input: string | number | null | undefined): number {
  if (typeof input === "number") return input;
  const raw = String(input ?? "").replace(/\s|R\$/g, "");
  if (!raw) return NaN;
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  if (hasComma) return Number(raw.replace(/\./g, "").replace(",", "."));
  // "1.299" sem vírgula costuma ser milhar, não decimal
  if (hasDot && raw.split(".").length === 2 && /\.\d{3}$/.test(raw))
    return Number(raw.replace(/\./g, ""));
  return Number(raw);
}
