import { eq } from "drizzle-orm";
import { servir } from "@/lib/arquivos";
import { usuarioAtual } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

// No painel o logo aparece mesmo de parceiro fora do site, para a equipe conferir.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await usuarioAtual())) return new Response("Acesso restrito.", { status: 403 });
  const id = Number((await params).id);
  const [p] = Number.isInteger(id) ? await getDb().select({ logoKey: schema.parceiros.logoKey }).from(schema.parceiros).where(eq(schema.parceiros.id, id)).limit(1) : [];
  if (!p?.logoKey) return new Response("Não encontrado.", { status: 404 });
  return servir(p.logoKey, true);
}
