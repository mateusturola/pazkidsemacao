import "server-only";
import { and, eq, inArray, lt, notInArray, sql } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { deletePayment } from "@/lib/asaas";
import { auditar } from "@/lib/auditoria";
import { todayIso } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { enviarDepois } from "@/lib/email";

const { participacoes, pedidos, pedidoItens, padrinhos, criancas } = schema;

// Quem garante que duas pessoas não levam a mesma criança é o UPDATE condicional: ele só troca
// "disponivel" por "reservada", e o D1 executa uma instrução por vez. Quem chega depois encontra a
// linha já reservada e não altera nada; a contagem de linhas devolvidas diz quem ganhou.

const LIBERADA = {
  status: "disponivel" as const,
  pedidoId: null,
  padrinhoNome: null,
  padrinhoContato: null,
  canal: null,
  dataApadrinhamento: null,
};

function depois(fn: () => Promise<unknown>) {
  try {
    getCloudflareContext().ctx.waitUntil(fn().catch((err) => console.error("depois", err)));
  } catch {
    void fn().catch((err) => console.error("depois", err));
  }
}

/**
 * Devolve ao site as crianças de pagamentos online que não foram concluídos a tempo. Não existe
 * relógio rodando no servidor: isto é chamado antes de mostrar ou reservar crianças, e o resultado
 * é o mesmo.
 */
export async function liberarExpiradas() {
  const db = getDb();
  const vencidos = await db
    .select({ id: pedidos.id, asaasPaymentId: pedidos.asaasPaymentId })
    .from(pedidos)
    .where(and(eq(pedidos.status, "pendente"), lt(pedidos.reservadoAte, new Date())));
  if (!vencidos.length) return;

  const ids = vencidos.map((v) => v.id);
  await db.batch([
    db
      .update(pedidos)
      .set({ status: "expirado" })
      .where(and(inArray(pedidos.id, ids), eq(pedidos.status, "pendente"))),
    db
      .update(participacoes)
      .set({ ...LIBERADA, atualizadoEm: new Date() })
      .where(and(inArray(participacoes.pedidoId, ids), eq(participacoes.status, "reservada"))),
  ]);

  // Apaga a cobrança para ninguém pagar por uma criança que já voltou para a lista. Se o pagamento
  // chegar mesmo assim, confirmarPagamento tenta reservar de novo e avisa a equipe se não der.
  for (const v of vencidos) {
    if (v.asaasPaymentId && !v.asaasPaymentId.startsWith("demo_")) depois(() => deletePayment(v.asaasPaymentId!));
    depois(() => auditar("sistema", "reserva expirou", "pedido", v.id));
  }
}

/** Reserva todas as crianças do pedido ou nenhuma. Devolve as que outra pessoa pegou antes. */
export async function reservar(p: { campanhaId: number; criancaIds: number[]; pedidoId: number; padrinhoNome: string; padrinhoContato: string }) {
  const db = getDb();
  const pegas = await db
    .update(participacoes)
    .set({
      status: "reservada",
      pedidoId: p.pedidoId,
      padrinhoNome: p.padrinhoNome,
      padrinhoContato: p.padrinhoContato,
      canal: "site",
      atualizadoEm: new Date(),
    })
    .where(and(eq(participacoes.campanhaId, p.campanhaId), inArray(participacoes.criancaId, p.criancaIds), eq(participacoes.status, "disponivel")))
    .returning({ criancaId: participacoes.criancaId });

  if (pegas.length === p.criancaIds.length) return { ok: true as const };

  await db
    .update(participacoes)
    .set({ ...LIBERADA, atualizadoEm: new Date() })
    .where(eq(participacoes.pedidoId, p.pedidoId));
  const ok = new Set(pegas.map((r) => r.criancaId));
  return { ok: false as const, indisponiveis: p.criancaIds.filter((id) => !ok.has(id)) };
}

/**
 * Pagamento confirmado pelo Asaas. As crianças reservadas viram apadrinhadas. Se a reserva já tinha
 * vencido (Pix pago depois dos 30 minutos), tenta pegar de novo as que ainda estão livres; as que
 * foram para outro padrinho viram pendência no painel, porque alguém precisa conversar com o doador.
 */
export async function confirmarPagamento(pedidoId: number, autor: string) {
  const db = getDb();
  const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, pedidoId)).limit(1);
  if (!pedido || pedido.status === "pago" || pedido.status === "entregue") return;

  const hoje = todayIso();
  await db
    .update(participacoes)
    .set({ status: "apadrinhada", dataApadrinhamento: hoje, canal: "site", atualizadoEm: new Date() })
    .where(and(eq(participacoes.pedidoId, pedido.id), eq(participacoes.status, "reservada")));

  const itens = (await db.select({ criancaId: pedidoItens.criancaId }).from(pedidoItens).where(eq(pedidoItens.pedidoId, pedido.id))).map((i) => i.criancaId);
  const ligadas = (await db.select({ criancaId: participacoes.criancaId }).from(participacoes).where(eq(participacoes.pedidoId, pedido.id))).map((i) => i.criancaId);
  const faltando = itens.filter((id) => !ligadas.includes(id));

  let pendencia = pedido.pendencia;
  if (faltando.length) {
    const [padrinho] = await db.select().from(padrinhos).where(eq(padrinhos.id, pedido.padrinhoId)).limit(1);
    const pegas = await db
      .update(participacoes)
      .set({
        status: "apadrinhada",
        pedidoId: pedido.id,
        padrinhoNome: padrinho?.nome ?? null,
        padrinhoContato: padrinho?.email ?? padrinho?.telefone ?? null,
        canal: "site",
        dataApadrinhamento: hoje,
        atualizadoEm: new Date(),
      })
      .where(and(eq(participacoes.campanhaId, pedido.campanhaId), inArray(participacoes.criancaId, faltando), eq(participacoes.status, "disponivel")))
      .returning({ criancaId: participacoes.criancaId });
    const perdidas = faltando.filter((id) => !pegas.some((p) => p.criancaId === id));
    if (perdidas.length) {
      const nomes = (await db.select({ nome: criancas.nome }).from(criancas).where(inArray(criancas.id, perdidas))).map((c) => c.nome);
      const aviso = `O pagamento chegou depois que a reserva venceu e ${perdidas.length === 1 ? "esta criança já tinha" : "estas crianças já tinham"} outro padrinho: ${nomes.join(", ")}. Combine com o doador a troca por outra criança ou o estorno.`;
      pendencia = pendencia ? `${pendencia}\n${aviso}` : aviso;
    }
  }

  await db.update(pedidos).set({ status: "pago", pagoEm: new Date(), pendencia }).where(eq(pedidos.id, pedido.id));
  await auditar(autor, "pagamento confirmado", "pedido", pedido.id);
  enviarDepois(pedido.id, "agradecimento");
}

/** Cancela o pedido e devolve ao site as crianças que ainda estavam só reservadas por ele. */
export async function cancelarPedido(pedidoId: number, autor: string, status: "cancelado" | "expirado" = "cancelado") {
  const db = getDb();
  await db.batch([
    db
      .update(pedidos)
      .set({ status })
      .where(and(eq(pedidos.id, pedidoId), notInArray(pedidos.status, ["entregue"]))),
    db
      .update(participacoes)
      .set({ ...LIBERADA, atualizadoEm: new Date() })
      .where(and(eq(participacoes.pedidoId, pedidoId), eq(participacoes.status, "reservada"))),
  ]);
  await auditar(autor, status === "cancelado" ? "pedido cancelado" : "reserva expirou", "pedido", pedidoId);
}

/** A sacolinha chegou (no balcão, ou a equipe entregou a que montou com o pagamento online). */
export async function marcarEntregue(pedidoId: number, autor: string) {
  const db = getDb();
  const hoje = todayIso();
  await db.batch([
    db.update(pedidos).set({ status: "entregue", entregueEm: new Date() }).where(eq(pedidos.id, pedidoId)),
    db
      .update(participacoes)
      // Quem entregou no balcão nunca passou por "apadrinhada": a data do apadrinhamento vira a da entrega.
      .set({ status: "entregue", dataEntrega: hoje, dataApadrinhamento: sql`coalesce(${participacoes.dataApadrinhamento}, ${hoje})`, atualizadoEm: new Date() })
      .where(and(eq(participacoes.pedidoId, pedidoId), inArray(participacoes.status, ["reservada", "apadrinhada"]))),
  ]);
  await auditar(autor, "sacolinha entregue", "pedido", pedidoId);
  enviarDepois(pedidoId, "entregue");
}

export { LIBERADA };
