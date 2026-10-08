import Image from "next/image";
import Link from "next/link";
import { IconeMaos, IconePix, IconeSacola, IconeSeta } from "@/components/site/icones";
import { Instagram } from "@/components/site/instagram";
import { JsonLd } from "@/components/site/json-ld";
import { Rodape } from "@/components/site/rodape";
import { Topo } from "@/components/site/topo";
import { CopyButton } from "@/components/ui/copy-button";
import { LEGADO, PERGUNTAS, SITE } from "@/content/site";
import { encontrosAtivos } from "@/lib/agenda";
import { corDoDia } from "@/lib/agenda-cores";
import { campanhasAtivas, progressoCampanhas } from "@/lib/campanhas";
import { formatIsoDate } from "@/lib/dates";
import { ldInicio } from "@/lib/seo";

export const dynamic = "force-dynamic";

const atraso = (ms: number) => ({ "--atraso": `${ms}ms` }) as React.CSSProperties;

export default async function Inicio() {
  const [ativas, agenda] = await Promise.all([campanhasAtivas(), encontrosAtivos()]);
  const progresso = await progressoCampanhas(ativas.map((c) => c.id));
  const principal = ativas[0];
  const p = principal ? (progresso.get(principal.id) ?? { total: 0, comPadrinho: 0 }) : null;

  return (
    <div className="tema-paz">
      <JsonLd dados={ldInicio()} />
      <Topo
        variante="institucional"
        fundoClaro
        logoDepoisDe="logo-topo"
        links={[
          { href: "#quem-somos", label: "Quem somos" },
          { href: "/agenda", label: "Agenda" },
          { href: "/historia", label: "História" },
          { href: "#como-ajudar", label: "Como ajudar" },
          { href: "#perguntas", label: "Perguntas" },
        ]}
        cta={principal ? { href: `/${principal.slug}`, label: principal.nome } : { href: "#como-ajudar", label: "Quero ajudar" }}
      />

      {/* Topo: o amarelo do Paz Kids e uma foto real de ação. */}
      <section className="relative overflow-clip bg-amarelo pt-[72px]" style={{ "--cor-pincelada": "#ffffff" } as React.CSSProperties}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            {/* A marca em destaque: o logo do cabeçalho só aparece quando este sai da tela. */}
            <Image
              id="logo-topo"
              src="/brand/pazkids-em-acao-480.webp"
              alt="Paz Kids em Ação"
              width={480}
              height={572}
              priority
              className="h-44 w-auto drop-shadow-[0_5px_0_rgba(27,22,51,0.18)] sm:h-56"
            />
            <p className="mt-6 font-mao text-2xl text-verde sm:text-3xl">Heliópolis, São Paulo</p>
            <h1 className="mt-2 text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] font-bold text-verde">
              Alcançando além das <span className="pincelada">quatro paredes</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-verde/85 sm:text-xl">
              O Paz Kids em Ação leva o amor de Cristo, educação e cuidado para as crianças de Heliópolis e de outras comunidades da Grande São
              Paulo, lá onde elas estão.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={principal ? `/${principal.slug}` : "#como-ajudar"} className="btn btn-acao h-14 px-7 text-lg">
                {principal ? "Apadrinhe uma criança no Natal" : "Quero ajudar"}
              </Link>
              <Link href="#quem-somos" className="btn h-14 border-2 border-verde/25 px-7 text-lg text-verde hover:border-verde">
                Conheça o projeto
              </Link>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/img/acao-alegria.webp"
              alt="Crianças sentadas na quadra, rindo e erguendo os braços durante uma ação do Paz Kids em Ação em Heliópolis"
              width={1800}
              height={1200}
              priority
              className="aspect-[4/3] w-full rounded-[32px] object-cover shadow-[0_8px_0_var(--color-verde)]"
            />
          </div>
        </div>
      </section>

      {/* Campanha aberta, já na marca dela. */}
      {principal && p && (
        <section className="tema-natal relative overflow-clip bg-verde-escuro text-creme">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/natal/simbolos/forma-amarela-2.svg" alt="" className="forma -right-36 -bottom-40 w-[420px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
            <div data-revelar>
              <Image src="/natal/logo/paz-kids-horizontal-negativa-colorida-sem-fundo.svg" alt="Paz Kids em Ação · Campanha de Natal" width={260} height={86} className="h-16 w-auto" />
              <h2 className="mt-8 text-4xl leading-tight font-bold sm:text-5xl">
                Mais que presentes, é <span className="pincelada">esperança</span>
              </h2>
              <p className="mt-5 max-w-lg text-lg text-creme/85">
                {principal.nome}: escolha uma criança e monte a sacolinha com roupa, calçado e um presente, ou doe online e a gente monta pra você.
              </p>
              {p.total > 0 && (
                <div className="mt-8 max-w-md">
                  <div className="h-3 overflow-clip rounded-full bg-creme/15">
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
              <Image src="/img/acampa-danca.webp" alt="Menina de jaqueta rosa dançando com outras crianças e voluntários no AcampaKids" width={1600} height={1067} className="rounded-[28px] object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* Quem somos: o que o projeto faz, contado pelas fotos reais das ações. */}
      <section id="quem-somos" className="scroll-mt-16 bg-papel py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="max-w-3xl" data-revelar>
            <p className="chamada text-vermelho">Quem somos</p>
            <h2 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">
              A igreja onde as crianças <span className="pincelada">estão</span>
            </h2>
            <p className="mt-5 text-lg text-tinta-2 sm:text-xl">
              O Paz Kids em Ação é o coração missionário do Paz Kids, o ministério infantil da Paz Church. A gente sai da igreja e vai para a quadra,
              a praça, a escola e a rua, com a Palavra, brincadeira, lanche e abraço, e com voluntários que conhecem as crianças pelo nome.
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

      {/* Agenda semanal em resumo: o mapa e as rotas ficam em /agenda, o link da bio. */}
      {agenda.length > 0 && (
        <section id="agenda" className="scroll-mt-16 bg-creme py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6" data-revelar>
              <div className="max-w-2xl">
                <p className="chamada text-vermelho">Agenda semanal</p>
                <h2 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">
                  Onde a gente está <span className="pincelada">toda semana</span>
                </h2>
              </div>
              <Link href="/agenda" className="btn btn-primario">
                Ver no mapa e como chegar <IconeSeta className="size-5" />
              </Link>
            </div>
            <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4" data-revelar>
              {[...new Set(agenda.map((e) => e.dia))].map((dia) => (
                <div key={dia} className="border-t-4 pt-4" style={{ borderColor: corDoDia(dia) }}>
                  <p className="chamada" style={{ color: corDoDia(dia) }}>
                    {dia}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {agenda
                      .filter((e) => e.dia === dia)
                      .map((e) => (
                        <li key={`${e.hora}${e.nome}`} className="leading-snug">
                          <span className="font-titulo font-semibold text-verde tabular-nums">{e.hora}</span> <span className="text-tinta">{e.nome}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* O legado em resumo; a história inteira, capítulo por capítulo, fica em /historia. */}
      <section id="legado" className="scroll-mt-16 bg-papel py-24 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div data-revelar>
            <div className="flex items-end gap-5">
              <p className="font-titulo text-[clamp(5rem,11vw,8rem)] leading-[0.85] font-bold text-verde">50</p>
              <div className="pb-1">
                <p className="font-titulo text-xl font-semibold text-verde">anos de Paz Church</p>
                <p className="text-tinta-2">1976 · 2026</p>
              </div>
            </div>
            <h2 className="mt-8 text-4xl leading-tight font-bold text-verde sm:text-5xl">{LEGADO.titulo}</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-tinta-2">{LEGADO.resumo}</p>
            <Link href="/historia" className="btn btn-claro mt-8">
              Conheça a nossa história <IconeSeta className="size-5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3" data-revelar style={atraso(120)}>
            {LEGADO.marcos.slice(0, 4).map((c) => (
              <Image key={c.foto.src} src={c.foto.src} alt={c.foto.alt} width={c.foto.w} height={c.foto.h} className="aspect-[4/3] w-full rounded-[20px] object-cover" />
            ))}
          </div>
        </div>
      </section>

      {/* Como ajudar. */}
      <section id="como-ajudar" className="scroll-mt-16 bg-creme py-24 sm:py-28">
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
              texto={`Chave Pix: ${SITE.pix.chave} (favorecido: ${SITE.pix.favorecido}). A doação vira lanche, material e presente para as crianças.`}
              acao={<CopyButton value={SITE.pix.copiar} label="Copiar chave Pix" className="btn btn-primario" />}
            />
            <Ajuda
              icone={<IconeMaos className="size-7" />}
              titulo="Seja voluntário"
              texto="Chame a gente no WhatsApp e conte como você quer servir nas próximas ações."
              acao={
                <a href={SITE.whatsapp.voluntario} target="_blank" rel="noopener" className="btn btn-claro">
                  Quero ser voluntário
                </a>
              }
            />
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
              Chame a gente no WhatsApp{" "}
              <a href={SITE.whatsapp.link} target="_blank" rel="noopener" className="font-bold text-verde underline decoration-amarelo decoration-2 underline-offset-4">
                {SITE.whatsapp.numero}
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
    </div>
  );
}

function Foto({ src, legenda, className = "", posicao = "" }: { src: string; legenda: string; className?: string; posicao?: string }) {
  return (
    <figure className={`group relative overflow-clip rounded-2xl bg-creme ${className}`} data-revelar>
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
