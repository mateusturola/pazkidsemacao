"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { modoPagamento } from "@/lib/pagamento";
import { confirmarPagamento } from "@/lib/reservas";

/**
 * Só existe no modo demonstração: faz o papel do webhook do Asaas e confirma o pedido. Em modo
 * "asaas" não faz nada, então não há como confirmar um pagamento de verdade por aqui.
 */
export async function simularPagamento(token: string) {
  if (modoPagamento() !== "demo") throw new Error("Indisponível.");
  const [p] = await getDb().select().from(schema.pedidos).where(eq(schema.pedidos.token, token)).limit(1);
  if (p && (p.status === "pendente" || p.status === "expirado") && p.asaasPaymentId?.startsWith("demo_")) {
    await confirmarPagamento(p.id, "demonstração");
  }
  redirect(`/pedido/${token}`);
}
