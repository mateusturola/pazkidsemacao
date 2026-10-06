// Ponto de entrada do Worker: o handler do OpenNext (site e painel) mais o cron diário (lembretes
// por e-mail e posts do Instagram). O cron chama a própria rota /api/cron, então a regra fica num lugar só.

// @ts-ignore gerado no build (opennextjs-cloudflare build); antes dele o arquivo não existe
import handler from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,
  async scheduled(_controller: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
    const segredo = (env as unknown as Record<string, string>).CRON_SECRET;
    if (!segredo) return console.warn("cron: CRON_SECRET ausente; rotina diária não rodou");
    const req = new Request(`${env.SITE_URL}/api/cron`, { method: "POST", headers: { "x-cron-secret": segredo } });
    const res = await handler.fetch(req, env, ctx);
    console.log("cron diário", res.status, await res.text());
  },
};

// @ts-ignore gerado no build
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
