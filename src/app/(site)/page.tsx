import Image from "next/image";
import Link from "next/link";
import { FaixaCores } from "@/components/site/faixa-cores";
import { CopyButton } from "@/components/ui/copy-button";
import { SITE, SOBRE } from "@/content/site";
import { campanhasAtivas, progressoCampanhas } from "@/lib/campanhas";
import { formatIsoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const ativas = await campanhasAtivas();
  const progresso = await progressoCampanhas(ativas.map((c) => c.id));
  const principal = ativas[0];

  return (
    <>
      <section className="bg-creme">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-20 pb-14 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-24">
          <div>
            <p className="chamada">{SITE.igreja}</p>
            <h1 className="mt-4 text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.02] font-semibold">
              Alcançando além das <span className="text-roxo">quatro paredes</span>
            </h1>
            <p className="mt-3 font-mao text-[1.75rem] leading-tight text-rosa">o coração missionário do Paz Kids</p>
            <p className="mt-5 max-w-lg text-lg text-tinta-2">
              Levando amor, esperança e transformação para crianças e comunidades através do evangelismo e da educação.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {principal ? (
                <Link href={`/${principal.slug}`} className="btn btn-primario h-12 px-6">
                  {principal.nome}: escolha uma criança
                </Link>
              ) : (
                <a href={SITE.redes[0].url} target="_blank" rel="noopener" className="btn btn-primario h-12 px-6">
                  Acompanhe no Instagram
                </a>
              )}
              <Link href="#quem-somos" className="btn btn-claro h-12 px-6">
                Quem somos
              </Link>
            </div>
          </div>
          <Image
            src="/brand/pazkids-em-acao-480.webp"
            alt="Logo do Paz Kids em Ação: um menino voando com balões coloridos"
            width={480}
            height={572}
            priority
            className="mx-auto w-64 -rotate-3 drop-shadow-[0_6px_0_rgba(27,22,51,0.12)] sm:w-80 md:w-96"
          />
        </div>
        <FaixaCores />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="chamada">Campanhas</p>
        <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Como você pode ajudar agora</h2>
        {ativas.length === 0 ? (
          <p className="mt-6 max-w-xl text-tinta-2">
            Nenhuma campanha aberta neste momento. As próximas são anunciadas no Instagram{" "}
            <a href={SITE.redes[0].url} className="font-semibold text-roxo hover:underline" target="_blank" rel="noopener">
              {SITE.redes[0].usuario}
            </a>
            .
          </p>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {ativas.map((c) => {
              const p = progresso.get(c.id) ?? { total: 0, comPadrinho: 0 };
              return (
                <Link key={c.id} href={`/${c.slug}`} className="group cartao block p-6 transition-transform hover:-translate-y-0.5">
                  <h3 className="text-2xl font-semibold group-hover:text-roxo">{c.nome}</h3>
                  {c.descricao && <p className="mt-2 line-clamp-3 text-tinta-2">{c.descricao}</p>}
                  {p.total > 0 && (
                    <>
                      <div className="mt-5 h-3 overflow-hidden rounded-full bg-creme">
                        <div className="h-full rounded-full bg-verde" style={{ width: `${(p.comPadrinho / p.total) * 100}%` }} />
                      </div>
                      <p className="mt-2 text-sm text-tinta-2">
                        <strong className="text-tinta">{p.comPadrinho}</strong> de {p.total} crianças já têm padrinho
                        {c.prazoEntrega && ` · até ${formatIsoDate(c.prazoEntrega)}`}
                      </p>
                    </>
                  )}
                  <span className="mt-5 inline-block font-titulo font-semibold text-roxo">Ver as crianças →</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section id="quem-somos" className="scroll-mt-20 border-y border-linha bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <p className="chamada">Quem somos</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">O amor de Cristo fora da igreja</h2>
            <p className="mt-4 text-lg text-tinta-2">{SOBRE.oQueE}</p>
          </div>
          <ol className="relative space-y-8 border-l-2 border-dashed border-linha pl-8">
            <li>
              <span className="absolute -left-[9px] mt-1.5 size-4 rounded-full border-2 border-white bg-verde" />
              <p className="font-mao text-2xl text-verde">julho de 2022</p>
              <p className="mt-1 text-tinta-2">{SOBRE.historia[0]}</p>
            </li>
            <li>
              <span className="absolute -left-[9px] mt-1.5 size-4 rounded-full border-2 border-white bg-azul" />
              <p className="font-mao text-2xl text-azul">hoje</p>
              <p className="mt-1 text-tinta-2">{SOBRE.historia[1]}</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="cartao border-t-4 border-t-verde p-6">
            <h3 className="text-xl font-semibold">Missão</h3>
            <p className="mt-2 text-tinta-2">{SOBRE.missao}</p>
          </div>
          <div className="cartao border-t-4 border-t-azul p-6">
            <h3 className="text-xl font-semibold">Visão</h3>
            <p className="mt-2 text-tinta-2">{SOBRE.visao}</p>
          </div>
          <div className="cartao border-t-4 border-t-rosa p-6">
            <h3 className="text-xl font-semibold">Valores</h3>
            <ul className="mt-2 space-y-1.5 text-tinta-2">
              {SOBRE.valores.map((v) => (
                <li key={v}>· {v}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="doe" className="scroll-mt-20 bg-ceu">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-6">
          <div>
            <p className="chamada">Doe qualquer valor</p>
            <h2 className="mt-2 text-3xl font-semibold">Pix para o Paz Kids em Ação</h2>
            <p className="mt-2 text-lg">
              {SITE.pix.tipo} <strong className="font-titulo text-2xl tracking-wide">{SITE.pix.chave}</strong>
            </p>
          </div>
          <CopyButton value={SITE.pix.copiar} label="Copiar chave Pix" className="btn btn-primario h-12 px-6" />
        </div>
      </section>
    </>
  );
}
