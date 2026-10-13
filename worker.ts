// Ponto de entrada do Worker: o handler do OpenNext (site e painel) mais o cron diário (lembretes
// por e-mail e posts do Instagram). O cron chama a própria rota /api/cron, então a regra fica num lugar só.

// @ts-ignore gerado no build (opennextjs-cloudflare build); antes dele o arquivo não existe
import handler from "./.open-next/worker.js";

// Páginas do site guardadas prontas por um minuto: o D1 fica longe do Brasil e montar a página leva
// algumas consultas. Uma mudança no painel aparece no site em até um minuto. Só o site (o painel nunca),
// só GET de página de um nível (/, /agenda, /historia, a campanha), só a página inteira (a navegação
// interna do Next pede o RSC, que não entra) e só resposta 200 sem cookie. Nenhuma página pública
// depende de quem está vendo; a reserva não depende disso, porque quem decide é o UPDATE em `reservar`.
const SITE = "pazkidsemacao.com";
const PAGINA = /^\/[a-z0-9-]*$/;
const SEGUNDOS = 60;

async function comCache(req: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(req.url);
  const cacheavel =
    req.method === "GET" && url.hostname === SITE && PAGINA.test(url.pathname) && !req.headers.has("rsc") && !req.headers.has("next-router-prefetch");
  if (!cacheavel) return handler.fetch(req, env, ctx);

  // O tipo do DOM não conhece o caches.default do Workers.
  const cache = (caches as unknown as { default: Cache }).default;
  const chave = new Request(url.toString(), { method: "GET" });
  const guardada = await cache.match(chave);
  if (guardada) {
    const res = new Response(guardada.body, guardada);
    // O navegador não guarda: volta aqui e pega a versão do minuto.
    res.headers.set("cache-control", "private, no-cache, no-store, max-age=0, must-revalidate");
    res.headers.set("x-cache", "HIT");
    return res;
  }

  const res = await handler.fetch(req, env, ctx);
  const html = res.headers.get("content-type")?.includes("text/html");
  if (res.status !== 200 || !html || res.headers.has("set-cookie")) return res;
  const copia = new Response(res.clone().body, res);
  copia.headers.set("cache-control", `public, max-age=${SEGUNDOS}`);
  ctx.waitUntil(cache.put(chave, copia));
  return res;
}

export default {
  fetch: comCache,
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
