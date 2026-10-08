import type { Metadata } from "next";
import Link from "next/link";
import { StoryAgenda } from "@/components/painel/story-agenda";
import { ESTADOS, type UF } from "@/content/mapa-brasil";
import { encontrosAtivos } from "@/lib/agenda";
import { requireUsuario } from "@/lib/auth";

export const metadata: Metadata = { title: "Story da agenda" };

/** Uma arte por estado: com o Brasil inteiro numa imagem só, os encontros não caberiam no story. */
export default async function StoryPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requireUsuario();
  const [{ estado }, todos] = await Promise.all([searchParams, encontrosAtivos()]);
  const estados = [...new Set(todos.map((e) => e.estado))].filter((u): u is UF => u in ESTADOS);
  const atual = estados.find((u) => u === estado?.toUpperCase()) ?? estados[0];
  const agenda = todos.filter((e) => e.estado === atual);
  return (
    <div className="max-w-4xl">
      <Link href="/agenda" className="text-sm text-tinta-2 hover:text-tinta">
        ← Agenda
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">Story da agenda</h1>
      <p className="mt-1 mb-4 text-tinta-2">A arte sai da agenda cadastrada, no tamanho do story (1080 × 1920), uma por estado. Mudou um encontro? Volte aqui e gere de novo.</p>
      {estados.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {estados.map((u) => (
            <Link
              key={u}
              href={`/agenda/story?estado=${u}`}
              className={`rounded-full border px-3 py-1 text-sm ${u === atual ? "border-tinta bg-tinta text-white" : "border-linha bg-white"}`}
            >
              {ESTADOS[u].nome}
            </Link>
          ))}
        </div>
      )}
      {agenda.length ? <StoryAgenda key={atual} agenda={agenda} /> : <p className="cartao p-8 text-tinta-2">Cadastre os encontros da semana para gerar a arte.</p>}
    </div>
  );
}
