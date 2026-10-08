import "server-only";
import type { BatchItem } from "drizzle-orm/batch";
import { and, inArray, like, notInArray, sql } from "drizzle-orm";
import { apagar } from "@/lib/arquivos";
import { getDb, schema } from "@/lib/db";

const { criancas, emailsEnviados, padrinhos, participacoes, pedidoItens, pedidos } = schema;

// As crianças fictícias de demonstração (seed/demo.sql e a lista de teste) vêm com id_externo "demo-N".
// É a única marca que separa elas das reais: a importação nunca gera esse prefixo.
const ehDemo = like(criancas.idExterno, "demo-%");
const idsDemo = sql`(select ${criancas.id} from ${criancas} where ${criancas.idExterno} like 'demo-%')`;

// O D1 aceita no máximo 100 parâmetros por consulta.
const pedacos = <T>(v: T[], n = 90) => Array.from({ length: Math.ceil(v.length / n) }, (_, i) => v.slice(i * n, i * n + n));

/** Pedidos de teste: os que só têm crianças de demonstração. Um pedido com criança real misturada fica de fora. */
async function pedidosDeTeste() {
  const linhas = await getDb()
    .select({ pedidoId: pedidoItens.pedidoId, reais: sql<number>`sum(case when ${pedidoItens.criancaId} in ${idsDemo} then 0 else 1 end)` })
    .from(pedidoItens)
    .where(sql`${pedidoItens.pedidoId} in (select ${pedidoItens.pedidoId} from ${pedidoItens} where ${pedidoItens.criancaId} in ${idsDemo})`)
    .groupBy(pedidoItens.pedidoId);
  return { teste: linhas.filter((l) => !Number(l.reais)).map((l) => l.pedidoId), misturados: linhas.filter((l) => Number(l.reais)).length };
}

export async function contarDemonstracao() {
  const [[{ n }], p] = await Promise.all([getDb().select({ n: sql<number>`count(*)` }).from(criancas).where(ehDemo), pedidosDeTeste()]);
  return { criancas: Number(n), pedidos: p.teste.length };
}

/**
 * Apaga as crianças de demonstração e tudo que só existe por causa delas: participações, pedidos de
 * teste, e-mails desses pedidos e os padrinhos que não têm outro pedido. Crianças reais não são tocadas.
 */
export async function apagarDemonstracao() {
  const db = getDb();
  const { teste, misturados } = await pedidosDeTeste();
  // Apagar a criança de um pedido que também tem criança real mudaria um pedido de verdade.
  if (misturados) throw new Error(`${misturados} pedido(s) misturam criança de demonstração com criança real. Resolva esses pedidos antes.`);

  const [doadores, arquivos] = await Promise.all([
    teste.length ? db.selectDistinct({ id: pedidos.padrinhoId }).from(pedidos).where(inArray(pedidos.id, teste)) : [],
    db.select({ foto: criancas.fotoKey, avatar: criancas.avatarKey }).from(criancas).where(ehDemo),
  ]);

  // Em lote: se uma parte falha, nada é apagado. A ordem respeita as chaves estrangeiras.
  const p = pedacos(teste);
  const d = pedacos(doadores.map((x) => x.id));
  const passos: BatchItem<"sqlite">[] = [
    db.delete(participacoes).where(sql`${participacoes.criancaId} in ${idsDemo}`),
    ...p.map((ids) => db.delete(participacoes).where(inArray(participacoes.pedidoId, ids))),
    ...p.map((ids) => db.delete(emailsEnviados).where(inArray(emailsEnviados.pedidoId, ids))),
    ...p.map((ids) => db.delete(pedidoItens).where(inArray(pedidoItens.pedidoId, ids))),
    ...p.map((ids) => db.delete(pedidos).where(inArray(pedidos.id, ids))),
    ...d.map((ids) => db.delete(padrinhos).where(and(inArray(padrinhos.id, ids), notInArray(padrinhos.id, db.select({ id: pedidos.padrinhoId }).from(pedidos))))),
    db.delete(criancas).where(ehDemo),
  ];
  await db.batch(passos as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);

  await Promise.all(arquivos.flatMap((a) => [apagar(a.foto), apagar(a.avatar)]));
  return { criancas: arquivos.length, pedidos: teste.length };
}

