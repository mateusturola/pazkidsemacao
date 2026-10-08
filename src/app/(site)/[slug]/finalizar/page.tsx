import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { FinalizarForm } from "@/components/site/finalizar-form";
import { Rodape } from "@/components/site/rodape";
import { TirarDaSacolinha } from "@/components/site/tirar-da-sacolinha";
import { Topo } from "@/components/site/topo";
import { campanhaAberta, campanhaPorSlug, criancasDaCampanha } from "@/lib/campanhas";
import { idadeTexto, nomePublico } from "@/lib/criancas";
import { formatIsoDate, todayIso } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { imagemPublica } from "@/lib/imagem-publica";
import { formatBRL } from "@/lib/money";
import { pagamentoOnlineDisponivel } from "@/lib/pagamento";
import { MAX_POR_PEDIDO } from "@/lib/regras";
import { liberarExpiradas } from "@/lib/reservas";
import { finalizarPedido } from "./actions";

export const metadata: Metadata = { title: "Finalizar", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function FinalizarPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ c?: string }> }) {
  const { slug } = await params;
  const campanha = await campanhaPorSlug(slug);
  if (!campanha || campanha.status === "rascunho") notFound();

  const pedidas = [...new Set(((await searchParams).c ?? "").split(",").map(Number))].filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX_POR_PEDIDO);
  await liberarExpiradas();
  const [disponiveis, pontos] = await Promise.all([
    criancasDaCampanha(campanha.id),
    getDb()
      .select({ id: schema.pontosColeta.id, nome: schema.pontosColeta.nome, endereco: schema.pontosColeta.endereco, horarios: schema.pontosColeta.horarios })
      .from(schema.pontosColeta)
      .where(and(eq(schema.pontosColeta.ativo, true)))
      .orderBy(asc(schema.pontosColeta.nome)),
  ]);
  const escolhidas = disponiveis.filter((c) => pedidas.includes(c.id));
  const perdidas = pedidas.length - escolhidas.length;
  const perdidasNomes = perdidas
    ? (
        await getDb()
          .select({ nome: schema.criancas.nome, apelidoPublico: schema.criancas.apelidoPublico, id: schema.criancas.id })
          .from(schema.criancas)
          .where(inArray(schema.criancas.id, pedidas.filter((id) => !escolhidas.some((e) => e.id === id))))
      ).map(nomePublico)
    : [];

  const aberta = campanhaAberta(campanha);
  const online = Boolean(aberta && campanha.valorSacolinha && pagamentoOnlineDisponivel());
  const balcao = Boolean(aberta && campanha.prazoEntrega && campanha.prazoEntrega >= todayIso() && pontos.length);

  return (
    <>
    <Topo variante="campanha" links={[{ href: `/${slug}#criancas`, label: "Voltar para as crianças" }]} />
    <div className="relative overflow-clip bg-creme pt-[72px]">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/natal/simbolos/forma-amarela.svg" alt="" className="forma -top-28 -right-40 w-[420px]" />
    <div className="relative mx-auto max-w-3xl px-4 pt-12 pb-24 sm:px-6">
      <Link href={`/${slug}#criancas`} className="text-sm font-bold text-tinta-2 hover:text-verde">
        ← Voltar para as crianças
      </Link>
      <p className="mt-6 font-mao text-3xl text-vermelho">Quase lá!</p>
      <h1 className="mt-1 text-4xl font-bold text-verde sm:text-5xl">Sua sacolinha de Natal</h1>
      <p className="mt-2 text-lg text-tinta-2">{campanha.nome}</p>

      {perdidasNomes.length > 0 && (
        <p className="mt-6 rounded-xl border border-laranja/30 bg-laranja/5 p-4">
          {perdidasNomes.join(", ")} {perdidasNomes.length > 1 ? "já foram escolhidas" : "já foi escolhida"} por outra pessoa e saiu da sua lista.
        </p>
      )}

      {escolhidas.length === 0 ? (
        <div className="cartao mt-8 p-8 text-center">
          <p className="text-lg">Nenhuma criança escolhida.</p>
          <Link href={`/${slug}#criancas`} className="btn btn-primario mt-4">
            Escolher crianças
          </Link>
        </div>
      ) : !online && !balcao ? (
        <p className="cartao mt-8 p-8 text-center text-lg">Esta campanha não está recebendo padrinhos agora.</p>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-linha rounded-[24px] bg-white">
            {escolhidas.map((c) => (
              <li key={c.id} className="flex items-center gap-4 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagemPublica(c.id, c.versaoImagem)} alt="" className="size-14 rounded-xl bg-creme object-cover" />
                <div className="min-w-0">
                  <p className="font-mao text-3xl leading-none text-verde">{nomePublico(c)}</p>
                  <p className="text-sm text-tinta-2">
                    {idadeTexto(c.dataNascimento)} · camiseta {c.tamanhoCamiseta || "—"}, calça {c.tamanhoCalca || "—"}, calçado {c.tamanhoCalcado || "—"}
                  </p>
                </div>
                <TirarDaSacolinha slug={slug} id={c.id} ids={escolhidas.map((e) => e.id)} nome={nomePublico(c)} />
              </li>
            ))}
          </ul>
          <Link href={`/${slug}#criancas`} className="mt-3 inline-block text-sm font-bold text-verde underline decoration-amarelo decoration-2 underline-offset-4">
            Escolher mais crianças
          </Link>
          <div className="mt-8 rounded-[24px] bg-white p-6 sm:p-8">
            <FinalizarForm
              slug={slug}
              acao={finalizarPedido.bind(null, slug, escolhidas.map((c) => c.id))}
              online={online}
              balcao={balcao}
              valorTotal={campanha.valorSacolinha ? formatBRL(campanha.valorSacolinha * escolhidas.length) : null}
              maxParcelas={campanha.maxParcelas}
              prazo={campanha.prazoEntrega ? formatIsoDate(campanha.prazoEntrega) : null}
              pontos={pontos}
              criancas={escolhidas.map((c) => ({ id: c.id, nome: nomePublico(c), sexo: c.sexo }))}
            />
          </div>
        </>
      )}
    </div>
    </div>
    <Rodape variante="campanha" />
    </>
  );
}
