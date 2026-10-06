import Image from "next/image";
import Link from "next/link";
import { IconeMaos, IconePix, IconeSacola, IconeSeta } from "@/components/site/icones";
import { Instagram } from "@/components/site/instagram";
import { JsonLd } from "@/components/site/json-ld";
import { Rodape } from "@/components/site/rodape";
import { Topo } from "@/components/site/topo";
import { CopyButton } from "@/components/ui/copy-button";
import { PERGUNTAS, SITE, SOBRE } from "@/content/site";
import { campanhasAtivas, progressoCampanhas } from "@/lib/campanhas";
import { formatIsoDate } from "@/lib/dates";
import { ldInicio } from "@/lib/seo";

export const dynamic = "force-dynamic";

const atraso = (ms: number) => ({ "--atraso": `${ms}ms` }) as React.CSSProperties;

export default async function Inicio() {
  const ativas = await campanhasAtivas();
  const progresso = await progressoCampanhas(ativas.map((c) => c.id));
  const principal = ativas[0];
  const p = principal ? (progresso.get(principal.id) ?? { total: 0, comPadrinho: 0 }) : null;

  return (
    <>
      <JsonLd dados={ldInicio()} />
      <Topo
        variante="institucional"
        sobreFoto
        links={[
          { href: "#quem-somos", label: "Quem somos" },
          { href: "#nossa-historia", label: "História" },
          { href: "#como-ajudar", label: "Como ajudar" },
          { href: "#perguntas", label: "Perguntas" },
        ]}
        cta={principal ? { href: `/${principal.slug}`, label: principal.nome } : { href: "#como-ajudar", label: "Quero ajudar" }}
      />

      {/* Topo: uma foto real de ação. */}
      <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-verde-escuro">
        <Image src="/img/acao-alegria.webp" alt="Crianças sentadas na quadra, rindo e erguendo os braços durante uma ação do Paz Kids em Ação em Heliópolis" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-verde-escuro via-verde-escuro/55 to-verde-escuro/10" />
        <div className="mx-auto w-full max-w-7xl px-4 pt-32 pb-16 sm:px-8 sm:pb-24">
          <p className="font-mao text-2xl text-amarelo sm:text-3xl">Heliópolis, São Paulo</p>
          <h1 className="mt-3 max-w-4xl text-[clamp(2.8rem,7.5vw,6.2rem)] leading-[0.95] font-bold text-creme">
            Alcançando além das <span className="pincelada">quatro paredes</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-creme/90 sm:text-xl">
            O Paz Kids em Ação leva o amor de Cristo, educação e cuidado para as crianças de Heliópolis e de outras comunidades da Grande São
            Paulo, lá onde elas estão.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={principal ? `/${principal.slug}` : "#como-ajudar"} className="btn btn-acao h-14 px-7 text-lg">
              {principal ? "Adote uma sacolinha de Natal" : "Quero ajudar"}
            </Link>
            <Link href="#quem-somos" className="btn btn-contorno-claro h-14 px-7 text-lg">
              Conheça o projeto
            </Link>
          </div>
        </div>
      </section>

      {/* Quem somos. */}
      <section id="quem-somos" className="relative scroll-mt-16 overflow-hidden bg-creme py-24 sm:py-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/natal/simbolos/forma-amarela.svg" alt="" className="forma -right-24 -bottom-28 w-[380px] sm:w-[460px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
          <div data-revelar>
            <p className="chamada text-vermelho">Quem somos</p>
            <p className="mt-5 font-titulo text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.12] font-semibold text-verde">
              O coração missionário do Paz Kids. A gente sai da igreja e vai para a <span className="pincelada">quadra</span>, a praça, a escola
              e a rua.
            </p>
            <p className="mt-6 max-w-xl text-lg text-tinta-2">
              {SOBRE.oQueE} Levamos a Palavra, brincadeira, lanche, abraço e recursos básicos para crianças da comunidade. É o Paz Kids,
              ministério infantil da Igreja da Paz, fora das quatro paredes.
            </p>
          </div>
          <figure className="relative" data-revelar style={atraso(120)}>
            <Image src="/img/acao-atencao.webp" alt="Crianças sentadas no chão prestando atenção numa ação do Paz Kids em Ação" width={1600} height={1067} className="rounded-[28px] object-cover" />
            <figcaption className="absolute -bottom-5 left-6 rounded-xl bg-verde px-4 py-2 font-mao text-xl text-amarelo">Ação em Heliópolis</figcaption>
          </figure>
        </div>
      </section>

      {/* O que fazemos: fotos reais, com legendas que só descrevem o que se vê. */}
      <section className="bg-papel py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="max-w-2xl" data-revelar>
            <p className="chamada text-vermelho">O que fazemos</p>
            <h2 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">A igreja onde as crianças estão</h2>
            <p className="mt-4 text-lg text-tinta-2">
              Projeto social e evangelismo infantil na comunidade: a igreja nas praças, nas quadras e nas escolas, com voluntários que conhecem as
              crianças pelo nome.
            </p>
          </div>
          <div className="mt-12 grid auto-rows-[170px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-4">
            <Foto src="/img/acao-oracao.webp" legenda="Orar juntos" className="col-span-2 row-span-2" posicao="object-[center_75%]" />
            <Foto src="/img/acao-pula-pula.webp" legenda="Brincar" />
            <Foto src="/img/acao-sorrisos.webp" legenda="Lanchar e conversar" />
            <Foto src="/img/acao-voluntarios-servindo.webp" legenda="Servir" className="col-span-2" />
            <Foto src="/img/acao-quadra.webp" legenda="Ocupar a quadra" className="col-span-2" />
            <Foto src="/img/acao-maos.webp" legenda="Cuidar de perto" />
            <Foto src="/img/acao-colete.webp" legenda="Brincar junto" />
          </div>
        </div>
      </section>

      {/* História. */}
      <section id="nossa-historia" className="relative scroll-mt-16 overflow-hidden bg-verde py-24 text-creme sm:py-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/natal/simbolos/forma-vermelha.svg" alt="" className="forma -top-32 -left-28 w-[340px]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-8 lg:grid-cols-2">
          <div data-revelar>
            <p className="chamada text-amarelo">Nossa história</p>
            <h2 className="mt-3 text-4xl leading-tight font-bold sm:text-5xl">De um projeto de evangelismo a uma comunidade inteira</h2>
            <ol className="mt-12 space-y-10 border-l-2 border-dashed border-creme/25 pl-8">
              {SOBRE.historia.map((h) => (
                <li key={h.titulo} className="relative">
                  <span className="absolute top-1.5 -left-[42px] size-4 rounded-full border-4 border-verde bg-amarelo" />
                  <p className="font-mao text-2xl text-amarelo">{h.quando}</p>
                  <p className="mt-1 font-titulo text-2xl font-semibold">{h.titulo}</p>
                  <p className="mt-2 max-w-md text-creme/80">{h.texto}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center" data-revelar style={atraso(120)}>
            <Image src="/img/acao-dupla.webp" alt="Dois voluntários do Paz Kids com colete roxo sorrindo" width={1200} height={800} className="col-span-2 aspect-[16/10] rounded-[24px] object-cover" />
            <Image src="/img/acao-roda.webp" alt="Crianças reunidas numa ação do Paz Kids em Ação" width={1200} height={800} className="aspect-square rounded-[24px] object-cover" />
            <Image src="/img/acao-voluntarios-servindo.webp" alt="Voluntários servindo lanche para as crianças na quadra" width={1400} height={933} className="aspect-square rounded-[24px] object-cover" />
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

      {/* Campanha aberta, já na marca dela. */}
      {principal && p && (
        <section className="relative overflow-hidden bg-verde-escuro text-creme">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/natal/simbolos/forma-amarela-2.svg" alt="" className="forma -right-36 -bottom-40 w-[420px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
            <div data-revelar>
              <Image src="/natal/logo/paz-kids-horizontal-negativa-colorida-sem-fundo.svg" alt="Paz Kids em Ação · Campanha de Natal" width={260} height={86} className="h-16 w-auto" />
              <h2 className="mt-8 text-4xl leading-tight font-bold sm:text-5xl">
                Mais que presentes, é <span className="pincelada">esperança</span>
              </h2>
              <p className="mt-5 max-w-lg text-lg text-creme/85">
                {principal.nome}: escolha uma criança e monte a sacolinha com roupa, calçado e um presente, ou doe online e a equipe monta por você.
              </p>
              {p.total > 0 && (
                <div className="mt-8 max-w-md">
                  <div className="h-3 overflow-hidden rounded-full bg-creme/15">
                    <div className="h-full rounded-full bg-amarelo" style={{ width: `${(p.comPadrinho / p.total) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-creme/80">
                    <strong className="font-titulo text-2xl text-amarelo">{p.comPadrinho}</strong> de {p.total} crianças já têm padrinho
                    {principal.prazoEntrega && ` · até ${formatIsoDate(principal.prazoEntrega)}`}
                  </p>
                </div>
              )}
              <Link href={`/${principal.slug}`} className="btn btn-acao mt-9 h-14 px-7 text-lg">
                Escolher uma criança <IconeSeta className="size-5" />
              </Link>
            </div>
            <div data-revelar style={atraso(120)}>
              <Image src="/img/ia-menino-sacolinha-marca.webp" alt="Menino sorrindo com uma sacolinha kraft da campanha de Natal" width={1400} height={933} className="rounded-[28px] object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* Como ajudar. */}
      <section id="como-ajudar" className="scroll-mt-16 bg-papel py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="max-w-2xl" data-revelar>
            <p className="chamada text-vermelho">Como ajudar</p>
            <h2 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">Tem um jeito para você fazer parte</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <Ajuda
              icone={<IconeSacola className="size-7" />}
              titulo="Apadrinhe uma criança"
              texto="Nas campanhas, você conhece a criança pelo nome e pelos tamanhos e monta um presente pensado só para ela."
              acao={
                principal ? (
                  <Link href={`/${principal.slug}`} className="btn btn-acao">
                    Ver as crianças
                  </Link>
                ) : (
                  <span className="text-tinta-2">A próxima campanha abre em breve.</span>
                )
              }
            />
            <Ajuda
              icone={<IconePix className="size-7" />}
              titulo="Doe qualquer valor"
              texto={`Pix ${SITE.pix.tipo} ${SITE.pix.chave}. A doação vira lanche, material e presente para as crianças.`}
              acao={<CopyButton value={SITE.pix.copiar} label="Copiar chave Pix" className="btn btn-primario" />}
            />
            <Ajuda
              icone={<IconeMaos className="size-7" />}
              titulo="Seja voluntário"
              texto="Escreva para a equipe e conte como você quer servir nas próximas ações."
              acao={
                <a href={`mailto:${SITE.email}?subject=Quero%20ser%20volunt%C3%A1rio`} className="btn btn-claro">
                  Quero ser voluntário
                </a>
              }
            />
          </div>
        </div>
      </section>

      {/* A equipe. */}
      <section className="relative isolate overflow-hidden">
        <Image src="/img/acao-equipe.webp" alt="Voluntários do Paz Kids em Ação reunidos na quadra" fill sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-verde-escuro/85 via-verde-escuro/50 to-transparent" />
        <div className="mx-auto flex min-h-[480px] max-w-7xl items-center px-4 py-24 sm:px-8">
          <div data-revelar>
            <p className="max-w-xl font-mao text-[clamp(2.6rem,6vw,4.6rem)] leading-none text-creme">Juntos fazemos a diferença.</p>
            <p className="mt-5 max-w-md text-lg text-creme/90">Gente da igreja e da comunidade, de colete, servindo as crianças de Heliópolis.</p>
          </div>
        </div>
      </section>

      <Instagram />

      {/* Perguntas frequentes: também vão para o Google e as IAs como FAQPage. */}
      <section id="perguntas" className="scroll-mt-16 bg-creme py-24 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
          <div data-revelar>
            <p className="chamada text-vermelho">Perguntas frequentes</p>
            <h2 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">Quer saber mais?</h2>
            <p className="mt-4 text-lg text-tinta-2">
              Escreva para{" "}
              <a href={`mailto:${SITE.email}`} className="font-bold text-verde underline decoration-amarelo decoration-2 underline-offset-4">
                {SITE.email}
              </a>
              .
            </p>
          </div>
          <div className="divide-y divide-linha border-y border-linha">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-titulo text-xl font-semibold text-verde">
                  {q.p}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-xl text-vermelho transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-lg text-tinta-2">{q.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Rodape variante="institucional" />
    </>
  );
}

function Foto({ src, legenda, className = "", posicao = "" }: { src: string; legenda: string; className?: string; posicao?: string }) {
  return (
    <figure className={`group relative overflow-hidden rounded-2xl bg-creme ${className}`} data-revelar>
      <Image src={src} alt={`${legenda}: ação do Paz Kids em Ação em Heliópolis`} fill sizes="(min-width: 768px) 50vw, 100vw" className={`object-cover transition-transform duration-700 group-hover:scale-[1.04] ${posicao}`} />
      <figcaption className="absolute bottom-3 left-3 rounded-lg bg-creme px-3 py-1 font-mao text-lg text-verde">{legenda}</figcaption>
    </figure>
  );
}

function Ajuda({ icone, titulo, texto, acao }: { icone: React.ReactNode; titulo: string; texto: string; acao: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-[24px] bg-white p-8 shadow-[0_1px_0_var(--color-linha)]" data-revelar>
      <span className="grid size-14 place-items-center rounded-2xl bg-creme text-verde">{icone}</span>
      <h3 className="mt-6 text-2xl font-bold text-verde">{titulo}</h3>
      <p className="mt-3 flex-1 text-lg text-tinta-2">{texto}</p>
      <div className="mt-7">{acao}</div>
    </div>
  );
}
