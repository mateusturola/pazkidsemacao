// Depois de um deploy, avisa o Bing (IndexNow) de todas as páginas do sitemap: mudança de código não
// passa pelo painel, que é quem avisa no dia a dia. Uso: npm run indexnow
import { readFileSync } from "node:fs";

const SITE = "https://pazkidsemacao.com";
const chave = readFileSync(new URL("../src/lib/indexnow.ts", import.meta.url), "utf8").match(/INDEXNOW_CHAVE = "([0-9a-f]+)"/)[1];
const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: chave, keyLocation: `${SITE}/${chave}.txt`, urlList }),
});
console.log(`IndexNow: ${r.status} ${r.statusText} · ${urlList.length} página(s)`);
if (!r.ok) process.exit(1);
