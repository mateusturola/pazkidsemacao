"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auditar } from "@/lib/auditoria";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

function dados(form: FormData) {
  const t = (k: string) => String(form.get(k) ?? "").trim() || null;
  return { nome: t("nome") ?? "", endereco: t("endereco"), horarios: t("horarios") };
}

function revalidar() {
  revalidatePath("/painel/pontos");
  // Os pontos aparecem na página de cada campanha e na finalização.
  revalidatePath("/", "layout");
}

export async function criarPonto(_: string | null, form: FormData) {
  const u = await requireAdmin();
  const d = dados(form);
  if (!d.nome) return "Informe o nome do ponto de coleta.";
  const [novo] = await getDb().insert(schema.pontosColeta).values(d).returning({ id: schema.pontosColeta.id });
  await auditar(u.email, "criou", "ponto_coleta", novo.id, d);
  revalidar();
  return null;
}

export async function salvarPonto(id: number, _: string | null, form: FormData) {
  const u = await requireAdmin();
  const d = dados(form);
  if (!d.nome) return "Informe o nome do ponto de coleta.";
  await getDb()
    .update(schema.pontosColeta)
    .set({ ...d, ativo: form.get("ativo") === "1" })
    .where(eq(schema.pontosColeta.id, id));
  await auditar(u.email, "editou", "ponto_coleta", id, d);
  revalidar();
  return "Salvo.";
}
