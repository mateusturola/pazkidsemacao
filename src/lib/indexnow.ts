import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SITE } from "@/content/site";

// IndexNow: avisa o Bing (e, por ele, os outros buscadores do protocolo) que uma página mudou, sem
// esperar o robô passar. O ChatGPT busca no índice do Bing, então a agenda nova chega lá mais rápido.
// A chave não é segredo: o protocolo pede que ela fique publicada em /<chave>.txt (em public/).
export const INDEXNOW_CHAVE = "8980930b1cdbc9ba6b2e8772996cb93b";

/** Avisa que essas páginas mudaram. Roda depois da resposta e nunca derruba quem chamou. */
export function avisarBuscadores(caminhos: string[]) {
  // Só o site de verdade: o next dev e os testes não podem mandar endereço de localhost para o Bing.
  if (process.env.NODE_ENV !== "production") return;
  const urlList = [...new Set(caminhos)].map((c) => new URL(c, SITE.url).toString());
  const job = fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE.url).host, key: INDEXNOW_CHAVE, keyLocation: `${SITE.url}/${INDEXNOW_CHAVE}.txt`, urlList }),
  })
    .then((r) => {
      if (!r.ok && r.status !== 202) console.error("indexnow", r.status);
    })
    .catch((err) => console.error("indexnow", err));
  try {
    getCloudflareContext().ctx.waitUntil(job);
  } catch {
    // Fora do Worker não há waitUntil; a promessa segue sozinha.
  }
}
