"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { coordenadaDoEndereco, coordenadaDoLink } from "@/lib/agenda";
import { auditar } from "@/lib/auditoria";
import { requireUsuario } from "@/lib/auth";
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
  const hora = horaPadrao(t("hora"));
  return {
    diaSemana: Number.isInteger(dia) && dia >= 0 && dia <= 6 ? dia : -1,
    hora,
    nome: t("nome").replace(/\s+/g, " "),
    endereco: t("endereco").replace(/\s+/g, " "),
    complemento: t("complemento") || null,
    link: t("link"),
  };
}

function invalido(d: ReturnType<typeof dados>) {
  if (d.diaSemana < 0) return "Escolha o dia da semana.";
  if (!d.hora) return "Informe a hora no formato 19:00.";
  if (!d.nome) return "Informe o nome do encontro.";
  if (!d.endereco) return "Informe o endereço.";
  return null;
}

/**
 * O link do Google Maps manda no ponto do mapa; sem ele, o endereço é procurado no OpenStreetMap.
 * Endereço que não muda mantém o ponto que já existe (inclusive um que veio de link).
 */
async function coordenada(d: ReturnType<typeof dados>, atual?: { endereco: string; lat: number | null; lng: number | null }) {
  if (d.link) {
    const c = await coordenadaDoLink(d.link);
    return c ? { ...c, aviso: null } : { lat: atual?.lat ?? null, lng: atual?.lng ?? null, aviso: "Não achei a localização nesse link. Abra o lugar no Google Maps, toque em Compartilhar e cole o link." };
  }
  if (atual && atual.endereco === d.endereco && atual.lat != null) return { lat: atual.lat, lng: atual.lng, aviso: null };
  const c = await coordenadaDoEndereco(d.endereco);
  return c
    ? { ...c, aviso: null }
    : { lat: null, lng: null, aviso: "O endereço não foi encontrado no mapa: o encontro aparece só na lista. Para pôr no mapa, cole o link do lugar no Google Maps." };
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
  // Sem o aviso de "não achei no mapa": o encontro já foi criado, e uma mensagem deixaria o
  // formulário cheio, convidando a criar de novo. A lista mostra a etiqueta "Sem ponto no mapa".
  const { lat, lng } = await coordenada(d);
  const campos = { diaSemana: d.diaSemana, hora: d.hora, nome: d.nome, endereco: d.endereco, complemento: d.complemento };
  const [novo] = await getDb()
    .insert(agenda)
    .values({ ...campos, lat, lng })
    .returning({ id: agenda.id });
  await auditar(u.email, "criou", "agenda", novo.id, { ...campos, noMapa: lat != null });
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
  const { lat, lng, aviso } = await coordenada(d, atual);
  const campos = { diaSemana: d.diaSemana, hora: d.hora, nome: d.nome, endereco: d.endereco, complemento: d.complemento };
  await db
    .update(agenda)
    .set({ ...campos, lat, lng, ativo: form.get("ativo") === "1" })
    .where(eq(agenda.id, id));
  await auditar(u.email, "editou", "agenda", id, { ...campos, noMapa: lat != null });
  revalidar();
  return aviso ?? "Salvo.";
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
