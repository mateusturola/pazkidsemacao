import "server-only";
import type { BatchItem } from "drizzle-orm/batch";
import { and, eq, inArray, isNull, notInArray, sql } from "drizzle-orm";
import { SITE } from "@/content/site";
import { fraseSonho, nomePublico } from "@/lib/criancas";
import { getDb, schema } from "@/lib/db";
import { emailConfigurado, esc, layout, VERDE } from "@/lib/email";
import { env } from "@/lib/env";
import { novoToken } from "@/lib/token";

const { convitesEnviados, criancas, inscricoesNovidades, padrinhos, pedidoItens, pedidos } = schema;

// Quem de fato apadrinhou: pedido pendente, cancelado ou expirado não conta.
const APADRINHOU = ["pago", "aguardando_entrega", "entregue"] as const;

// O D1 aceita no máximo 100 parâmetros por consulta.
const pedacos = <T>(v: T[], n: number) => Array.from({ length: Math.ceil(v.length / n) }, (_, i) => v.slice(i * n, i * n + n));
const lote = (passos: BatchItem<"sqlite">[]) => getDb().batch(passos as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);

/** Marcou no finalizar que quer receber as próximas campanhas. Quem já tinha saído e marcou de novo, volta. */
export async function inscrever(nome: string, email: string) {
  await getDb()
    .insert(inscricoesNovidades)
    .values({ email, nome, token: novoToken() })
    .onConflictDoUpdate({ target: inscricoesNovidades.email, set: { nome, aceitouEm: new Date(), descadastradoEm: null } });
}

/** "Não quero mais receber". Devolve false se o link não existe. */
export async function descadastrar(token: string) {
  const db = getDb();
  const [i] = await db.select().from(inscricoesNovidades).where(eq(inscricoesNovidades.token, token)).limit(1);
  if (!i) return false;
  if (!i.descadastradoEm) await db.update(inscricoesNovidades).set({ descadastradoEm: new Date() }).where(eq(inscricoesNovidades.token, token));
  return true;
}

type Crianca = { nome: string; apelidoPublico: string | null; sexo: "F" | "M" | null; sonho: string | null };
export type Destinatario = { email: string; nome: string; token: string; criancas: Crianca[] };
type Campanha = typeof schema.campanhas.$inferSelect;

/**
 * Quem apadrinhou na campanha de origem, pediu para receber novidades e ainda não recebeu o convite
 * da campanha de destino. Cada pessoa vem uma vez, com todas as crianças que apadrinhou.
 */
export async function destinatarios(origemId: number, destinoId: number) {
  const db = getDb();
  const linhas = await db
    .select({
      email: padrinhos.email,
      nome: padrinhos.nome,
      token: inscricoesNovidades.token,
      crianca: { nome: criancas.nome, apelidoPublico: criancas.apelidoPublico, sexo: criancas.sexo, sonho: criancas.sonho },
    })
    .from(pedidos)
    .innerJoin(padrinhos, eq(padrinhos.id, pedidos.padrinhoId))
    .innerJoin(inscricoesNovidades, eq(inscricoesNovidades.email, padrinhos.email))
    .innerJoin(pedidoItens, eq(pedidoItens.pedidoId, pedidos.id))
    .innerJoin(criancas, eq(criancas.id, pedidoItens.criancaId))
    .where(
      and(
        eq(pedidos.campanhaId, origemId),
        inArray(pedidos.status, [...APADRINHOU]),
        isNull(inscricoesNovidades.descadastradoEm),
        notInArray(padrinhos.email, db.select({ para: convitesEnviados.para }).from(convitesEnviados).where(eq(convitesEnviados.campanhaId, destinoId))),
      ),
    );
  const porEmail = new Map<string, Destinatario>();
  for (const l of linhas) {
    if (!l.email) continue;
    const d = porEmail.get(l.email) ?? { email: l.email, nome: l.nome, token: l.token, criancas: [] };
    if (!d.criancas.some((c) => c.nome === l.crianca.nome)) d.criancas.push(l.crianca);
    porEmail.set(l.email, d);
  }
  return [...porEmail.values()];
}

/** Para a tela: quantos apadrinharam na campanha de origem e quantos deles aceitaram receber. */
export async function resumoOrigem(origemId: number) {
  const [r] = await getDb()
    .select({
      padrinhos: sql<number>`count(distinct ${padrinhos.email})`,
      inscritos: sql<number>`count(distinct case when ${inscricoesNovidades.descadastradoEm} is null then ${inscricoesNovidades.email} end)`,
    })
    .from(pedidos)
    .innerJoin(padrinhos, eq(padrinhos.id, pedidos.padrinhoId))
    .leftJoin(inscricoesNovidades, eq(inscricoesNovidades.email, padrinhos.email))
    .where(and(eq(pedidos.campanhaId, origemId), inArray(pedidos.status, [...APADRINHOU])));
  return { padrinhos: Number(r?.padrinhos ?? 0), inscritos: Number(r?.inscritos ?? 0) };
}

/** "a Maria, que sonha em ser professora, e o João": o padrinho lembra de quem ele cuidou. */
function quemApadrinhou(lista: Crianca[]) {
  const partes = lista.map((c) => {
    const artigo = c.sexo === "F" ? "a " : c.sexo === "M" ? "o " : "";
    const sonho = fraseSonho(c.sonho);
    return `${artigo}${nomePublico(c)}${sonho ? `, que ${sonho}` : ""}`;
  });
  if (partes.length <= 1) return partes[0] ?? "";
  const sep = partes.some((p) => p.includes(",")) ? "; " : ", ";
  return `${partes.slice(0, -1).join(sep)}${sep === "; " ? ";" : ""} e ${partes.at(-1)}`;
}

export function textoPadrao(destino: Campanha) {
  return {
    assunto: `${destino.nome}: tem criança esperando por você`,
    mensagem: `A ${destino.nome} já começou, e tem criança esperando por um padrinho.\n\nQue tal fazer parte de novo? Você escolhe a criança no site e a gente cuida do resto junto com você.`,
  };
}

export function montarConvite(d: Destinatario, origem: Campanha, destino: Campanha, assunto: string, mensagem: string) {
  const site = env("SITE_URL") || SITE.url;
  const primeiro = esc(d.nome.split(" ")[0]);
  const paragrafos = mensagem
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:16px 0 0">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const corpo = `<p>Oi, ${primeiro}!</p>
<p style="margin:16px 0 0;font-size:18px;color:${VERDE};font-weight:700">Na ${esc(origem.nome)}, você apadrinhou ${esc(quemApadrinhou(d.criancas))}. Obrigado por isso!</p>
${paragrafos}`;
  const link = `${site}/${destino.slug}?utm_source=email&utm_medium=convite&utm_campaign=${encodeURIComponent(destino.slug)}`;
  const t = encodeURIComponent(d.token);
  const sair = `${site}/novidades/sair?t=${t}`;
  const rodape = `<br><br>Você recebe este e-mail porque pediu, ao apadrinhar, para receber as próximas campanhas do ${esc(SITE.nome)}. <a href="${sair}" style="color:${VERDE}">Não quero mais receber</a>.`;
  return {
    assunto,
    html: layout(assunto, "Mais que presentes, é esperança.", corpo, "Conhecer as crianças", link, rodape),
    // O descadastro em um clique do Gmail chega por POST, sem passar pela página.
    umClique: `${site}/api/novidades/sair?t=${t}`,
  };
}

/**
 * Manda o convite para até `limite` pessoas por vez (o Worker tem tempo contado). A linha entra
 * antes do envio: se duas pessoas da equipe clicarem juntas, o índice único deixa só uma mandar.
 */
export async function enviarConvites(origem: Campanha, destino: Campanha, assunto: string, mensagem: string, autor: string, limite = 300) {
  const db = getDb();
  const todos = await destinatarios(origem.id, destino.id);
  const agoraVai = todos.slice(0, limite);
  const montados = agoraVai.map((d) => ({ d, ...montarConvite(d, origem, destino, assunto, mensagem) }));

  // Cada linha usa 7 parâmetros: 10 por insert ficam abaixo do limite do D1.
  const inseridos = new Set<string>();
  for (const grupo of pedacos(montados, 50)) {
    const res = await lote(
      pedacos(grupo, 10).map((g) =>
        db
          .insert(convitesEnviados)
          .values(g.map((m) => ({ campanhaId: destino.id, campanhaOrigemId: origem.id, para: m.d.email, assunto, html: m.html, status: "demo" as const, enviadoPor: autor })))
          .onConflictDoNothing()
          .returning({ para: convitesEnviados.para }),
      ),
    );
    for (const linhas of res as { para: string }[][]) for (const l of linhas) inseridos.add(l.para);
  }
  const aEnviar = montados.filter((m) => inseridos.has(m.d.email));

  let enviados = 0;
  let erros = 0;
  if (emailConfigurado()) {
    // O lote do Resend aceita até 100 e-mails por chamada.
    for (const grupo of pedacos(aEnviar, 100)) {
      let status: "enviado" | "erro" = "enviado";
      let erro: string | null = null;
      try {
        const res = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: { authorization: `Bearer ${env("RESEND_API_KEY")}`, "content-type": "application/json" },
          body: JSON.stringify(
            grupo.map((m) => ({
              from: env("EMAIL_REMETENTE"),
              to: [m.d.email],
              reply_to: SITE.pix.chave,
              subject: m.assunto,
              html: m.html,
              // O Gmail e o Yahoo mostram o "cancelar inscrição" e pedem o descadastro em um clique.
              headers: { "List-Unsubscribe": `<${m.umClique}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
            })),
          ),
        });
        if (!res.ok) throw new Error(`Resend respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
        enviados += grupo.length;
      } catch (err) {
        status = "erro";
        erro = err instanceof Error ? err.message : String(err);
        erros += grupo.length;
      }
      await lote(
        pedacos(grupo, 90).map((g) =>
          db
            .update(convitesEnviados)
            .set({ status, erro })
            .where(and(eq(convitesEnviados.campanhaId, destino.id), inArray(convitesEnviados.para, g.map((m) => m.d.email)))),
        ),
      );
    }
  }
  return { enviados, erros, demo: emailConfigurado() ? 0 : aEnviar.length, restantes: todos.length - agoraVai.length };
}

/** Quantos convites desta campanha já saíram, por situação. */
export async function convitesDaCampanha(destinoId: number) {
  const linhas = await getDb()
    .select({ status: convitesEnviados.status, n: sql<number>`count(*)` })
    .from(convitesEnviados)
    .where(eq(convitesEnviados.campanhaId, destinoId))
    .groupBy(convitesEnviados.status);
  return Object.fromEntries(linhas.map((l) => [l.status, Number(l.n)])) as Partial<Record<"enviado" | "demo" | "erro", number>>;
}
