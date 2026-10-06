import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

// Tudo o que é público fica aberto para buscadores e para os robôs de IA (ChatGPT, Claude,
// Perplexity, Gemini): é assim que o projeto aparece quando alguém pergunta sobre ação social em
// Heliópolis. Ficam de fora só as páginas pessoais (pedido do doador) e as imagens das crianças.
const PRIVADO = ["/pedido/", "/fotos/", "/api/", "/painel", "/*/finalizar"];
const ROBOS_DE_IA = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVADO }, ...ROBOS_DE_IA.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVADO }))],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
