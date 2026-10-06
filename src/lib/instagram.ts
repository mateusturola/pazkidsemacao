import "server-only";
import { desc, eq, notInArray } from "drizzle-orm";
import { apagar, bucket } from "@/lib/arquivos";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env";

// Últimos posts do @pazkidsemacao pela API oficial do Instagram (Instagram API com login do
// Instagram; a conta precisa ser Profissional). O token de longa duração vale 60 dias e pode ser
// renovado: o cron renova toda semana e guarda o novo em `configuracoes`, já que o Worker não
// consegue reescrever o próprio secret. O secret INSTAGRAM_TOKEN só é usado na primeira vez.

const API = "https://graph.instagram.com";
const QUANTOS = 8;
const RENOVAR_A_CADA = 7 * 86_400_000;

type Midia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

async function lerConfig(chave: string) {
  const [c] = await getDb().select().from(schema.configuracoes).where(eq(schema.configuracoes.chave, chave)).limit(1);
  return c ?? null;
}

async function gravarConfig(chave: string, valor: string) {
  await getDb()
    .insert(schema.configuracoes)
    .values({ chave, valor })
    .onConflictDoUpdate({ target: schema.configuracoes.chave, set: { valor, atualizadoEm: new Date() } });
}

export async function instagramConfigurado() {
  return Boolean((await lerConfig("instagram_token"))?.valor || env("INSTAGRAM_TOKEN"));
}

/** Busca os posts novos, guarda as imagens no R2 e apaga as que saíram da lista. Roda no cron diário. */
export async function atualizarInstagram() {
  const salvo = await lerConfig("instagram_token");
  let token = salvo?.valor || env("INSTAGRAM_TOKEN");
  if (!token) return { ok: false, motivo: "sem token" };

  if (!salvo || Date.now() - salvo.atualizadoEm.getTime() > RENOVAR_A_CADA) {
    const r = await fetch(`${API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
    if (r.ok) {
      token = ((await r.json()) as { access_token: string }).access_token;
      await gravarConfig("instagram_token", token);
    } else if (!salvo) {
      await gravarConfig("instagram_token", token);
    }
  }

  const res = await fetch(`${API}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${QUANTOS}&access_token=${encodeURIComponent(token)}`);
  if (!res.ok) return { ok: false, motivo: `Instagram respondeu ${res.status}` };
  const { data } = (await res.json()) as { data: Midia[] };

  const db = getDb();
  const ids: string[] = [];
  for (const m of data) {
    const url = m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
    if (!url) continue;
    const key = `instagram/${m.id}.jpg`;
    const existe = await bucket().head(key);
    if (!existe) {
      const img = await fetch(url);
      if (!img.ok) continue;
      await bucket().put(key, await img.arrayBuffer(), { httpMetadata: { contentType: img.headers.get("content-type") ?? "image/jpeg" } });
    }
    ids.push(m.id);
    await db
      .insert(schema.instagramPosts)
      .values({ id: m.id, permalink: m.permalink, legenda: m.caption ?? null, tipo: m.media_type, imagemKey: key, publicadoEm: new Date(m.timestamp) })
      .onConflictDoUpdate({ target: schema.instagramPosts.id, set: { legenda: m.caption ?? null, atualizadoEm: new Date() } });
  }
  if (ids.length) {
    const velhos = await db.select().from(schema.instagramPosts).where(notInArray(schema.instagramPosts.id, ids));
    for (const v of velhos) await apagar(v.imagemKey);
    await db.delete(schema.instagramPosts).where(notInArray(schema.instagramPosts.id, ids));
  }
  return { ok: true, posts: ids.length };
}

export async function postsInstagram() {
  return getDb().select().from(schema.instagramPosts).orderBy(desc(schema.instagramPosts.publicadoEm)).limit(QUANTOS);
}
