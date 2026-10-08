import { and, eq } from "drizzle-orm";
import { servir } from "@/lib/arquivos";
import { getDb, schema } from "@/lib/db";

// Logo de empresa parceira no site. Só de quem está ativo na seção.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Não encontrado.", { status: 404 });
  const [p] = await getDb()
    .select({ logoKey: schema.parceiros.logoKey })
    .from(schema.parceiros)
    .where(and(eq(schema.parceiros.id, id), eq(schema.parceiros.ativo, true)))
    .limit(1);
  if (!p?.logoKey) return new Response("Não encontrado.", { status: 404 });
  return servir(p.logoKey, false);
}
