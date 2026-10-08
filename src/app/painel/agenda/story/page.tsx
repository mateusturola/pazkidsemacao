import type { Metadata } from "next";
import Link from "next/link";
import { StoryAgenda } from "@/components/painel/story-agenda";
import { encontrosAtivos } from "@/lib/agenda";
import { requireUsuario } from "@/lib/auth";

export const metadata: Metadata = { title: "Story da agenda" };

export default async function StoryPage() {
  await requireUsuario();
  const agenda = await encontrosAtivos();
  return (
    <div className="max-w-4xl">
      <Link href="/agenda" className="text-sm text-tinta-2 hover:text-tinta">
        ← Agenda
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">Story da agenda</h1>
      <p className="mt-1 mb-6 text-tinta-2">A arte sai da agenda cadastrada, no tamanho do story (1080 × 1920). Mudou um encontro? Volte aqui e gere de novo.</p>
      {agenda.length ? <StoryAgenda agenda={agenda} /> : <p className="cartao p-8 text-tinta-2">Cadastre os encontros da semana para gerar a arte.</p>}
    </div>
  );
}
