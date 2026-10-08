import type { Metadata } from "next";
import Link from "next/link";
import { AgendaBrasil } from "@/components/site/agenda";
import { Rodape } from "@/components/site/rodape";
import { Topo } from "@/components/site/topo";
import { SITE } from "@/content/site";
import { encontrosAtivos } from "@/lib/agenda";
import { lerAlcance, listaEstados, numero } from "@/lib/alcance";
import { campanhasAtivas } from "@/lib/campanhas";

export const dynamic = "force-dynamic";

const descricao = "Onde o Paz Kids em Ação está, estado por estado, e os encontros da semana com endereço e rota para cada um.";

export const metadata: Metadata = {
  title: "Agenda semanal",
  description: descricao,
  alternates: { canonical: "/agenda" },
  openGraph: { title: `Agenda semanal · ${SITE.nome}`, description: descricao, url: `${SITE.url}/agenda`, images: ["/og-home.jpg"] },
};

/** A página do link da bio: abre direto na agenda, sem passar pela página inicial inteira. */
export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const [{ estado }, agenda, ativas, alcance] = await Promise.all([searchParams, encontrosAtivos(), campanhasAtivas(), lerAlcance()]);
  const principal = ativas[0];
  return (
    <div className="tema-paz">
      <Topo
        variante="institucional"
        fundoClaro
        links={[
          { href: "/", label: "Início" },
          { href: "/#quem-somos", label: "Quem somos" },
          { href: "/historia", label: "História" },
          { href: "/#como-ajudar", label: "Como ajudar" },
        ]}
        cta={principal ? { href: `/${principal.slug}`, label: principal.nome } : { href: "/#como-ajudar", label: "Quero ajudar" }}
      />
      <main className="bg-creme pt-[72px]">
        <section className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
          <AgendaBrasil
            estados={alcance.estados}
            agenda={agenda}
            inicial={estado?.toUpperCase()}
            completo
            cabecalho={
              <>
                <p className="chamada text-vermelho">Agenda semanal</p>
                <h1 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-6xl">
                  Onde a gente está <span className="pincelada">toda semana</span>
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-tinta-2">
                  {alcance.estados.length > 1 ? `Em ${alcance.estados.length} estados do Brasil: ${listaEstados(alcance.estados)}.` : ""}
                  {alcance.criancasPorSemana ? ` São ${numero(alcance.criancasPorSemana)} crianças por semana.` : ""} Escolha o estado para ver os
                  encontros, e toque em “Como chegar” para abrir a rota.
                </p>
              </>
            }
          />
          {agenda.length === 0 && alcance.estados.length === 0 && (
            <p className="cartao mt-10 p-8 text-tinta-2">A agenda desta semana está sendo atualizada. Acompanhe pelo Instagram @{SITE.instagram}.</p>
          )}
          <div className="mt-16 flex flex-wrap gap-3">
            <a href={SITE.whatsapp.voluntario} target="_blank" rel="noopener" className="btn btn-acao">
              Quero ser voluntário
            </a>
            {principal && (
              <Link href={`/${principal.slug}`} className="btn btn-claro">
                {principal.nome}: apadrinhe uma criança
              </Link>
            )}
          </div>
        </section>
      </main>
      <Rodape variante="institucional" />
    </div>
  );
}
