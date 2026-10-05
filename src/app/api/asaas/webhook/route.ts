import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { AsaasPayment } from "@/lib/asaas";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { cancelarPedido, confirmarPagamento } from "@/lib/reservas";

// O Asaas pausa a fila do webhook depois de algumas respostas de erro seguidas, e aí nenhum
// pagamento novo chega até alguém reativar. Por isso só o token inválido responde erro: evento
// desconhecido ou de cobrança que não é de pedido recebe 200 e é ignorado.

function mesmoToken(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: Request) {
  if (!mesmoToken(req.headers.get("asaas-access-token") ?? "", env("ASAAS_WEBHOOK_TOKEN"))) {
    return new Response("Token inválido.", { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { event?: string; payment?: AsaasPayment } | null;
  const pay = body?.payment;
  // Parcelas do cartão são cobranças diferentes, mas todas carregam o mesmo externalReference.
  const pedidoId = Number(pay?.externalReference?.match(/^pedido:(\d+)$/)?.[1]);
  if (!body?.event?.startsWith("PAYMENT_") || !pedidoId) return Response.json({ ok: true, ignorado: true });

  const db = getDb();
  const [pedido] = await db.select().from(schema.pedidos).where(eq(schema.pedidos.id, pedidoId)).limit(1);
  if (!pedido) return Response.json({ ok: true, ignorado: true });

  const evento = body.event;
  if (evento === "PAYMENT_CONFIRMED" || evento === "PAYMENT_RECEIVED") await confirmarPagamento(pedido.id, "asaas");
  if ((evento === "PAYMENT_DELETED" || evento === "PAYMENT_OVERDUE") && pedido.status === "pendente") {
    await cancelarPedido(pedido.id, "asaas", "expirado");
  }
  if ((evento === "PAYMENT_REFUNDED" || evento === "PAYMENT_CHARGEBACK_REQUESTED") && (pedido.status === "pago" || pedido.status === "entregue")) {
    const aviso = evento === "PAYMENT_REFUNDED" ? "O pagamento foi estornado no Asaas." : "O doador contestou o pagamento do cartão.";
    await db
      .update(schema.pedidos)
      .set({ pendencia: pedido.pendencia ? `${pedido.pendencia}\n${aviso}` : aviso })
      .where(eq(schema.pedidos.id, pedido.id));
  }

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
