const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number | null | undefined) {
  return brl.format((cents ?? 0) / 100);
}

/** "1.500,50", "1500.5", "R$ 1.500" → centavos. Vazio ou inválido → null. */
export function parseBRL(input: FormDataEntryValue | null): number | null {
  if (typeof input !== "string") return null;
  let s = input.replace(/[^\d,.-]/g, "").trim();
  if (!s) return null;
  // Formato brasileiro: ponto é milhar e vírgula é decimal. Só trata o ponto como decimal
  // quando não há vírgula e ele separa exatamente 1 ou 2 casas ("1500.5").
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (!/^\d+\.\d{1,2}$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** Centavos → texto para preencher input ("1500,50"). */
export function centsToInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}
