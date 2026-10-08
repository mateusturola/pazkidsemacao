import { eq } from "drizzle-orm";
import { servir } from "@/lib/arquivos";
import { usuarioAtual } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

// No painel a foto aparece mesmo de quem está fora do site (desativado), para a equipe conferir.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await usuarioAtual())) return new Response("Acesso restrito.", { status: 403 });
  const id = Number((await params).id);
  const [m] = Number.isInteger(id) ? await getDb().select({ fotoKey: schema.equipe.fotoKey }).from(schema.equipe).where(eq(schema.equipe.id, id)).limit(1) : [];
  if (!m?.fotoKey) return new Response("Não encontrado.", { status: 404 });
  return servir(m.fotoKey, true);
}
