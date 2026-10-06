import { env } from "@/lib/env";
import { atualizarInstagram } from "@/lib/instagram";
import { enviarLembretes } from "@/lib/lembretes";

// Rotina diária, chamada pelo cron do Worker (worker.ts). O segredo impede que alguém de fora
// dispare; rodar de novo não repete e-mail (um de cada tipo por pedido).
export async function POST(req: Request) {
  const segredo = env("CRON_SECRET");
  if (!segredo || req.headers.get("x-cron-secret") !== segredo) return new Response("Não autorizado.", { status: 401 });
  const [lembretes, instagram] = await Promise.all([
    enviarLembretes(),
    atualizarInstagram().catch((err) => ({ ok: false, motivo: String(err) })),
  ]);
  return Response.json({ lembretes, instagram });
}
