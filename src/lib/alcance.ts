import "server-only";
import { inArray } from "drizzle-orm";
import { ESTADOS, UFS, type UF } from "@/content/mapa-brasil";
import { perguntas } from "@/content/site";
import { getDb, schema } from "@/lib/db";

// Os números que a equipe passou (Mary, outubro de 2026). Valem até alguém mudar no painel › Agenda.
const PADRAO = { estados: ["SP", "PA", "AP", "MS", "AM", "AC", "PR"] as UF[], criancasPorSemana: 1628 };

export type Alcance = { estados: UF[]; criancasPorSemana: number | null };

/** Onde o projeto está e quantas crianças alcança por semana: o mapa e os textos do site saem daqui. */
export async function lerAlcance(): Promise<Alcance> {
  const linhas = await getDb()
    .select()
    .from(schema.configuracoes)
    .where(inArray(schema.configuracoes.chave, ["alcance_estados", "alcance_criancas"]))
    .catch(() => []);
  const valor = (k: string) => linhas.find((l) => l.chave === k)?.valor;
  const estados = valor("alcance_estados")?.split(",").filter((u): u is UF => u in ESTADOS) ?? PADRAO.estados;
  const n = valor("alcance_criancas");
  return { estados: UFS.filter((u) => estados.includes(u)), criancasPorSemana: n === undefined ? PADRAO.criancasPorSemana : Number(n) || null };
}

/** "São Paulo, Pará e Acre". */
export function listaEstados(estados: UF[]) {
  const nomes = estados.map((u) => ESTADOS[u].nome);
  return nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}` : (nomes[0] ?? "");
}

/** 1628 vira "1.628". */
export const numero = (n: number) => n.toLocaleString("pt-BR");

/** As perguntas frequentes do site, com a de "onde atua" montada a partir do alcance. */
export function perguntasDoSite(a: Alcance) {
  return perguntas({ estados: listaEstados(a.estados), quantos: a.estados.length, criancasPorSemana: a.criancasPorSemana });
}
