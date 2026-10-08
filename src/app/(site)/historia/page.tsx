import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Rodape } from "@/components/site/rodape";
import { Topo } from "@/components/site/topo";
import { LEGADO, SITE, SOBRE } from "@/content/site";
import { campanhasAtivas } from "@/lib/campanhas";

export const dynamic = "force-dynamic";

const descricao =
  "O legado do Pastor Lucas Huber, os 50 anos da Paz Church e como nasceu o Paz Kids em Ação, o projeto que leva o amor de Cristo às crianças de Heliópolis, em São Paulo, e de comunidades de vários estados do Brasil.";

export const metadata: Metadata = {
  title: "Nossa história",
  description: descricao,
  alternates: { canonical: "/historia" },
  openGraph: { title: `Nossa história · ${SITE.nome}`, description: descricao, url: `${SITE.url}/historia`, images: ["/og-home.jpg"] },
};

const atraso = (ms: number) => ({ "--atraso": `${ms}ms` }) as React.CSSProperties;

/** A história inteira, que saiu da página inicial para ela ficar curta: o legado, o projeto e o que ele acredita. */
export default async function HistoriaPage() {
  const principal = (await campanhasAtivas())[0];
  return (
    <div className="tema-paz">
      <Topo
        variante="institucional"
        fundoClaro
        links={[
          { href: "/", label: "Início" },
          { href: "/agenda", label: "Agenda" },
          { href: "/#como-ajudar", label: "Como ajudar" },
        ]}
        cta={principal ? { href: `/${principal.slug}`, label: principal.nome } : { href: "/#como-ajudar", label: "Quero ajudar" }}
      />

      {/* A história: o legado do Pastor Lucas e o projeto que nasceu dele, marco por marco. */}
      <main className="bg-papel pt-[72px]">
        <section className="mx-auto max-w-7xl px-4 pt-14 pb-24 sm:px-8 sm:pt-20 sm:pb-32">
          <div className="flex flex-wrap items-end gap-x-14 gap-y-6">
            <div>
              <p className="font-titulo text-[clamp(6rem,14vw,10rem)] leading-[0.85] font-bold text-verde">50</p>
              <p className="mt-3 font-titulo text-2xl font-semibold text-verde">anos de Paz Church</p>
              <p className="mt-1 text-tinta-2">1976 · 2026</p>
            </div>
            <div className="max-w-2xl pb-2">
              <p className="chamada text-vermelho">Um legado de amor</p>
              <h1 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">{LEGADO.titulo}</h1>
            </div>
          </div>

          {/* Uma linha do tempo só, da família Huber ao Paz Kids em Ação: o projeto é continuação da história da igreja. */}
          <ol className="mt-16 space-y-16 border-l-2 border-dashed border-verde/20 pl-6 sm:mt-20 sm:space-y-24 sm:pl-12">
            {LEGADO.marcos.map((m, i) => (
              <li key={m.quando} className="relative grid items-center gap-8 md:grid-cols-2 md:gap-14" data-revelar>
                <span className="absolute top-2 -left-[33px] size-4 rounded-full border-4 border-papel bg-amarelo ring-2 ring-amarelo sm:-left-[57px]" aria-hidden />
                <div className={i % 2 ? "md:order-2" : ""}>
                  <p className="font-mao text-2xl text-vermelho">{m.quando}</p>
                  <h2 className="mt-1 font-titulo text-2xl font-semibold text-verde sm:text-3xl">{m.titulo}</h2>
                  <p className="mt-3 text-lg leading-relaxed text-tinta sm:text-xl">{m.texto}</p>
                </div>
                <figure>
                  <Image src={m.foto.src} alt={m.foto.alt} width={m.foto.w} height={m.foto.h} priority={i === 0} className="aspect-[3/2] w-full rounded-[24px] object-cover" />
                  <figcaption className="mt-3 text-sm text-tinta-2">{m.foto.legenda}</figcaption>
                </figure>
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-20 max-w-2xl text-center" data-revelar>
            <div className="font-titulo text-2xl leading-snug font-semibold text-verde sm:text-3xl">
              {LEGADO.fecho.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </div>
        </section>

        {/* Missão, visão e valores. */}
        <section className="bg-creme py-24 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 md:grid-cols-3">
            <div data-revelar>
              <p className="font-mao text-3xl text-vermelho">Missão</p>
              <p className="mt-3 text-lg leading-relaxed">{SOBRE.missao}</p>
            </div>
            <div data-revelar style={atraso(90)}>
              <p className="font-mao text-3xl text-vermelho">Visão</p>
              <p className="mt-3 text-lg leading-relaxed">{SOBRE.visao}</p>
            </div>
            <div data-revelar style={atraso(180)}>
              <p className="font-mao text-3xl text-vermelho">Valores</p>
              <ul className="mt-3 space-y-2 text-lg leading-relaxed">
                {SOBRE.valores.map((v) => (
                  <li key={v} className="flex gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/natal/simbolos/estrela.svg" alt="" className="mt-1.5 size-4 shrink-0" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* A equipe e o convite. */}
        <section className="relative isolate overflow-clip">
          <Image src="/img/acao-equipe.webp" alt="Voluntários do Paz Kids em Ação reunidos na quadra" fill sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-verde-escuro/85 via-verde-escuro/50 to-transparent" />
          <div className="mx-auto flex min-h-[480px] max-w-7xl items-center px-4 py-24 sm:px-8">
            <div data-revelar>
              <p className="max-w-xl font-mao text-[clamp(2.6rem,6vw,4.6rem)] leading-none text-creme">E essa história continua.</p>
              <p className="mt-5 max-w-md text-lg text-creme/90">Agora, você também pode fazer parte dela.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {principal && (
                  <Link href={`/${principal.slug}`} className="btn bg-amarelo text-tinta hover:bg-amarelo/90">
                    Apadrinhe uma criança
                  </Link>
                )}
                <a href={SITE.whatsapp.voluntario} target="_blank" rel="noopener" className="btn btn-contorno-claro">
                  Quero ser voluntário
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Rodape variante="institucional" />
    </div>
  );
}
