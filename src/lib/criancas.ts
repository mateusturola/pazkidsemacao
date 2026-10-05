import { todayIso } from "@/lib/dates";

/** Idade completa em anos, contada no dia de hoje em São Paulo. */
export function idade(dataNascimento: string | null | undefined) {
  if (!dataNascimento || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) return null;
  const [y, m, d] = dataNascimento.split("-").map(Number);
  const [ty, tm, td] = todayIso().split("-").map(Number);
  let anos = ty - y;
  if (tm < m || (tm === m && td < d)) anos--;
  return anos >= 0 ? anos : null;
}

export function idadeTexto(dataNascimento: string | null | undefined) {
  const a = idade(dataNascimento);
  if (a == null) return null;
  if (a === 0) return "menos de 1 ano";
  return a === 1 ? "1 ano" : `${a} anos`;
}

/**
 * Nome que pode aparecer no site: o apelido público, ou só o primeiro nome. Sobrenome nunca sai do
 * painel (LGPD e ECA: o site mostra o mínimo para o doador escolher).
 */
export function nomePublico(c: { nome: string; apelidoPublico: string | null }) {
  const apelido = c.apelidoPublico?.trim();
  if (apelido) return apelido;
  return c.nome.trim().split(/\s+/)[0] ?? "";
}

export const SEXO_LABEL: Record<string, string> = { F: "Menina", M: "Menino" };
