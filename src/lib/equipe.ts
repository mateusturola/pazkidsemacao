import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const { equipe } = schema;

/** Quem aparece na página inicial, na ordem que a equipe escolheu. */
export function equipeAtiva() {
  return getDb().select().from(equipe).where(eq(equipe.ativo, true)).orderBy(asc(equipe.ordem), asc(equipe.id));
}

/** Aceita "@fulano", "fulano" ou o endereço do perfil e guarda só o usuário. */
export function usuarioInstagram(valor: string | null | undefined) {
  const v = (valor ?? "").trim();
  if (!v) return null;
  const doLink = v.match(/instagram\.com\/([A-Za-z0-9._]+)/i)?.[1];
  const usuario = (doLink ?? v).replace(/^@/, "").replace(/\/+$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(usuario) ? usuario.toLowerCase() : null;
}
