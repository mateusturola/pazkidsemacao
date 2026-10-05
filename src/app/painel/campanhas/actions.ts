"use server";

import { and, eq, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CANAIS, STATUS_PARTICIPACAO } from "@/db/schema";
import { auditar } from "@/lib/auditoria";
import { requireAdmin, requireUsuario } from "@/lib/auth";
import { SLUGS_RESERVADOS, slugify } from "@/lib/campanhas";
import { getDb, schema } from "@/lib/db";
import { parseBRL } from "@/lib/money";

const { campanhas, participacoes, criancas } = schema;

function texto(form: FormData, nome: string) {
  const v = form.get(nome);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
const dataIso = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function revalidar(id?: number, slug?: string) {
  revalidatePath("/painel/campanhas");
  if (id) revalidatePath(`/painel/campanhas/${id}`);
  revalidatePath("/painel");
  revalidatePath("/");
  if (slug) revalidatePath(`/${slug}`);
}

async function dadosCampanha(form: FormData, id: number | null) {
  const nome = texto(form, "nome");
  if (!nome) return { erro: "Informe o nome da campanha." };
  const slug = slugify(texto(form, "slug") ?? nome);
  if (!slug) return { erro: "Endereço inválido." };
  if (SLUGS_RESERVADOS.has(slug)) return { erro: `O endereço /${slug} é usado pelo site. Escolha outro.` };
  const [outra] = await getDb().select({ id: campanhas.id }).from(campanhas).where(eq(campanhas.slug, slug)).limit(1);
  if (outra && outra.id !== id) return { erro: `Já existe uma campanha em /${slug}.` };
  const status = texto(form, "status");
  const valorTexto = texto(form, "valorSacolinha");
  const valor = valorTexto ? parseBRL(valorTexto) : null;
  if (valorTexto && (valor == null || valor < 500)) return { erro: "Valor da sacolinha inválido (mínimo R$ 5,00, o mínimo de cobrança do Asaas)." };
  const parcelas = Math.min(12, Math.max(1, Number(texto(form, "maxParcelas") ?? 1) || 1));
  return {
    dados: {
      nome,
      slug,
      tipo: texto(form, "tipo") ?? "natal",
      descricao: texto(form, "descricao"),
      dataInicio: dataIso(texto(form, "dataInicio")),
      dataFim: dataIso(texto(form, "dataFim")),
      status: (status === "ativa" || status === "encerrada" ? status : "rascunho") as "rascunho" | "ativa" | "encerrada",
      valorSacolinha: valor,
      maxParcelas: parcelas,
      prazoEntrega: dataIso(texto(form, "prazoEntrega")),
      itensSacolinha: texto(form, "itensSacolinha"),
    },
  };
}

export async function criarCampanha(_: string | null, form: FormData) {
  const u = await requireAdmin();
  const r = await dadosCampanha(form, null);
  if (!r.dados) return r.erro;
  const [nova] = await getDb().insert(campanhas).values(r.dados).returning({ id: campanhas.id });
  await auditar(u.email, "criou", "campanha", nova.id, { nome: r.dados.nome });
  revalidar(nova.id, r.dados.slug);
  redirect(`/campanhas/${nova.id}`);
}

export async function salvarCampanha(id: number, _: string | null, form: FormData) {
  const u = await requireAdmin();
  const r = await dadosCampanha(form, id);
  if (!r.dados) return r.erro;
  const [antes] = await getDb().select().from(campanhas).where(eq(campanhas.id, id)).limit(1);
  if (!antes) return "Campanha não encontrada.";
  await getDb().update(campanhas).set(r.dados).where(eq(campanhas.id, id));
  const mudou = Object.fromEntries(Object.entries(r.dados).filter(([k, v]) => (antes as Record<string, unknown>)[k] !== v));
  if (Object.keys(mudou).length) await auditar(u.email, "editou", "campanha", id, mudou);
  revalidar(id, r.dados.slug);
  if (antes.slug !== r.dados.slug) revalidatePath(`/${antes.slug}`);
  return "Salvo.";
}

export async function adicionarCriancas(campanhaId: number, form: FormData) {
  const u = await requireUsuario();
  const db = getDb();
  let ids = form
    .getAll("crianca")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  if (form.get("todas") === "1") {
    const ja = db.select({ id: participacoes.criancaId }).from(participacoes).where(eq(participacoes.campanhaId, campanhaId));
    ids = (await db.select({ id: criancas.id }).from(criancas).where(and(eq(criancas.ativo, true), notInArray(criancas.id, ja)))).map((c) => c.id);
  }
  if (!ids.length) return;
  let n = 0;
  // Lotes pequenos: o D1 aceita no máximo 100 parâmetros por consulta.
  for (let i = 0; i < ids.length; i += 25) {
    const novas = await db
      .insert(participacoes)
      .values(ids.slice(i, i + 25).map((criancaId) => ({ criancaId, campanhaId })))
      .onConflictDoNothing()
      .returning({ id: participacoes.id });
    n += novas.length;
  }
  await auditar(u.email, "adicionou crianças", "campanha", campanhaId, { quantidade: n });
  revalidar(campanhaId);
}

/** Tira a criança da campanha. Só enquanto ninguém a escolheu: depois disso, o histórico fica. */
export async function removerDaCampanha(participacaoId: number) {
  const u = await requireUsuario();
  const db = getDb();
  const [p] = await db.select().from(participacoes).where(eq(participacoes.id, participacaoId)).limit(1);
  if (!p || p.status !== "disponivel" || p.pedidoId) return;
  await db.delete(participacoes).where(and(eq(participacoes.id, participacaoId), eq(participacoes.status, "disponivel")));
  await auditar(u.email, "tirou da campanha", "participacao", participacaoId, { criancaId: p.criancaId, campanhaId: p.campanhaId });
  revalidar(p.campanhaId);
}

/** Registro feito pela equipe: apadrinhamento por WhatsApp, presencial, na igreja, ou correção manual. */
export async function salvarParticipacao(participacaoId: number, _: string | null, form: FormData) {
  const u = await requireUsuario();
  const db = getDb();
  const [antes] = await db.select().from(participacoes).where(eq(participacoes.id, participacaoId)).limit(1);
  if (!antes) return "Registro não encontrado.";
  const status = texto(form, "status") as (typeof STATUS_PARTICIPACAO)[number] | null;
  if (!status || !STATUS_PARTICIPACAO.includes(status)) return "Status inválido.";
  const canal = texto(form, "canal") as (typeof CANAIS)[number] | null;
  if (canal && !CANAIS.includes(canal)) return "Canal inválido.";

  const dados =
    status === "disponivel"
      ? // Voltar para disponível desfaz o vínculo com o padrinho e com o pedido.
        { status, pedidoId: null, padrinhoNome: null, padrinhoContato: null, canal: null, dataApadrinhamento: null, dataEntrega: null }
      : {
          status,
          padrinhoNome: texto(form, "padrinhoNome"),
          padrinhoContato: texto(form, "padrinhoContato"),
          canal,
          dataApadrinhamento: dataIso(texto(form, "dataApadrinhamento")),
          dataEntrega: status === "entregue" ? dataIso(texto(form, "dataEntrega")) : null,
        };
  if (status !== "disponivel" && !dados.padrinhoNome) return "Informe quem está ajudando.";
  if (status !== "disponivel" && !canal) return "Informe por qual canal.";

  await db
    .update(participacoes)
    .set({ ...dados, observacoes: texto(form, "observacoes"), atualizadoEm: new Date() })
    .where(eq(participacoes.id, participacaoId));
  await auditar(u.email, "alterou status", "participacao", participacaoId, { de: antes.status, para: status, canal: dados.canal });
  revalidar(antes.campanhaId);
  return "Salvo.";
}
