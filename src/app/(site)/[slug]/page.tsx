import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { GradeCriancas, type CriancaCard } from "@/components/site/grade-criancas";
import { CopyButton } from "@/components/ui/copy-button";
import { SITE } from "@/content/site";
import { asaasConfigured } from "@/lib/asaas";
import { campanhaPorSlug, criancasDaCampanha, itensSacolinha, progressoCampanhas } from "@/lib/campanhas";
import { idade, idadeTexto, nomePublico } from "@/lib/criancas";
import { formatIsoDate } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { imagemPublica } from "@/lib/imagem-publica";
import { formatBRL } from "@/lib/money";
import { liberarExpiradas } from "@/lib/reservas";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await campanhaPorSlug((await params).slug);
  if (!c || c.status === "rascunho") return {};
  return { title: c.nome, description: c.descricao ?? undefined, alternates: { canonical: `/${c.slug}` } };
}

export default async function CampanhaPage({ params }: { params: Promise<{ slug: string }> }) {
  const campanha = await campanhaPorSlug((await params).slug);
  if (!campanha || campanha.status === "rascunho") notFound();
  const aberta = campanha.status === "ativa";

  await liberarExpiradas();
  const [lista, progresso, pontos] = await Promise.all([
    criancasDaCampanha(campanha.id),
    progressoCampanhas([campanha.id]),
    getDb().select().from(schema.pontosColeta).where(eq(schema.pontosColeta.ativo, true)).orderBy(asc(schema.pontosColeta.nome)),
  ]);
  const p = progresso.get(campanha.id) ?? { total: 0, comPadrinho: 0 };
  const itens = itensSacolinha(campanha.itensSacolinha);
  const online = Boolean(campanha.valorSacolinha && asaasConfigured());
  const balcao = Boolean(campanha.prazoEntrega && pontos.length);

  const cards: CriancaCard[] = lista.map((c) => ({
    id: c.id,
    nome: nomePublico(c),
    idade: idade(c.dataNascimento),
    idadeTexto: idadeTexto(c.dataNascimento),
    sexo: c.sexo,
    camiseta: c.tamanhoCamiseta,
    calca: c.tamanhoCalca,
    calcado: c.tamanhoCalcado,
    sugestao: c.sugestaoPresente,
    gostos: c.gostos,
    imagem: imagemPublica(c.id, c.versaoImagem),
  }));

  return (
    <>
      <section className="bg-creme">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-12 sm:px-6">
          <p className="chamada">Paz Kids em Ação</p>
          <h1 className="mt-3 text-[clamp(2.4rem,6vw,4rem)] leading-[1.02] font-semibold">{campanha.nome}</h1>
          {campanha.descricao && <p className="mt-4 max-w-2xl text-lg whitespace-pre-line text-tinta-2">{campanha.descricao}</p>}
          {p.total > 0 && (
            <div className="mt-8 max-w-xl">
              <div className="h-4 overflow-hidden rounded-full border border-tinta/10 bg-white">
                <div className="h-full rounded-full bg-verde" style={{ width: `${(p.comPadrinho / p.total) * 100}%` }} />
              </div>
              <p className="mt-2 text-tinta-2">
                <strong className="font-titulo text-2xl text-tinta">{p.comPadrinho}</strong> de {p.total} crianças já têm padrinho.
                {aberta && lista.length > 0 && ` Faltam ${lista.length}.`}
              </p>
            </div>
          )}
          {!aberta && <p className="mt-6 inline-block rounded-xl bg-tinta px-4 py-2 font-semibold text-white">Campanha encerrada. Obrigado a todos que ajudaram!</p>}
        </div>
      </section>

      {aberta && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="chamada">Como participar</p>
          <ol className="mt-5 grid gap-5 md:grid-cols-3">
            <Passo n={1} cor="bg-verde" titulo="Escolha as crianças">
              Conheça as crianças abaixo e escolha uma ou mais para apadrinhar. Os tamanhos ajudam a acertar no presente.
            </Passo>
            <Passo n={2} cor="bg-azul" titulo="Escolha como ajudar">
              {online && balcao
                ? `Pague a sacolinha online (${formatBRL(campanha.valorSacolinha)} por criança) e a equipe monta, ou monte você mesmo e entregue num ponto de coleta.`
                : online
                  ? `Pague a sacolinha online, ${formatBRL(campanha.valorSacolinha)} por criança, por Pix ou cartão. A equipe monta.`
                  : "Monte a sacolinha com os itens da lista e entregue num dos pontos de coleta."}
            </Passo>
            <Passo n={3} cor="bg-rosa" titulo={balcao ? "Entregue até o prazo" : "Pronto!"}>
              {balcao
                ? `Quem vai montar tem até ${formatIsoDate(campanha.prazoEntrega!)} para entregar. Até lá, a criança fica reservada para você.`
                : "Assim que o pagamento é confirmado, a criança fica com o seu nome."}
            </Passo>
          </ol>
        </section>
      )}

      {itens.length > 0 && aberta && (
        <section className="border-y border-linha bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_2fr]">
            <div>
              <p className="chamada">A sacolinha</p>
              <h2 className="mt-2 text-3xl font-semibold">O que vai dentro</h2>
              <p className="mt-2 text-tinta-2">Para cada criança escolhida.</p>
            </div>
            <ul className="flex flex-wrap content-start gap-3">
              {itens.map((i) => (
                <li key={i} className="rounded-xl border-2 border-dashed border-linha px-5 py-3 font-titulo text-xl font-semibold">
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="criancas" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 pb-32 sm:px-6">
        <p className="chamada">{aberta ? "Esperando um padrinho" : "Crianças"}</p>
        <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{aberta ? "Escolha quem você vai presentear" : "Todas as crianças foram atendidas"}</h2>
        {aberta &&
          (lista.length === 0 ? (
            <p className="mt-6 max-w-xl text-lg text-tinta-2">
              {p.total > 0 ? "Todas as crianças desta campanha já têm padrinho. Obrigado! Você ainda pode ajudar com qualquer valor pelo Pix." : "As crianças desta campanha ainda estão sendo cadastradas. Volte em breve."}
            </p>
          ) : (
            <div className="mt-6">
              <GradeCriancas slug={campanha.slug} criancas={cards} aberta={aberta && (online || balcao)} />
              {!(online || balcao) && <p className="mt-6 text-tinta-2">As inscrições de padrinhos abrem em breve.</p>}
            </div>
          ))}
      </section>

      {aberta && balcao && (
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <p className="chamada">Pontos de coleta</p>
            <h2 className="mt-2 text-3xl font-semibold">Onde entregar a sacolinha</h2>
            <p className="mt-2 text-tinta-2">Até {formatIsoDate(campanha.prazoEntrega!)}, na recepção do Paz Kids:</p>
            <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pontos.map((pt) => (
                <li key={pt.id} className="cartao p-5">
                  <p className="font-titulo text-lg font-semibold">{pt.nome}</p>
                  {pt.endereco && <p className="mt-1 text-sm whitespace-pre-line text-tinta-2">{pt.endereco}</p>}
                  {pt.horarios && <p className="mt-2 text-sm whitespace-pre-line">{pt.horarios}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="bg-ceu">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-12 sm:px-6">
          <div>
            <h2 className="text-2xl font-semibold">Prefere doar qualquer valor?</h2>
            <p className="mt-1">
              Pix {SITE.pix.tipo}: <strong>{SITE.pix.chave}</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <CopyButton value={SITE.pix.copiar} label="Copiar chave Pix" className="btn btn-primario" />
            <Link href="/" className="btn btn-claro">
              Sobre o projeto
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Passo({ n, cor, titulo, children }: { n: number; cor: string; titulo: string; children: React.ReactNode }) {
  return (
    <li className="cartao p-6">
      <span className={`grid size-10 place-items-center rounded-xl font-titulo text-xl font-semibold text-white ${cor}`}>{n}</span>
      <h3 className="mt-4 text-xl font-semibold">{titulo}</h3>
      <p className="mt-2 text-tinta-2">{children}</p>
    </li>
  );
}
