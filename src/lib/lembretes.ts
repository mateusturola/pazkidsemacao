import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { todayIso } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { enviarEmailPedido } from "@/lib/email";

const DIA = 86_400_000;

function diasAte(prazo: string, hoje: string) {
  return Math.round((Date.parse(`${prazo}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / DIA);
}

/**
 * Lembretes de quem vai entregar no balcão: um a 3 dias do prazo e outro na véspera. Roda uma vez
 * por dia (cron do Worker); quem perdeu a janela de 3 dias porque apadrinhou depois recebe só o da véspera.
 */
export async function enviarLembretes() {
  const hoje = todayIso();
  const abertos = await getDb()
    .select({ id: schema.pedidos.id, prazo: schema.pedidos.prazoEntrega })
    .from(schema.pedidos)
    .where(and(eq(schema.pedidos.status, "aguardando_entrega"), isNotNull(schema.pedidos.prazoEntrega)));
  let enviados = 0;
  for (const p of abertos) {
    const dias = diasAte(p.prazo!, hoje);
    const tipo = dias === 1 || dias === 0 ? "lembrete_final" : dias >= 2 && dias <= 3 ? "lembrete" : null;
    if (!tipo) continue;
    await enviarEmailPedido(p.id, tipo);
    enviados++;
  }
  return { verificados: abertos.length, enviados };
}
