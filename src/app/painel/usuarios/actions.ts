"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auditar } from "@/lib/auditoria";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

const { usuariosPainel } = schema;

/** O painel não pode ficar sem nenhum admin ativo: ninguém mais conseguiria cadastrar usuários. */
async function sobraAdmin(semEmail: string) {
  const [outro] = await getDb()
    .select({ email: usuariosPainel.email })
    .from(usuariosPainel)
    .where(and(eq(usuariosPainel.papel, "admin"), eq(usuariosPainel.ativo, true), ne(usuariosPainel.email, semEmail)))
    .limit(1);
  return Boolean(outro);
}

export async function adicionarUsuario(_: string | null, form: FormData) {
  const u = await requireAdmin();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const nome = String(form.get("nome") ?? "").trim() || null;
  const papel = form.get("papel") === "admin" ? "admin" : "voluntario";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "E-mail inválido.";
  await getDb()
    .insert(usuariosPainel)
    .values({ email, nome, papel, ativo: true, criadoPor: u.email })
    .onConflictDoUpdate({ target: usuariosPainel.email, set: { nome, papel, ativo: true } });
  await auditar(u.email, "adicionou usuário", "usuario", email, { papel });
  revalidatePath("/painel/usuarios");
  return null;
}

export async function mudarPapel(email: string, papel: "admin" | "voluntario") {
  const u = await requireAdmin();
  if (papel === "voluntario" && !(await sobraAdmin(email))) throw new Error("Precisa haver outro admin.");
  await getDb().update(usuariosPainel).set({ papel }).where(eq(usuariosPainel.email, email));
  await auditar(u.email, `mudou papel para ${papel}`, "usuario", email);
  revalidatePath("/painel/usuarios");
}

export async function removerUsuario(email: string) {
  const u = await requireAdmin();
  if (email === u.email) throw new Error("Você não pode remover a si mesmo.");
  if (!(await sobraAdmin(email))) throw new Error("Precisa haver outro admin.");
  await getDb().delete(usuariosPainel).where(eq(usuariosPainel.email, email));
  await auditar(u.email, "removeu usuário", "usuario", email);
  revalidatePath("/painel/usuarios");
}
