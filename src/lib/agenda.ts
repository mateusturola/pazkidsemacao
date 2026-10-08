import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

/** O que o site e o story mostram de cada encontro. */
export type PontoAgenda = { dia: string; hora: string; nome: string; endereco: string; complemento?: string | null; lat?: number | null; lng?: number | null };

// A semana do projeto começa na segunda: o domingo vai para o fim da lista.
const ordemDia = (d: number) => (d + 6) % 7;

export async function encontrosAtivos(): Promise<PontoAgenda[]> {
  const linhas = await getDb().select().from(schema.agenda).where(eq(schema.agenda.ativo, true)).orderBy(asc(schema.agenda.hora));
  return linhas
    .sort((a, b) => ordemDia(a.diaSemana) - ordemDia(b.diaSemana) || a.hora.localeCompare(b.hora))
    .map((e) => ({ dia: DIAS[e.diaSemana], hora: e.hora, nome: e.nome, endereco: e.endereco, complemento: e.complemento, lat: e.lat, lng: e.lng }));
}

/**
 * Coordenada a partir de um link do Google Maps colado pela equipe: para o lugar que o
 * OpenStreetMap não conhece (rua interna da comunidade) ou quando o pino caiu longe.
 * Link curto (maps.app.goo.gl) é seguido até o endereço completo, que traz a coordenada.
 */
export async function coordenadaDoLink(link: string): Promise<{ lat: number; lng: number } | null> {
  let url = link.trim();
  if (!/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/.test(url)) return null;
  if (/goo\.gl/.test(url)) {
    const r = await fetch(url, { redirect: "manual" }).catch(() => null);
    url = r?.headers.get("location") ?? url;
  }
  // O pino fica em !3d…!4d…; o @lat,lng é o centro da tela, que serve quando não há pino.
  const m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ?? url.match(/[?&](?:q|query|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ?? url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** Coordenada do endereço pelo OpenStreetMap (Nominatim). Acerta a rua; o número quase nunca. */
export async function coordenadaDoEndereco(endereco: string): Promise<{ lat: number; lng: number } | null> {
  const q = new URLSearchParams({ q: endereco, format: "json", limit: "1", countrycodes: "br" });
  try {
    // A política do Nominatim pede um User-Agent que identifique quem chama.
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, { headers: { "user-agent": "pazkidsemacao.com (agenda do painel)" } });
    if (!r.ok) return null;
    const [p] = (await r.json()) as { lat: string; lon: string }[];
    return p ? { lat: Number(p.lat), lng: Number(p.lon) } : null;
  } catch {
    return null;
  }
}
