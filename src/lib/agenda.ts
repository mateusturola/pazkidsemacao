import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

/** O que o site e o story mostram de cada encontro. */
export type PontoAgenda = { dia: string; hora: string; nome: string; endereco: string; complemento?: string | null; estado: string; cidade?: string | null };

// A semana do projeto começa na segunda: o domingo vai para o fim da lista.
const ordemDia = (d: number) => (d + 6) % 7;

export async function encontrosAtivos(): Promise<PontoAgenda[]> {
  const linhas = await getDb().select().from(schema.agenda).where(eq(schema.agenda.ativo, true)).orderBy(asc(schema.agenda.hora));
  return linhas
    .sort((a, b) => ordemDia(a.diaSemana) - ordemDia(b.diaSemana) || a.hora.localeCompare(b.hora))
    .map((e) => ({ dia: DIAS[e.diaSemana], hora: e.hora, nome: e.nome, endereco: e.endereco, complemento: e.complemento, estado: e.estado, cidade: e.cidade }));
}
