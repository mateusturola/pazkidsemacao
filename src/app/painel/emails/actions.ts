"use server";

import { revalidatePath } from "next/cache";
import { auditar } from "@/lib/auditoria";
import { requireAdmin } from "@/lib/auth";
import { enviarLembretes } from "@/lib/lembretes";

/** O cron roda todo dia às 9h; isto adianta a rodada (útil para testar e para a demonstração). */
export async function rodarLembretes(): Promise<string | null> {
  const u = await requireAdmin();
  const r = await enviarLembretes();
  await auditar(u.email, "rodou lembretes", "email", null, r);
  revalidatePath("/painel/emails");
  return r.enviados ? `${r.enviados} lembrete(s) gerado(s) agora.` : "Nenhum pedido no prazo de lembrete hoje.";
}
