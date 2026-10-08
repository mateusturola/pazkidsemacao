"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { apagar, bucket, extensaoFoto, FOTO_MAX_BYTES } from "@/lib/arquivos";
import { auditar } from "@/lib/auditoria";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { usuarioInstagram } from "@/lib/equipe";
import { novoToken } from "@/lib/token";

const { equipe } = schema;

function dados(form: FormData) {
  const t = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max) || null;
  return {
    nome: t("nome", 80) ?? "",
    funcao: t("funcao", 120),
    texto: t("texto", 700),
    instagram: usuarioInstagram(t("instagram", 120)),
    ordem: Number(form.get("ordem")) || 0,
  };
}

function revalidar() {
  revalidatePath("/painel/equipe");
  revalidatePath("/");
}

export async function criarMembro(_: string | null, form: FormData) {
  const u = await requireAdmin();
  const d = dados(form);
  if (!d.nome) return "Informe o nome.";
  const [novo] = await getDb().insert(equipe).values(d).returning({ id: equipe.id });
  await auditar(u.email, "criou", "equipe", novo.id, d);
  revalidar();
  return null;
}

export async function salvarMembro(id: number, _: string | null, form: FormData) {
  const u = await requireAdmin();
  const d = dados(form);
  if (!d.nome) return "Informe o nome.";
  await getDb()
    .update(equipe)
    .set({ ...d, ativo: form.get("ativo") === "1", atualizadoEm: new Date() })
    .where(eq(equipe.id, id));
  await auditar(u.email, "editou", "equipe", id, d);
  revalidar();
  return "Salvo.";
}

export async function enviarFotoMembro(id: number, _: string | null, form: FormData) {
  const u = await requireAdmin();
  const arquivo = form.get("foto");
  if (!(arquivo instanceof File) || !arquivo.size) return "Escolha uma foto.";
  const ext = extensaoFoto(arquivo.type);
  if (!ext) return "Use uma foto JPG, PNG ou WebP.";
  if (arquivo.size > FOTO_MAX_BYTES) return "A foto passa de 8 MB.";
  const db = getDb();
  const [m] = await db.select({ fotoKey: equipe.fotoKey }).from(equipe).where(eq(equipe.id, id)).limit(1);
  if (!m) return "Pessoa não encontrada.";
  // Nome aleatório: trocar a foto troca o endereço, e ninguém vê a antiga guardada no cache.
  const key = `equipe/${id}/foto-${novoToken()}.${ext}`;
  await bucket().put(key, await arquivo.arrayBuffer(), { httpMetadata: { contentType: arquivo.type } });
  await db.update(equipe).set({ fotoKey: key, atualizadoEm: new Date() }).where(eq(equipe.id, id));
  await apagar(m.fotoKey);
  await auditar(u.email, "trocou a foto", "equipe", id);
  revalidar();
  return "Salvo.";
}

export async function excluirMembro(id: number) {
  const u = await requireAdmin();
  const db = getDb();
  const [m] = await db.select().from(equipe).where(eq(equipe.id, id)).limit(1);
  if (!m) return;
  await db.delete(equipe).where(eq(equipe.id, id));
  await apagar(m.fotoKey);
  await auditar(u.email, "excluiu", "equipe", id, { nome: m.nome });
  revalidar();
}
