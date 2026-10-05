import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { verifyAccess } from "@/lib/access";
import { getDb, schema } from "@/lib/db";

export type Usuario = { email: string; nome: string | null; papel: "admin" | "voluntario" };

/** E-mail confirmado pelo Access. Não diz nada sobre permissão. */
export async function emailConfirmado() {
  const h = await headers();
  const token = h.get("cf-access-jwt-assertion") ?? (await cookies()).get("CF_Authorization")?.value;
  return verifyAccess(token);
}

/**
 * Quem está usando o painel. O Access aceita qualquer e-mail que receba o código; só entra quem
 * estiver ativo em usuarios_painel. Assim, liberar alguém é cadastrar o e-mail aqui, sem mexer na Cloudflare.
 */
export const usuarioAtual = cache(async (): Promise<Usuario | null> => {
  const email = await emailConfirmado();
  if (!email) return null;
  const [u] = await getDb().select().from(schema.usuariosPainel).where(eq(schema.usuariosPainel.email, email)).limit(1);
  if (!u?.ativo) return null;
  return { email: u.email, nome: u.nome, papel: u.papel };
});

/** Toda server action do painel chama isto (ou requireAdmin): o middleware protege páginas, não actions. */
export async function requireUsuario() {
  const u = await usuarioAtual();
  if (!u) throw new Error("Acesso restrito.");
  return u;
}

/** Usuários, campanhas, pontos de coleta, importação e auditoria: só admin. */
export async function requireAdmin() {
  const u = await requireUsuario();
  if (u.papel !== "admin") throw new Error("Só administradores podem fazer isso.");
  return u;
}
