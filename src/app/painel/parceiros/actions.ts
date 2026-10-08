"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { apagar, bucket, extensaoFoto, FOTO_MAX_BYTES } from "@/lib/arquivos";
import { auditar } from "@/lib/auditoria";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { linkSeguro } from "@/lib/parceiros";
import { novoToken } from "@/lib/token";

const { parceiros } = schema;

function dados(form: FormData) {
  const t = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max) || null;
  return { nome: t("nome", 80) ?? "", link: linkSeguro(t("link", 500)), ordem: Number(form.get("ordem")) || 0 };
}

function revalidar() {
  revalidatePath("/painel/parceiros");
  revalidatePath("/");
}

export async function criarParceiro(_: string | null, form: FormData) {
  const u = await requireAdmin();
  const d = dados(form);
  if (!d.nome) return "Informe o nome da empresa.";
  if (String(form.get("link") ?? "").trim() && !d.link) return "O link não parece um endereço de site.";
  const [novo] = await getDb().insert(parceiros).values(d).returning({ id: parceiros.id });
  await auditar(u.email, "criou", "parceiro", novo.id, d);
  revalidar();
  return null;
}

export async function salvarParceiro(id: number, _: string | null, form: FormData) {
  const u = await requireAdmin();
  const d = dados(form);
  if (!d.nome) return "Informe o nome da empresa.";
  if (String(form.get("link") ?? "").trim() && !d.link) return "O link não parece um endereço de site.";
  await getDb()
    .update(parceiros)
    .set({ ...d, ativo: form.get("ativo") === "1", atualizadoEm: new Date() })
    .where(eq(parceiros.id, id));
  await auditar(u.email, "editou", "parceiro", id, d);
  revalidar();
  return "Salvo.";
}

export async function enviarLogo(id: number, _: string | null, form: FormData) {
  const u = await requireAdmin();
  const arquivo = form.get("logo");
  if (!(arquivo instanceof File) || !arquivo.size) return "Escolha o arquivo do logo.";
  const ext = extensaoFoto(arquivo.type);
  if (!ext) return "Use o logo em PNG, WebP ou JPG.";
  if (arquivo.size > FOTO_MAX_BYTES) return "O arquivo passa de 8 MB.";
  const db = getDb();
  const [p] = await db.select({ logoKey: parceiros.logoKey }).from(parceiros).where(eq(parceiros.id, id)).limit(1);
  if (!p) return "Parceiro não encontrado.";
  // Nome aleatório: trocar o logo troca o endereço, e ninguém vê o antigo guardado no cache.
  const key = `parceiros/${id}/logo-${novoToken()}.${ext}`;
  await bucket().put(key, await arquivo.arrayBuffer(), { httpMetadata: { contentType: arquivo.type } });
  await db.update(parceiros).set({ logoKey: key, atualizadoEm: new Date() }).where(eq(parceiros.id, id));
  await apagar(p.logoKey);
  await auditar(u.email, "trocou o logo", "parceiro", id);
  revalidar();
  return "Salvo.";
}

export async function excluirParceiro(id: number) {
  const u = await requireAdmin();
  const db = getDb();
  const [p] = await db.select().from(parceiros).where(eq(parceiros.id, id)).limit(1);
  if (!p) return;
  await db.delete(parceiros).where(eq(parceiros.id, id));
  await apagar(p.logoKey);
  await auditar(u.email, "excluiu", "parceiro", id, { nome: p.nome });
  revalidar();
}
