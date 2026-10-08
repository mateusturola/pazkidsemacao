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

// Verbos com que a equipe costuma escrever o sonho ("ser professora", "conhecer a praia"). Sem um
// deles, o sonho é uma profissão ("professora") e ganha o "ser" na frente.
const VERBO_SONHO = /^(ser|ter|ir|conhecer|viajar|morar|ganhar|aprender|fazer|virar|jogar|ajudar|cantar|dançar|voar|pilotar|cuidar|construir|andar)\b/i;

/** "professora" e "ser professora" viram "sonha em ser professora". */
export function fraseSonho(sonho: string | null | undefined) {
  const s = sonho?.trim().replace(/[.!]+$/, "");
  if (!s) return null;
  const minuscula = s.charAt(0).toLowerCase() + s.slice(1);
  return VERBO_SONHO.test(minuscula) ? `sonha em ${minuscula}` : `sonha em ser ${minuscula}`;
}

/**
 * O texto de "conhecer a criança". A história contada pela família vem primeiro; sem ela, o texto
 * se monta com o que o cadastro tem (idade, gostos, ideia de presente), para nenhuma criança ficar
 * sem apresentação no site.
 */
export function historiaCrianca(c: { nome: string; idadeTexto: string | null; gostos: string | null; sugestao: string | null; sobre: string | null }) {
  const sobre = c.sobre?.trim();
  if (sobre) return sobre;
  const gostos = c.gostos?.trim().replace(/[.!]+$/, "");
  const presente = c.sugestao?.trim().replace(/[.!]+$/, "");
  const base = c.idadeTexto ? `${c.nome} tem ${c.idadeTexto}` : c.nome;
  if (!gostos && !presente) return c.idadeTexto ? `${base} e está esperando um padrinho para este Natal.` : `${base} está esperando um padrinho para este Natal.`;
  let t = gostos ? `${base}${c.idadeTexto ? " e gosta" : " gosta"} de ${gostos.charAt(0).toLowerCase()}${gostos.slice(1)}.` : `${base}.`;
  if (presente) t += ` Uma ideia de presente: ${presente.charAt(0).toLowerCase()}${presente.slice(1)}.`;
  return t;
}

/**
 * "o Natal da Mari, 8 anos, que sonha em ser professora; do Pedrinho, 3 anos; e da Ana, 4 anos".
 * O agradecimento fala de crianças com nome e sonho, não de "4 crianças".
 */
export function natalDas(lista: { nome: string; apelidoPublico: string | null; sexo: "F" | "M" | null; dataNascimento: string | null; sonho: string | null }[]) {
  const partes = lista.map((c) => {
    const de = c.sexo === "F" ? "da" : c.sexo === "M" ? "do" : "de";
    const anos = idadeTexto(c.dataNascimento);
    const sonho = fraseSonho(c.sonho);
    return `${de} ${nomePublico(c)}${anos ? `, ${anos}` : ""}${sonho ? `, que ${sonho}` : ""}`;
  });
  if (partes.length <= 1) return `o Natal ${partes[0] ?? ""}`.trim();
  if (partes.length === 2) return `o Natal ${partes[0]}${partes[0].includes(",") ? "," : ""} e ${partes[1]}`;
  // Com sonho no meio, a vírgula não separa mais uma criança da outra: o ponto e vírgula separa.
  const sep = partes.some((p) => p.includes(",")) ? "; " : ", ";
  return `o Natal ${partes.slice(0, -1).join(sep)}${sep === "; " ? ";" : ""} e ${partes.at(-1)}`;
}
