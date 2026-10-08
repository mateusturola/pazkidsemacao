import "server-only";
import { and, eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SITE } from "@/content/site";
import type { TIPOS_EMAIL } from "@/db/schema";
import { idadeTexto, natalDas, nomePublico } from "@/lib/criancas";
import { formatIsoDate } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { formatBRL } from "@/lib/money";

type Tipo = (typeof TIPOS_EMAIL)[number];

const { pedidos, padrinhos, campanhas, pedidoItens, criancas, pontosColeta, emailsEnviados } = schema;

// Cores do manual da campanha. E-mail não carrega fonte nem SVG de forma confiável: o logo vai em
// PNG e o texto em fonte do sistema, com a hierarquia da marca.
export const VERDE = "#1E4B36";
const CREME = "#F4EFE3";
const AMARELO = "#F5B629";
const VERMELHO = "#D64A2B";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Sem RESEND_API_KEY, o e-mail é montado e guardado como "demo": a equipe vê no painel, ninguém recebe. */
export function emailConfigurado() {
  return Boolean(env("RESEND_API_KEY") && env("EMAIL_REMETENTE"));
}

/** Dispara depois da resposta: provedor lento não pode travar a finalização nem o webhook. */
export function enviarDepois(pedidoId: number, tipo: Tipo) {
  const job = enviarEmailPedido(pedidoId, tipo).catch((err) => console.error("email", pedidoId, tipo, err));
  try {
    getCloudflareContext().ctx.waitUntil(job);
  } catch {
    // Fora do Worker não há waitUntil; a promessa segue sozinha.
  }
}

export async function enviarEmailPedido(pedidoId: number, tipo: Tipo) {
  const db = getDb();
  const [linha] = await db
    .select({ p: pedidos, padrinho: padrinhos, campanha: campanhas, ponto: pontosColeta })
    .from(pedidos)
    .innerJoin(padrinhos, eq(padrinhos.id, pedidos.padrinhoId))
    .innerJoin(campanhas, eq(campanhas.id, pedidos.campanhaId))
    .leftJoin(pontosColeta, eq(pontosColeta.id, pedidos.pontoColetaId))
    .where(eq(pedidos.id, pedidoId))
    .limit(1);
  if (!linha?.padrinho.email) return;

  // Um de cada tipo por pedido: o cron pode rodar duas vezes no mesmo dia sem repetir lembrete.
  const [ja] = await db
    .select({ id: emailsEnviados.id })
    .from(emailsEnviados)
    .where(and(eq(emailsEnviados.pedidoId, pedidoId), eq(emailsEnviados.tipo, tipo)))
    .limit(1);
  if (ja) return;

  const itens = await db
    .select({
      nome: criancas.nome,
      apelidoPublico: criancas.apelidoPublico,
      dataNascimento: criancas.dataNascimento,
      sexo: criancas.sexo,
      sonho: criancas.sonho,
      tamanhoCamiseta: criancas.tamanhoCamiseta,
      tamanhoCalca: criancas.tamanhoCalca,
      tamanhoCalcado: criancas.tamanhoCalcado,
      sugestaoPresente: criancas.sugestaoPresente,
    })
    .from(pedidoItens)
    .innerJoin(criancas, eq(criancas.id, pedidoItens.criancaId))
    .where(eq(pedidoItens.pedidoId, pedidoId));

  const { assunto, html } = montar(tipo, { ...linha, itens });
  const [registro] = await db
    .insert(emailsEnviados)
    .values({ pedidoId, tipo, para: linha.padrinho.email, assunto, html, status: "demo" })
    .onConflictDoNothing()
    .returning({ id: emailsEnviados.id });
  if (!registro || !emailConfigurado()) return;

  try {
    // Quem responde o e-mail cai na caixa do projeto (a mesma da chave Pix), em vez de voltar
    // com erro. O contato divulgado continua sendo o WhatsApp.
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env("RESEND_API_KEY")}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env("EMAIL_REMETENTE"), to: [linha.padrinho.email], reply_to: SITE.pix.chave, subject: assunto, html }),
    });
    if (!res.ok) throw new Error(`Resend respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
    await db.update(emailsEnviados).set({ status: "enviado" }).where(eq(emailsEnviados.id, registro.id));
  } catch (err) {
    await db
      .update(emailsEnviados)
      .set({ status: "erro", erro: err instanceof Error ? err.message : String(err) })
      .where(eq(emailsEnviados.id, registro.id));
  }
}

type Dados = {
  p: typeof pedidos.$inferSelect;
  padrinho: typeof padrinhos.$inferSelect;
  campanha: typeof campanhas.$inferSelect;
  ponto: typeof pontosColeta.$inferSelect | null;
  itens: {
    nome: string;
    apelidoPublico: string | null;
    dataNascimento: string | null;
    sexo: "F" | "M" | null;
    sonho: string | null;
    tamanhoCamiseta: string | null;
    tamanhoCalca: string | null;
    tamanhoCalcado: string | null;
    sugestaoPresente: string | null;
  }[];
};

function montar(tipo: Tipo, d: Dados) {
  const site = env("SITE_URL") || SITE.url;
  const primeiro = esc(d.padrinho.nome.split(" ")[0]);
  const link = `${site}/pedido/${d.p.token}`;
  const prazo = d.p.prazoEntrega ? formatIsoDate(d.p.prazoEntrega) : "";
  const n = d.itens.length;
  const nomes = d.itens.map((c) => esc(nomePublico(c)));
  const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}` : (nomes[0] ?? "");
  const balcao = d.p.modalidade === "entrega_balcao";
  const natal = esc(natalDas(d.itens));

  let assunto: string;
  let frase: string;
  let corpo: string;
  let botao = "Ver meu apadrinhamento";

  if (tipo === "agradecimento") {
    if (balcao) {
      assunto = `Obrigado por apadrinhar ${n > 1 ? `${n} crianças` : "uma criança"}, ${d.padrinho.nome.split(" ")[0]}!`;
      frase = "Mais que presentes, é esperança.";
      corpo = `<p>Oi, ${primeiro}! ${n > 1 ? `${lista} já estão reservados` : `${lista} já está reservada`} para você. Agora é com você: monte a sacolinha com carinho e entregue até <strong>${prazo}</strong>.</p>
<p style="margin:16px 0 0;font-size:18px;color:${VERDE};font-weight:700">Você vai transformar ${natal}.</p>
${blocoEntrega(d, prazo)}
${blocoCriancas(d)}
<p style="margin:20px 0 0">Na sacola, escreva o nome da criança e o número do pedido: <strong>${d.p.id}</strong>.</p>`;
      botao = "Ver tamanhos e local de entrega";
    } else {
      assunto = `Pagamento confirmado. Obrigado, ${d.padrinho.nome.split(" ")[0]}!`;
      frase = "O Natal também é sobre compartilhar.";
      corpo = `<p>Oi, ${primeiro}! Recebemos o seu pagamento de <strong>${formatBRL(d.p.valor)}</strong>. Agora é com a gente: vamos montar ${n > 1 ? "as sacolinhas" : "a sacolinha"} de <strong>${lista}</strong> e entregar no Natal.</p>
<p style="margin:16px 0 0;font-size:18px;color:${VERDE};font-weight:700">Você transformou ${natal}.</p>
${blocoCriancas(d)}
<p style="margin:20px 0 0">A gente manda notícias quando ${n > 1 ? "elas forem entregues" : "ela for entregue"}.</p>`;
    }
  } else if (tipo === "lembrete" || tipo === "lembrete_final") {
    const amanha = tipo === "lembrete_final";
    assunto = amanha ? `Amanhã é o último dia para entregar a sacolinha` : `Faltam poucos dias para entregar a sacolinha`;
    frase = amanha ? "Falta pouco!" : "Apadrinhe uma criança!";
    corpo = `<p>Oi, ${primeiro}! Passando para lembrar: ${n > 1 ? `as sacolinhas de ${lista} precisam` : `a sacolinha de ${lista} precisa`} chegar até <strong>${prazo}</strong>${amanha ? ", amanhã" : ""}.</p>
${blocoEntrega(d, prazo)}
${blocoCriancas(d)}
<p style="margin:20px 0 0">Se aconteceu algum imprevisto, chame a gente no WhatsApp <a href="${SITE.whatsapp.link}" style="color:${VERDE}">${SITE.whatsapp.numero}</a>: a gente conversa.</p>`;
    botao = "Ver tamanhos e local de entrega";
  } else {
    assunto = `Sua sacolinha chegou. Obrigado, ${d.padrinho.nome.split(" ")[0]}!`;
    frase = "Juntos fazemos a diferença.";
    corpo = `<p>Oi, ${primeiro}! ${balcao ? `Recebemos ${n > 1 ? "as sacolinhas" : "a sacolinha"} de <strong>${lista}</strong>.` : `${n > 1 ? "As sacolinhas" : "A sacolinha"} de <strong>${lista}</strong> ${n > 1 ? "foram entregues" : "foi entregue"}.`} Neste Natal, ${n > 1 ? "elas vão abrir um presente escolhido" : "vai ter um presente escolhido"} por alguém que se importou.</p>
<p style="margin:16px 0 0">Obrigado por fazer parte da ${esc(d.campanha.nome)}.</p>`;
  }

  return { assunto, html: layout(assunto, frase, corpo, botao, link) };
}

function blocoEntrega(d: Dados, prazo: string) {
  if (!d.ponto) return "";
  return `<table role="presentation" width="100%" style="margin:20px 0;background:${CREME};border-radius:12px"><tr><td style="padding:18px 20px">
<p style="margin:0 0 4px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${VERDE};font-weight:800">Onde e até quando</p>
<p style="margin:0;font-size:17px;font-weight:700;color:${VERDE}">${esc(d.ponto.nome)}</p>
${d.ponto.endereco ? `<p style="margin:4px 0 0">${esc(d.ponto.endereco)}</p>` : ""}
${d.ponto.horarios ? `<p style="margin:4px 0 0">${esc(d.ponto.horarios)}</p>` : ""}
<p style="margin:8px 0 0">Até <strong>${prazo}</strong></p>
</td></tr></table>`;
}

function blocoCriancas(d: Dados) {
  return d.itens
    .map(
      (c) => `<table role="presentation" width="100%" style="margin:12px 0;border:1px solid #e6dfcf;border-radius:12px"><tr><td style="padding:14px 18px">
<p style="margin:0;font-size:17px;font-weight:700;color:${VERDE}">${esc(nomePublico(c))}${c.dataNascimento ? `, ${idadeTexto(c.dataNascimento)}` : ""}</p>
<p style="margin:6px 0 0">Camiseta <strong>${esc(c.tamanhoCamiseta || "—")}</strong> · Calça <strong>${esc(c.tamanhoCalca || "—")}</strong> · Calçado <strong>${esc(c.tamanhoCalcado || "—")}</strong></p>
${c.sugestaoPresente ? `<p style="margin:6px 0 0">Sugestão de presente: ${esc(c.sugestaoPresente)}</p>` : ""}
</td></tr></table>`,
    )
    .join("");
}

/** O molde de todos os e-mails. `rodape` entra embaixo do contato (o convite põe ali o link de descadastro). */
export function layout(titulo: string, frase: string, corpo: string, botao: string, link: string, rodape = "") {
  const site = env("SITE_URL") || SITE.url;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title></head>
<body style="margin:0;background:${CREME};font-family:Nunito,'Segoe UI',Helvetica,Arial,sans-serif;color:#23302a;font-size:16px;line-height:1.55">
<table role="presentation" width="100%" style="background:${CREME}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="background:${VERDE};padding:26px 28px" align="left">
<img src="${site}/natal/email-logo.png" width="190" alt="Paz Kids em Ação · Campanha de Natal" style="display:block;border:0;width:190px;height:auto">
</td></tr>
<tr><td style="height:6px;background:${AMARELO};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:28px 28px 8px">
<p style="margin:0 0 6px;font-family:'Caveat Brush',cursive;font-size:22px;color:${VERMELHO}">${esc(frase)}</p>
<h1 style="margin:0 0 18px;font-family:Fredoka,'Trebuchet MS',sans-serif;font-size:26px;line-height:1.15;color:${VERDE}">${esc(titulo)}</h1>
${corpo}
<p style="margin:26px 0 8px"><a href="${link}" style="display:inline-block;background:${VERMELHO};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">${esc(botao)}</a></p>
</td></tr>
<tr><td style="padding:22px 28px 28px;color:#5b6b62;font-size:13px">
${esc(SITE.nome)} · ${esc(SITE.igreja)}<br>
Dúvidas? Fale com a gente no WhatsApp <a href="${SITE.whatsapp.link}" style="color:${VERDE}">${SITE.whatsapp.numero}</a>.${rodape}
</td></tr>
</table></td></tr></table></body></html>`;
}
