import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const { parceiros, pedidos, padrinhos } = schema;

/** As empresas da seção "Quem faz parte", na ordem que a equipe escolheu. */
export function parceirosAtivos() {
  return getDb().select().from(parceiros).where(eq(parceiros.ativo, true)).orderBy(asc(parceiros.ordem), asc(parceiros.id));
}

/** Só endereço http(s): o link vai num <a> público, e "javascript:" ou coisa parecida não pode passar. */
export function linkSeguro(valor: string | null | undefined) {
  const v = (valor ?? "").trim();
  if (!v) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** "Joana Maria da Silva" vira "Joana Silva": o mural mostra o primeiro e o último nome, como diz a caixinha. */
export function nomeNoMural(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const cap = (p: string) => p.charAt(0).toLocaleUpperCase("pt-BR") + p.slice(1).toLocaleLowerCase("pt-BR");
  if (partes.length <= 1) return cap(partes[0] ?? "");
  return `${cap(partes[0])} ${cap(partes.at(-1)!)}`;
}

// Apadrinhamento confirmado: pago, ou sacolinha comprometida para entregar no balcão.
const CONFIRMADO = ["pago", "aguardando_entrega", "entregue"] as const;

/** Quem pediu para aparecer, do apadrinhamento mais recente ao mais antigo, uma vez cada. */
export async function padrinhosNoMural(limite = 150) {
  const linhas = await getDb()
    .select({ nome: padrinhos.nome, ultimo: sql<number>`max(${pedidos.criadoEm})` })
    .from(pedidos)
    .innerJoin(padrinhos, eq(padrinhos.id, pedidos.padrinhoId))
    .where(and(eq(pedidos.exibirNome, true), inArray(pedidos.status, [...CONFIRMADO])))
    .groupBy(padrinhos.id)
    .orderBy(desc(sql`max(${pedidos.criadoEm})`))
    .limit(limite);
  return [...new Set(linhas.map((l) => nomeNoMural(l.nome)).filter(Boolean))];
}
