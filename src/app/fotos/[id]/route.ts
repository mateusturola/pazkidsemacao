import { and, eq, ne } from "drizzle-orm";
import { servir } from "@/lib/arquivos";
import { avatarSvg } from "@/lib/avatar";
import { getDb, schema } from "@/lib/db";

// Imagem da criança no site. A foto só sai com autorização de imagem; sem ela, o avatar. E só de
// criança que está numa campanha publicada: o resto do cadastro não fica acessível pelo número.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Não encontrado.", { status: 404 });
  const [c] = await getDb()
    .select({ fotoKey: schema.criancas.fotoKey, avatarKey: schema.criancas.avatarKey, autorizacao: schema.criancas.autorizacaoImagem })
    .from(schema.criancas)
    .innerJoin(schema.participacoes, eq(schema.participacoes.criancaId, schema.criancas.id))
    .innerJoin(schema.campanhas, eq(schema.campanhas.id, schema.participacoes.campanhaId))
    .where(and(eq(schema.criancas.id, id), ne(schema.campanhas.status, "rascunho")))
    .limit(1);
  if (!c) return new Response("Não encontrado.", { status: 404 });
  const key = (c.autorizacao && c.fotoKey) || c.avatarKey;
  if (key) return servir(key, false);
  return new Response(avatarSvg(`crianca-${id}`), {
    headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" },
  });
}
