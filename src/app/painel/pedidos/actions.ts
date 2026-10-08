"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auditar } from "@/lib/auditoria";
import { requireUsuario } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { cancelarPedido, confirmarPagamento, marcarEntregue } from "@/lib/reservas";

async function revalidar(pedidoId: number) {
  const [p] = await getDb().select({ campanhaId: schema.pedidos.campanhaId }).from(schema.pedidos).where(eq(schema.pedidos.id, pedidoId)).limit(1);
  revalidatePath(`/painel/pedidos/${pedidoId}`);
  revalidatePath("/painel/pedidos");
  revalidatePath("/painel");
  if (p) revalidatePath(`/painel/campanhas/${p.campanhaId}`);
  revalidatePath("/", "layout");
}

export async function entregue(pedidoId: number) {
  const u = await requireUsuario();
  await marcarEntregue(pedidoId, u.email);
  await revalidar(pedidoId);
}

/** Libera as crianças ainda reservadas (prazo do balcão vencido, desistência). */
export async function cancelar(pedidoId: number) {
  const u = await requireUsuario();
  await cancelarPedido(pedidoId, u.email);
  await revalidar(pedidoId);
}

/** Pagamento que chegou por fora do Asaas (Pix direto na chave do projeto, dinheiro). */
export async function pagamentoManual(pedidoId: number) {
  const u = await requireUsuario();
  await confirmarPagamento(pedidoId, u.email);
  await revalidar(pedidoId);
}

export async function salvarObservacoes(pedidoId: number, _: string | null, form: FormData) {
  const u = await requireUsuario();
  const obs = String(form.get("observacoes") ?? "").trim() || null;
  const resolvida = form.get("resolvida") === "1";
  await getDb()
    .update(schema.pedidos)
    .set({ observacoes: obs, ...(resolvida ? { pendencia: null } : {}) })
    .where(eq(schema.pedidos.id, pedidoId));
  await auditar(u.email, resolvida ? "resolveu pendência" : "editou observações", "pedido", pedidoId);
  await revalidar(pedidoId);
  return "Salvo.";
}

/** Tira o nome do mural (nome impróprio, ou o padrinho pediu) ou põe, quando o padrinho pediu por outro canal. */
export async function alternarNomeNoMural(pedidoId: number) {
  const u = await requireUsuario();
  const db = getDb();
  const [p] = await db.select({ exibirNome: schema.pedidos.exibirNome }).from(schema.pedidos).where(eq(schema.pedidos.id, pedidoId)).limit(1);
  if (!p) return;
  await db.update(schema.pedidos).set({ exibirNome: !p.exibirNome }).where(eq(schema.pedidos.id, pedidoId));
  await auditar(u.email, p.exibirNome ? "tirou o nome do mural" : "pôs o nome no mural", "pedido", pedidoId);
  await revalidar(pedidoId);
}
