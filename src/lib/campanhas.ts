import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { todayIso } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import type { Canal, StatusParticipacao } from "@/db/schema";

const { campanhas, participacoes, pedidos, criancas } = schema;

export const STATUS_LABEL: Record<StatusParticipacao, string> = {
  disponivel: "Disponível",
  reservada: "Reservada",
  apadrinhada: "Apadrinhada",
  entregue: "Entregue",
};

export const CANAL_LABEL: Record<Canal, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  presencial: "Presencial",
  igreja: "Igreja",
  outro: "Outro",
};

export const STATUS_CAMPANHA_LABEL = { rascunho: "Rascunho", ativa: "Ativa", encerrada: "Encerrada" } as const;

export const STATUS_PEDIDO_LABEL: Record<string, string> = {
  pendente: "Aguardando pagamento",
  pago: "Pago",
  aguardando_entrega: "Aguardando entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

export const MODALIDADE_LABEL: Record<string, string> = {
  pagamento_online: "Pagamento online",
  entrega_balcao: "Entrega no balcão",
};

export function itensSacolinha(texto: string | null | undefined) {
  return (texto ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function campanhaPorSlug(slug: string) {
  const [c] = await getDb().select().from(campanhas).where(eq(campanhas.slug, slug)).limit(1);
  return c ?? null;
}

/**
 * Quantas crianças já têm padrinho. A reserva de pagamento online ainda pode cair em 30 minutos e
 * não conta; a de quem vai entregar no balcão conta, porque a pessoa já se comprometeu.
 */
export async function progressoCampanhas(ids: number[]) {
  const mapa = new Map<number, { total: number; comPadrinho: number }>();
  if (!ids.length) return mapa;
  const rows = await getDb()
    .select({
      campanhaId: participacoes.campanhaId,
      total: sql<number>`count(*)`,
      comPadrinho: sql<number>`sum(case when ${participacoes.status} in ('apadrinhada','entregue') or (${participacoes.status} = 'reservada' and ${pedidos.modalidade} = 'entrega_balcao') then 1 else 0 end)`,
    })
    .from(participacoes)
    .leftJoin(pedidos, eq(pedidos.id, participacoes.pedidoId))
    .where(inArray(participacoes.campanhaId, ids))
    .groupBy(participacoes.campanhaId);
  for (const r of rows) mapa.set(r.campanhaId, { total: Number(r.total), comPadrinho: Number(r.comPadrinho ?? 0) });
  return mapa;
}

/**
 * Campanha recebendo padrinhos: ativa no painel e dentro da data de fim. Passou da data, ela sai
 * sozinha da página inicial e para de aceitar pedidos, sem ninguém precisar lembrar de encerrar.
 */
export function campanhaAberta(c: { status: string; dataFim: string | null }) {
  return c.status === "ativa" && (!c.dataFim || c.dataFim >= todayIso());
}

export async function campanhasAtivas() {
  return getDb()
    .select()
    .from(campanhas)
    .where(and(eq(campanhas.status, "ativa"), or(isNull(campanhas.dataFim), gte(campanhas.dataFim, todayIso()))))
    .orderBy(desc(campanhas.criadoEm));
}

/** Só o que o site pode mostrar de cada criança: nada de sobrenome, responsável ou contato. */
export async function criancasDaCampanha(campanhaId: number, status: StatusParticipacao[] = ["disponivel"]) {
  return getDb()
    .select({
      id: criancas.id,
      nome: criancas.nome,
      apelidoPublico: criancas.apelidoPublico,
      dataNascimento: criancas.dataNascimento,
      sexo: criancas.sexo,
      tamanhoCamiseta: criancas.tamanhoCamiseta,
      tamanhoCalca: criancas.tamanhoCalca,
      tamanhoCalcado: criancas.tamanhoCalcado,
      sugestaoPresente: criancas.sugestaoPresente,
      gostos: criancas.gostos,
      sonho: criancas.sonho,
      sobre: criancas.sobre,
      versaoImagem: sql<string>`coalesce(case when ${criancas.autorizacaoImagem} then ${criancas.fotoKey} end, ${criancas.avatarKey}, '')`,
      status: participacoes.status,
    })
    .from(participacoes)
    .innerJoin(criancas, eq(criancas.id, participacoes.criancaId))
    .where(and(eq(participacoes.campanhaId, campanhaId), inArray(participacoes.status, status), eq(criancas.ativo, true)))
    .orderBy(asc(criancas.dataNascimento));
}

export type CriancaPublica = Awaited<ReturnType<typeof criancasDaCampanha>>[number];

/** Totais da campanha para o painel: por status, por canal, valor recebido e entregas atrasadas. */
export async function resumoCampanha(campanhaId: number) {
  const db = getDb();
  const [porStatus, porCanal, [recebido], atrasados] = await Promise.all([
    db
      .select({ status: participacoes.status, n: sql<number>`count(*)` })
      .from(participacoes)
      .where(eq(participacoes.campanhaId, campanhaId))
      .groupBy(participacoes.status),
    db
      .select({ canal: participacoes.canal, n: sql<number>`count(*)` })
      .from(participacoes)
      .where(and(eq(participacoes.campanhaId, campanhaId), inArray(participacoes.status, ["apadrinhada", "entregue", "reservada"])))
      .groupBy(participacoes.canal),
    db
      .select({ total: sql<number>`coalesce(sum(${pedidos.valor}), 0)`, n: sql<number>`count(*)` })
      .from(pedidos)
      .where(and(eq(pedidos.campanhaId, campanhaId), eq(pedidos.modalidade, "pagamento_online"), inArray(pedidos.status, ["pago", "entregue"]))),
    entregasAtrasadas(campanhaId),
  ]);
  const status = Object.fromEntries(porStatus.map((r) => [r.status, Number(r.n)])) as Partial<Record<StatusParticipacao, number>>;
  return {
    status,
    total: porStatus.reduce((s, r) => s + Number(r.n), 0),
    canais: porCanal.map((r) => ({ canal: r.canal, n: Number(r.n) })),
    recebidoCentavos: Number(recebido?.total ?? 0),
    pedidosPagos: Number(recebido?.n ?? 0),
    atrasados,
  };
}

/** Quem escolheu entregar no balcão e deixou passar a data limite sem entregar. */
export async function entregasAtrasadas(campanhaId?: number) {
  return getDb()
    .select({ id: pedidos.id, campanhaId: pedidos.campanhaId, prazoEntrega: pedidos.prazoEntrega, padrinhoId: pedidos.padrinhoId, nome: schema.padrinhos.nome })
    .from(pedidos)
    .innerJoin(schema.padrinhos, eq(schema.padrinhos.id, pedidos.padrinhoId))
    .where(
      and(
        eq(pedidos.status, "aguardando_entrega"),
        lt(pedidos.prazoEntrega, todayIso()),
        campanhaId ? eq(pedidos.campanhaId, campanhaId) : undefined,
      ),
    );
}

export function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Caminhos que já são do site e não podem virar endereço de campanha.
export const SLUGS_RESERVADOS = new Set(["agenda", "pedido", "fotos", "modelos", "api", "painel", "robots.txt", "sitemap.xml", "icon.png", "apple-icon.png", "brand", "_next"]);
