import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { GradeCriancas, type CriancaCard } from "@/components/site/grade-criancas";
import { JsonLd } from "@/components/site/json-ld";
import { IconeCalendario, IconeCartao, IconeCrianca, IconeLocal, IconePresente, IconeSacola, IconeSeta } from "@/components/site/icones";
import { Rodape } from "@/components/site/rodape";
import { Topo } from "@/components/site/topo";
import { CopyButton } from "@/components/ui/copy-button";
import { SITE } from "@/content/site";
import { campanhaAberta, campanhaPorSlug, criancasDaCampanha, itensSacolinha, progressoCampanhas } from "@/lib/campanhas";
import { fraseSonho, historiaCrianca, idade, idadeTexto, nomePublico } from "@/lib/criancas";
import { formatIsoDate } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { imagemPublica } from "@/lib/imagem-publica";
import { formatBRL } from "@/lib/money";
import { pagamentoOnlineDisponivel } from "@/lib/pagamento";
import { liberarExpiradas } from "@/lib/reservas";
import { ldCampanha } from "@/lib/seo";

export const dynamic = "force-dynamic";

const atraso = (ms: number) => ({ "--atraso": `${ms}ms` }) as React.CSSProperties;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await campanhaPorSlug((await params).slug);
  if (!c || c.status === "rascunho") return {};
  const descricao = `${c.nome} do Paz Kids em Ação em Heliópolis, São Paulo: escolha uma criança e monte uma sacolinha com roupa, calçado e presente, ou doe online.`;
  return {
    title: `${c.nome} · Apadrinhe uma criança`,
    description: descricao,
    alternates: { canonical: `/${c.slug}` },
    openGraph: { title: `${c.nome} · Paz Kids em Ação`, description: descricao, images: [{ url: "/natal/og-natal.jpg", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: ["/natal/og-natal.jpg"] },
  };
}

export default async function CampanhaPage({ params }: { params: Promise<{ slug: string }> }) {
  const campanha = await campanhaPorSlug((await params).slug);
  if (!campanha || campanha.status === "rascunho") notFound();
  const aberta = campanhaAberta(campanha);

  await liberarExpiradas();
  const [lista, progresso, pontos] = await Promise.all([
    criancasDaCampanha(campanha.id),
    progressoCampanhas([campanha.id]),
    getDb().select().from(schema.pontosColeta).where(eq(schema.pontosColeta.ativo, true)).orderBy(asc(schema.pontosColeta.nome)),
  ]);
  const p = progresso.get(campanha.id) ?? { total: 0, comPadrinho: 0 };
  const itens = itensSacolinha(campanha.itensSacolinha);
  const online = Boolean(campanha.valorSacolinha && pagamentoOnlineDisponivel());
  const balcao = Boolean(campanha.prazoEntrega && pontos.length);
  const prazo = campanha.prazoEntrega ? formatIsoDate(campanha.prazoEntrega) : null;
  const pct = p.total ? Math.round((p.comPadrinho / p.total) * 100) : 0;

  const cards: CriancaCard[] = lista.map((c) => ({
    id: c.id,
    nome: nomePublico(c),
    idade: idade(c.dataNascimento),
    idadeTexto: idadeTexto(c.dataNascimento),
    sonho: fraseSonho(c.sonho),
    historiaPropria: !!c.sobre?.trim(),
    historia: historiaCrianca({ nome: nomePublico(c), idadeTexto: idadeTexto(c.dataNascimento), gostos: c.gostos, sugestao: c.sugestaoPresente, sobre: c.sobre }),
    sexo: c.sexo,
    camiseta: c.tamanhoCamiseta,
    calca: c.tamanhoCalca,
    calcado: c.tamanhoCalcado,
    sugestao: c.sugestaoPresente,
    gostos: c.gostos,
    imagem: imagemPublica(c.id, c.versaoImagem),
  }));

  return (
    <div id="topo">
      <JsonLd dados={ldCampanha(campanha, lista.length)} />
      <Topo
        variante="campanha"
        logoDepoisDe="logo-topo"
        links={[
          { href: "#como-funciona", label: "Como funciona" },
          { href: "#criancas", label: "Crianças" },
          ...(balcao ? [{ href: "#onde-entregar", label: "Onde entregar" }] : []),
          { href: "/", label: "Sobre o projeto" },
        ]}
        cta={aberta && lista.length ? { href: "#criancas", label: "Escolher criança" } : null}
      />

      {/* Topo da campanha: fundo creme, formas saindo das bordas, uma palavra com pincelada. */}
      <section className="relative overflow-clip bg-creme pt-[72px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/natal/simbolos/forma-vermelha.svg" alt="" className="forma -top-24 -right-32 w-[360px] sm:w-[520px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/natal/simbolos/forma-amarela-2.svg" alt="" className="forma -bottom-40 -left-40 w-[380px] sm:w-[480px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            {/* A marca em destaque: o logo do cabeçalho só aparece quando este sai da tela. */}
            <Image
              id="logo-topo"
              src="/natal/logo/paz-kids-vertical-colorida.svg"
              alt="Paz Kids em Ação · Campanha de Natal"
              width={367}
              height={456}
              priority
              className="h-48 w-auto sm:h-60"
            />
            <h1 className="mt-8 text-[clamp(2.4rem,5.2vw,4.4rem)] leading-[0.98] font-bold text-verde">
              Mais que presentes, é <span className="pincelada">esperança</span>.
            </h1>
            <p className="mt-5 font-mao text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight text-vermelho">Apadrinhe uma criança!</p>
            {campanha.descricao && <p className="mt-5 max-w-xl text-lg whitespace-pre-line text-tinta-2">{campanha.descricao}</p>}

            {p.total > 0 && (
              <div className="mt-8 max-w-lg rounded-2xl bg-white/80 p-5 backdrop-blur">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-titulo text-xl font-semibold text-verde">
                    <span className="text-3xl">{p.comPadrinho}</span> de {p.total} crianças com padrinho
                  </p>
                  <p className="font-titulo text-xl font-bold text-vermelho">{pct}%</p>
                </div>
                <div className="mt-3 h-3.5 overflow-clip rounded-full bg-creme">
                  <div className="h-full rounded-full bg-verde" style={{ width: `${pct}%` }} />
                </div>
                {aberta && lista.length > 0 && (
                  <p className="mt-2 text-sm text-tinta-2">
                    Faltam {lista.length} {lista.length === 1 ? "criança" : "crianças"}
                    {prazo && ` · entregas até ${prazo}`}
                  </p>
                )}
              </div>
            )}

            {aberta ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#criancas" className="btn btn-acao h-14 px-7 text-lg">
                  Escolher uma criança <IconeSeta className="size-5" />
                </Link>
                <Link href="#como-funciona" className="btn btn-claro h-14 px-7 text-lg">
                  Como funciona
                </Link>
              </div>
            ) : (
              <div className="mt-8 max-w-lg rounded-2xl bg-verde p-6 text-creme">
                <p className="chamada text-amarelo">Campanha encerrada</p>
                <p className="mt-2 font-titulo text-2xl font-semibold">
                  {p.comPadrinho > 0
                    ? `Neste Natal, ${p.comPadrinho} ${p.comPadrinho === 1 ? "criança ganhou" : "crianças ganharam"} uma sacolinha. Obrigado a cada padrinho!`
                    : "Obrigado a todos que ajudaram!"}
                </p>
                <Link href="/" className="btn btn-acao mt-5">
                  Conheça o Paz Kids em Ação
                </Link>
              </div>
            )}
          </div>

          <div className="relative">
            <Image
              src="/img/ia-menino-sacolinha-marca.webp"
              alt="Menino sorrindo segurando uma sacolinha kraft com laço vermelho e a marca da campanha"
              width={1400}
              height={933}
              priority
              className="aspect-[4/5] w-full rounded-[32px] object-cover object-[60%_center] sm:aspect-[5/5]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/natal/simbolos/estrela.svg" alt="" className="absolute -top-6 -left-4 size-14" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/natal/simbolos/brilho.svg" alt="" className="absolute top-10 -left-9 size-8" />
          </div>
        </div>
      </section>

      {/* Como funciona. */}
      {aberta && (
        <section id="como-funciona" className="scroll-mt-20 bg-papel py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="max-w-2xl" data-revelar>
              <p className="chamada text-vermelho">Como funciona</p>
              <h2 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">Três passos para mudar o Natal de alguém</h2>
            </div>
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              <Passo n={1} icone={<IconeCrianca className="size-8" />} titulo="Escolha uma criança" atrasoMs={0}>
                Conheça as crianças pelo nome, idade e tamanhos. Dá para escolher mais de uma e finalizar tudo de uma vez.
              </Passo>
              <Passo n={2} icone={<IconeSacola className="size-8" />} titulo="Monte ou doe a sacolinha" atrasoMs={90}>
                {online && balcao
                  ? `Monte você mesmo, ou doe ${formatBRL(campanha.valorSacolinha)} por criança e a gente monta pra você.`
                  : online
                    ? `Doe ${formatBRL(campanha.valorSacolinha)} por criança, no Pix ou no cartão. A gente monta pra você.`
                    : "Compre os itens da lista pensando na criança que você escolheu."}
              </Passo>
              <Passo n={3} icone={<IconePresente className="size-8" />} titulo={balcao ? "Entregue no Paz Kids" : "Pronto, é Natal!"} atrasoMs={180}>
                {balcao
                  ? `Leve até ${prazo} num ponto de coleta. Até lá a criança fica reservada com o seu nome.`
                  : "Assim que o pagamento confirma, a criança fica com o seu nome e você recebe um e-mail."}
              </Passo>
            </ol>
          </div>
        </section>
      )}

      {/* A sacolinha. */}
      {itens.length > 0 && aberta && (
        <section className="relative overflow-clip bg-verde text-creme">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/natal/simbolos/forma-amarela.svg" alt="" className="forma -top-48 -right-40 w-[440px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-8 sm:py-24 lg:grid-cols-2">
            <div data-revelar>
              <Image src="/img/ia-itens-sacolinha.webp" alt="Itens da sacolinha sobre a mesa: camiseta, calça jeans, tênis, presente com laço e sacola kraft" width={1400} height={933} className="rounded-[28px] object-cover" />
            </div>
            <div data-revelar style={atraso(120)}>
              <p className="chamada text-amarelo">A sacolinha</p>
              <h2 className="mt-3 text-4xl leading-tight font-bold sm:text-5xl">O que vai dentro</h2>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {itens.map((i) => (
                  <li key={i} className="flex items-center gap-3 rounded-2xl bg-creme/10 px-5 py-4 font-titulo text-xl font-semibold">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/natal/simbolos/estrela.svg" alt="" className="size-5 shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
              <p className="mt-6 font-mao text-2xl text-amarelo">Doe amor, compartilhe esperança!</p>
            </div>
          </div>
        </section>
      )}

      {/* Da sua casa: as duas formas de participar, logo antes da lista, com o caminho até ela. */}
      {aberta && (online || balcao) && (
        <section className="bg-papel py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="max-w-2xl" data-revelar>
              <p className="chamada text-vermelho">Do seu jeito</p>
              <h2 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">
                Você sabia que, mesmo da sua casa, pode fazer parte <span className="pincelada">dessa missão</span>?
              </h2>
              <p className="mt-4 text-lg text-tinta-2">Você escolhe a criança e decide como quer participar. O resto, a gente faz junto.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {balcao && (
                <Forma
                  icone={<IconeSacola className="size-8" />}
                  titulo="Montar e entregar"
                  texto={`Você compra os itens, monta a sacolinha com carinho e entrega na recepção do Paz Kids até ${prazo}.`}
                />
              )}
              {online && (
                <Forma
                  icone={<IconeCartao className="size-8" />}
                  titulo={`Doar online · ${formatBRL(campanha.valorSacolinha)}`}
                  texto={`Pix ou cartão${campanha.maxParcelas > 1 ? ` em até ${campanha.maxParcelas}x` : ""}. A gente compra e monta a sacolinha da criança que você escolheu, com o mesmo carinho que você teria.`}
                />
              )}
            </div>
            <a href="#criancas" className="btn btn-acao mt-10">
              Escolher uma criança
            </a>
          </div>
        </section>
      )}

      {/* As crianças. Encerrada a campanha, a lista sai: o agradecimento fica no topo. */}
      {aberta && (
      <section id="criancas" className="relative scroll-mt-20 overflow-clip bg-creme py-20 pb-36 sm:py-28 sm:pb-40">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
          <div className="max-w-2xl">
            <p className="chamada text-vermelho">Esperando um padrinho</p>
            <h2 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">
              Escolha quem você vai <span className="pincelada">presentear</span>
            </h2>
            <p className="mt-4 text-lg text-tinta-2">Cada etiqueta é uma criança de verdade, esperando o Natal.</p>
          </div>
          {lista.length === 0 ? (
              <p className="mt-8 max-w-xl text-lg text-tinta-2">
                {p.total > 0
                  ? "Todas as crianças desta campanha já têm padrinho. Obrigado! Você ainda pode ajudar com qualquer valor pelo Pix."
                  : "As crianças desta campanha ainda estão sendo cadastradas. Volte em breve."}
              </p>
            ) : (
              <div className="mt-10">
                <GradeCriancas slug={campanha.slug} criancas={cards} aberta={online || balcao} />
                {!(online || balcao) && <p className="mt-8 text-lg text-tinta-2">As inscrições de padrinhos abrem em breve.</p>}
              </div>
            )}
        </div>
      </section>
      )}

      {/* Onde entregar. */}
      {aberta && balcao && (
        <section id="onde-entregar" className="scroll-mt-20 bg-creme py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
            <div data-revelar>
              <p className="chamada text-vermelho">Pontos de coleta</p>
              <h2 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">Onde entregar</h2>
              <p className="mt-5 flex items-center gap-3 text-lg">
                <span className="grid size-11 place-items-center rounded-xl bg-white text-verde">
                  <IconeCalendario className="size-6" />
                </span>
                <span>
                  Até <strong className="text-verde">{prazo}</strong>
                </span>
              </p>
              <p className="mt-4 text-tinta-2">Na sacola, escreva o nome da criança e o número do seu pedido.</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {pontos.map((pt, i) => (
                <li key={pt.id} className="rounded-[24px] bg-white p-6" data-revelar style={atraso(i * 80)}>
                  <span className="grid size-11 place-items-center rounded-xl bg-creme text-verde">
                    <IconeLocal className="size-6" />
                  </span>
                  <p className="mt-4 font-titulo text-xl font-semibold text-verde">{pt.nome}</p>
                  {pt.endereco && <p className="mt-1 whitespace-pre-line text-tinta-2">{pt.endereco}</p>}
                  {pt.horarios && <p className="mt-3 whitespace-pre-line">{pt.horarios}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Quem faz acontecer. */}
      <section className="relative isolate overflow-clip">
        <Image src="/img/ia-voluntarios-entrega.webp" alt="Voluntários de camiseta verde entregando sacolinhas kraft com laço vermelho" fill sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-verde-escuro/90 via-verde-escuro/60 to-transparent" />
        <div className="mx-auto flex min-h-[460px] max-w-7xl items-center px-4 py-20 sm:px-8">
          <div className="max-w-lg" data-revelar>
            <p className="font-mao text-[clamp(2.4rem,5.5vw,4.2rem)] leading-none text-creme">O Natal também é sobre compartilhar.</p>
            <p className="mt-5 text-lg text-creme/90">
              Voluntários do Paz Kids em Ação recebem, conferem e entregam cada sacolinha para a criança que espera por ela.
            </p>
            <Link href="/" className="btn btn-contorno-claro mt-8">
              Conheça o Paz Kids em Ação
            </Link>
          </div>
        </div>
      </section>

      {/* Pix. */}
      <section className="bg-amarelo">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-12 sm:px-8">
          <div>
            <h2 className="text-3xl font-bold text-verde">Prefere doar qualquer valor?</h2>
            <p className="mt-1 text-lg text-verde">
              Chave Pix <strong className="font-titulo text-2xl">{SITE.pix.chave}</strong>
            </p>
            <p className="mt-1 text-sm text-verde/80">Favorecido: {SITE.pix.favorecido}</p>
          </div>
          <CopyButton value={SITE.pix.copiar} label="Copiar chave Pix" className="btn btn-primario h-14 px-7 text-lg" />
        </div>
      </section>

      <Rodape variante="campanha" />
    </div>
  );
}

function Passo({ n, icone, titulo, children, atrasoMs }: { n: number; icone: React.ReactNode; titulo: string; children: React.ReactNode; atrasoMs: number }) {
  return (
    <li className="relative rounded-[24px] bg-white p-8" data-revelar style={atraso(atrasoMs)}>
      <span className="absolute top-6 right-7 font-titulo text-6xl leading-none font-bold text-creme">{n}</span>
      <span className="relative grid size-14 place-items-center rounded-2xl bg-creme text-verde">{icone}</span>
      <h3 className="relative mt-6 text-2xl font-bold text-verde">{titulo}</h3>
      <p className="relative mt-3 text-lg text-tinta-2">{children}</p>
    </li>
  );
}

function Forma({ icone, titulo, texto }: { icone: React.ReactNode; titulo: string; texto: string }) {
  return (
    <div className="flex gap-5 rounded-[24px] border-2 border-verde/10 bg-white p-8" data-revelar>
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-verde text-amarelo">{icone}</span>
      <div>
        <h3 className="text-2xl font-bold text-verde">{titulo}</h3>
        <p className="mt-2 text-lg text-tinta-2">{texto}</p>
      </div>
    </div>
  );
}
