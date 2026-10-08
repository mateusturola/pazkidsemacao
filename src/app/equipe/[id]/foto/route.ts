import { and, eq } from "drizzle-orm";
import { servir } from "@/lib/arquivos";
import { getDb, schema } from "@/lib/db";

// Foto de quem cuida do projeto. Só de quem está ativo na seção: quem saiu não fica acessível pelo número.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Não encontrado.", { status: 404 });
  const [m] = await getDb()
    .select({ fotoKey: schema.equipe.fotoKey })
    .from(schema.equipe)
    .where(and(eq(schema.equipe.id, id), eq(schema.equipe.ativo, true)))
    .limit(1);
  if (!m?.fotoKey) return new Response("Não encontrado.", { status: 404 });
  return servir(m.fotoKey, false);
}
