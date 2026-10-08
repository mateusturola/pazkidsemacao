"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ESTADOS } from "@/content/mapa-brasil";
import { auditar } from "@/lib/auditoria";
import { requireAdmin, requireUsuario } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

const { agenda } = schema;

/** "19h", "19h30", "19.30", "7" e "19:00" viram "19:00"; o resto, vazio. */
function horaPadrao(v: string) {
  const m = v.trim().match(/^(\d{1,2})(?:\s*[:h.]\s*(\d{2})?)?\s*h?$/i);
  if (!m) return "";
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  return h < 24 && min < 60 ? `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}` : "";
}

function dados(form: FormData) {
  const t = (k: string) => String(form.get(k) ?? "").trim();
  const dia = Number(t("diaSemana"));
  // Hora é opcional: tem lugar que manda só o dia ("aos sábados"). Vazia, o site mostra só o dia.
  const hora = horaPadrao(t("hora"));
  return {
    horaInvalida: Boolean(t("hora")) && !hora,
    diaSemana: Number.isInteger(dia) && dia >= 0 && dia <= 6 ? dia : -1,
    hora,
    nome: t("nome").replace(/\s+/g, " "),
    endereco: t("endereco").replace(/\s+/g, " "),
    complemento: t("complemento") || null,
    estado: t("estado") in ESTADOS ? t("estado") : "",
    cidade: t("cidade").replace(/\s+/g, " ") || null,
  };
}

function invalido(d: ReturnType<typeof dados>) {
  if (d.diaSemana < 0) return "Escolha o dia da semana.";
  if (d.horaInvalida) return "Escreva a hora no formato 19:00, ou deixe em branco se não tiver horário fixo.";
  if (!d.nome) return "Informe o nome do encontro.";
  if (!d.endereco) return "Informe o endereço.";
  if (!d.estado) return "Escolha o estado.";
  return null;
}

function revalidar() {
  revalidatePath("/painel/agenda");
  // A agenda aparece na página inicial, em /agenda e no llms.txt.
  revalidatePath("/", "layout");
}

export async function criarEncontro(_: string | null, form: FormData) {
  const u = await requireUsuario();
  const d = dados(form);
  const erro = invalido(d);
  if (erro) return erro;
  const campos = { diaSemana: d.diaSemana, hora: d.hora, nome: d.nome, endereco: d.endereco, complemento: d.complemento, estado: d.estado, cidade: d.cidade };
  const [novo] = await getDb().insert(agenda).values(campos).returning({ id: agenda.id });
  await auditar(u.email, "criou", "agenda", novo.id, campos);
  revalidar();
  return null;
}

export async function salvarEncontro(id: number, _: string | null, form: FormData) {
  const u = await requireUsuario();
  const d = dados(form);
  const erro = invalido(d);
  if (erro) return erro;
  const db = getDb();
  const [atual] = await db.select().from(agenda).where(eq(agenda.id, id)).limit(1);
  if (!atual) return "Esse encontro não existe mais.";
  const campos = { diaSemana: d.diaSemana, hora: d.hora, nome: d.nome, endereco: d.endereco, complemento: d.complemento, estado: d.estado, cidade: d.cidade };
  await db
    .update(agenda)
    .set({ ...campos, ativo: form.get("ativo") === "1" })
    .where(eq(agenda.id, id));
  await auditar(u.email, "editou", "agenda", id, campos);
  revalidar();
  return "Salvo.";
}

export async function excluirEncontro(id: number) {
  const u = await requireUsuario();
  const db = getDb();
  const [atual] = await db.select().from(agenda).where(eq(agenda.id, id)).limit(1);
  if (!atual) return;
  await db.delete(agenda).where(eq(agenda.id, id));
  await auditar(u.email, "excluiu", "agenda", id, { nome: atual.nome, diaSemana: atual.diaSemana, hora: atual.hora });
  revalidar();
}

/** Os estados onde o projeto está e quantas crianças alcança por semana: pintam o mapa e entram nos textos do site. */
export async function salvarAlcance(_: string | null, form: FormData) {
  const u = await requireAdmin();
  const estados = form.getAll("estados").map(String).filter((e) => e in ESTADOS);
  const criancas = String(form.get("criancas") ?? "").replace(/\D/g, "");
  const db = getDb();
  await db.batch([
    db
      .insert(schema.configuracoes)
      .values({ chave: "alcance_estados", valor: estados.join(",") })
      .onConflictDoUpdate({ target: schema.configuracoes.chave, set: { valor: estados.join(","), atualizadoEm: new Date() } }),
    db
      .insert(schema.configuracoes)
      .values({ chave: "alcance_criancas", valor: criancas })
      .onConflictDoUpdate({ target: schema.configuracoes.chave, set: { valor: criancas, atualizadoEm: new Date() } }),
  ]);
  await auditar(u.email, "editou o alcance", "configuracao", null, { estados, criancas });
  revalidar();
  return "Salvo.";
}
