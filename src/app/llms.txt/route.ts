import { PERGUNTAS, SITE, SOBRE } from "@/content/site";
import { campanhasAtivas, itensSacolinha, progressoCampanhas } from "@/lib/campanhas";
import { formatIsoDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { TERMOS } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Resumo em Markdown para assistentes de IA (padrão llms.txt): quem é o projeto, onde atua, como
// ajudar e o que está aberto agora, sem precisar interpretar o HTML.
export async function GET() {
  const ativas = await campanhasAtivas();
  const progresso = await progressoCampanhas(ativas.map((c) => c.id));
  const campanhas = ativas
    .map((c) => {
      const p = progresso.get(c.id);
      const itens = itensSacolinha(c.itensSacolinha);
      return [
        `### ${c.nome}`,
        c.descricao ?? "",
        `- Página: ${SITE.url}/${c.slug}`,
        itens.length ? `- Itens da sacolinha: ${itens.join(", ")}` : "",
        c.valorSacolinha ? `- Doação online por criança: ${formatBRL(c.valorSacolinha)} (Pix ou cartão)` : "",
        c.prazoEntrega ? `- Entrega das sacolinhas até ${formatIsoDate(c.prazoEntrega)}` : "",
        p?.total ? `- ${p.comPadrinho} de ${p.total} crianças já têm padrinho` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  const texto = `# ${SITE.nome}

> ${SITE.descricao}

${SITE.lema}. ${SOBRE.oQueE}

- Site: ${SITE.url}
- Igreja: ${SITE.igreja}
- Contato: ${SITE.email}
- Doação por Pix (${SITE.pix.tipo}): ${SITE.pix.chave}
- Redes: ${SITE.redes.map((r) => `${r.nome} ${r.url}`).join(" · ")}

## Missão
${SOBRE.missao}

## Visão
${SOBRE.visao}

## Valores
${SOBRE.valores.map((v) => `- ${v}`).join("\n")}

## História
${SOBRE.historia.map((h) => `- ${h.quando}: ${h.texto}`).join("\n")}

## Campanhas abertas
${campanhas || "Nenhuma campanha aberta no momento. Acompanhe pelo Instagram."}

## Perguntas frequentes
${PERGUNTAS.map((q) => `### ${q.p}\n${q.r}`).join("\n\n")}

## Assuntos relacionados
${TERMOS.join(", ")}.
`;
  return new Response(texto, { headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
