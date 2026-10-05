import { eq } from "drizzle-orm";
import { servir } from "@/lib/arquivos";
import { usuarioAtual } from "@/lib/auth";
import { avatarSvg } from "@/lib/avatar";
import { getDb, schema } from "@/lib/db";

// Imagem da criança dentro do painel: a foto aparece mesmo sem autorização de imagem (a equipe
// precisa reconhecer a criança), mas só para quem está em usuarios_painel.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await usuarioAtual())) return new Response("Acesso restrito.", { status: 403 });
  const id = Number((await params).id);
  const tipo = new URL(req.url).searchParams.get("tipo");
  const [c] = await getDb()
    .select({ fotoKey: schema.criancas.fotoKey, avatarKey: schema.criancas.avatarKey })
    .from(schema.criancas)
    .where(eq(schema.criancas.id, id))
    .limit(1);
  if (!c) return new Response("Não encontrado.", { status: 404 });
  const key = tipo === "avatar" ? c.avatarKey : (c.fotoKey ?? c.avatarKey);
  if (key) return servir(key, true);
  return new Response(avatarSvg(`crianca-${id}`), { headers: { "content-type": "image/svg+xml", "cache-control": "private, max-age=300" } });
}
