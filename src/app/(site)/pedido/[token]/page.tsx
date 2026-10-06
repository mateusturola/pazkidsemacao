import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { AguardandoPagamento, LimparCarrinho } from "@/components/site/pedido-vivo";
import { Rodape } from "@/components/site/rodape";
import { Topo } from "@/components/site/topo";
import { CopyButton } from "@/components/ui/copy-button";
import { SITE } from "@/content/site";
import { idadeTexto, nomePublico } from "@/lib/criancas";
import { formatIsoDate } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { imagemPublica } from "@/lib/imagem-publica";
import { formatBRL } from "@/lib/money";
import { liberarExpiradas } from "@/lib/reservas";

// O token é a única proteção desta página: fora dos buscadores e sem vazar o endereço por Referer.
export const metadata: Metadata = { title: "Seu apadrinhamento", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

const { pedidos, campanhas, pedidoItens, criancas, pontosColeta, padrinhos } = schema;

export default async function PedidoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[\w-]{24}$/.test(token)) notFound();
  await liberarExpiradas();
  const db = getDb();
  const [linha] = await db
    .select({ p: pedidos, campanha: campanhas, ponto: pontosColeta, padrinho: padrinhos.nome })
    .from(pedidos)
    .innerJoin(campanhas, eq(campanhas.id, pedidos.campanhaId))
    .innerJoin(padrinhos, eq(padrinhos.id, pedidos.padrinhoId))
    .leftJoin(pontosColeta, eq(pontosColeta.id, pedidos.pontoColetaId))
    .where(eq(pedidos.token, token))
    .limit(1);
  if (!linha) notFound();
  const { p, campanha, ponto } = linha;
  const itens = await db
    .select({
      id: criancas.id,
      nome: criancas.nome,
      apelidoPublico: criancas.apelidoPublico,
      dataNascimento: criancas.dataNascimento,
      tamanhoCamiseta: criancas.tamanhoCamiseta,
      tamanhoCalca: criancas.tamanhoCalca,
      tamanhoCalcado: criancas.tamanhoCalcado,
      sugestaoPresente: criancas.sugestaoPresente,
      gostos: criancas.gostos,
      fotoKey: criancas.fotoKey,
      avatarKey: criancas.avatarKey,
      autorizacaoImagem: criancas.autorizacaoImagem,
      pedidoDaCrianca: schema.participacoes.pedidoId,
    })
    .from(pedidoItens)
    .innerJoin(criancas, eq(criancas.id, pedidoItens.criancaId))
    .leftJoin(schema.participacoes, and(eq(schema.participacoes.criancaId, criancas.id), eq(schema.participacoes.campanhaId, p.campanhaId)))
    .where(eq(pedidoItens.pedidoId, p.id));

  const primeiroNome = linha.padrinho.split(" ")[0];
  const fechado = p.status === "expirado" || p.status === "cancelado";

  const titulo =
    p.status === "pendente"
      ? "Falta só o pagamento"
      : p.status === "pago"
        ? `Obrigado, ${primeiroNome}!`
        : p.status === "aguardando_entrega"
          ? `Obrigado, ${primeiroNome}! As crianças estão reservadas para você`
          : p.status === "entregue"
            ? `Sacolinha entregue. Obrigado, ${primeiroNome}!`
            : p.status === "expirado"
              ? "A reserva expirou"
              : "Pedido cancelado";

  const demo = p.asaasInvoiceUrl?.startsWith("/");

  return (
    <>
      <Topo variante="campanha" links={[{ href: `/${campanha.slug}`, label: campanha.nome }, { href: "/", label: "Sobre o projeto" }]} />
      <div className="relative overflow-hidden bg-creme pt-[72px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/natal/simbolos/forma-vermelha.svg" alt="" className="forma -top-28 -right-36 w-[380px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/natal/simbolos/confete.svg" alt="" className="forma top-28 left-[8%] hidden w-28 lg:block" />
        <div className="relative mx-auto max-w-3xl px-4 pt-14 pb-24 sm:px-6">
          {!fechado && <LimparCarrinho slug={campanha.slug} />}
          <p className="chamada text-verde">
            {campanha.nome} · pedido nº {p.id}
          </p>
          {(p.status === "pago" || p.status === "aguardando_entrega" || p.status === "entregue") && (
            <p className="mt-6 font-mao text-3xl text-vermelho">Mais que presentes, é esperança.</p>
          )}
          <h1 className="mt-2 text-4xl leading-tight font-bold text-verde sm:text-5xl">{titulo}</h1>

          {p.status === "pendente" && (
            <div className="mt-8 rounded-[24px] bg-white p-6 sm:p-8">
              <p className="text-lg">
                Total: <strong className="font-titulo text-3xl text-verde">{formatBRL(p.valor)}</strong>{" "}
                {p.forma === "cartao" ? `no cartão${p.parcelas > 1 ? ` em ${p.parcelas}x` : ""}` : "no Pix"}
              </p>
              {p.asaasInvoiceUrl && (
                <a href={p.asaasInvoiceUrl} {...(demo ? {} : { target: "_blank", rel: "noopener" })} className="btn btn-acao mt-5 h-14 px-8 text-lg">
                  {p.forma === "cartao" ? "Pagar com cartão" : "Pagar com Pix"}
                </a>
              )}
              {p.reservadoAte && (
                <div className="mt-5">
                  <AguardandoPagamento ate={p.reservadoAte.getTime()} />
                </div>
              )}
            </div>
          )}
          {p.status === "pago" && (
            <p className="mt-5 text-lg text-tinta-2">
              Pagamento confirmado. A equipe do Paz Kids em Ação vai montar a sacolinha e entregar para cada criança. Mandamos a confirmação
              para o seu e-mail.
            </p>
          )}
          {p.status === "aguardando_entrega" && (
            <div className="mt-8 rounded-[24px] bg-verde p-6 text-creme sm:p-8">
              <p className="text-lg">
                Monte uma sacolinha para cada criança e entregue até <strong className="text-amarelo">{p.prazoEntrega && formatIsoDate(p.prazoEntrega)}</strong> em:
              </p>
              {ponto && (
                <div className="mt-4">
                  <p className="font-titulo text-2xl font-semibold">{ponto.nome}</p>
                  {ponto.endereco && <p className="whitespace-pre-line text-creme/80">{ponto.endereco}</p>}
                  {ponto.horarios && <p className="mt-1 whitespace-pre-line">{ponto.horarios}</p>}
                </div>
              )}
              <p className="mt-5 rounded-xl bg-creme/10 p-4 font-bold">
                Na sacola, escreva o nome da criança e o número do pedido: <span className="text-amarelo">{p.id}</span>. Perto do prazo, a gente
                lembra você por e-mail.
              </p>
            </div>
          )}
          {fechado && (
            <div className="mt-5">
              <p className="text-lg text-tinta-2">
                {p.status === "expirado"
                  ? "O pagamento não foi confirmado a tempo e as crianças voltaram para a lista. Se você pagou, fale com a equipe: nada se perde."
                  : "Este pedido foi cancelado e as crianças voltaram para a lista."}
              </p>
              {campanha.status === "ativa" && (
                <Link href={`/${campanha.slug}#criancas`} className="btn btn-acao mt-6">
                  Escolher de novo
                </Link>
              )}
            </div>
          )}

          <h2 className="mt-14 text-3xl font-bold text-verde">{itens.length === 1 ? "Sua criança" : "Suas crianças"}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {itens.map((c) => (
              <li key={c.id} className="flex gap-4 rounded-[24px] bg-kraft p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagemPublica(c.id, (c.autorizacaoImagem && c.fotoKey) || c.avatarKey)} alt="" className="size-20 shrink-0 rounded-full border-4 border-papel object-cover" />
                <div className="min-w-0">
                  <p className="chamada text-verde/70">Para:</p>
                  <p className="font-mao text-3xl leading-none text-verde">{nomePublico(c)}</p>
                  <p className="mt-1 text-sm font-bold text-verde/80">{idadeTexto(c.dataNascimento)}</p>
                  <p className="mt-2 text-sm">
                    Camiseta <strong>{c.tamanhoCamiseta || "—"}</strong> · Calça <strong>{c.tamanhoCalca || "—"}</strong> · Calçado{" "}
                    <strong>{c.tamanhoCalcado || "—"}</strong>
                  </p>
                  {c.sugestaoPresente && <p className="mt-1 text-sm">Ideia de presente: {c.sugestaoPresente}</p>}
                  {c.gostos && <p className="text-sm">Gosta de: {c.gostos}</p>}
                  {!fechado && c.pedidoDaCrianca !== p.id && p.status !== "pendente" && (
                    <p className="mt-1 text-sm font-bold text-vermelho">A equipe vai falar com você sobre esta criança.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {!fechado && (
            <div className="mt-10 rounded-[24px] bg-white p-6 text-tinta-2">
              <p>Guarde este endereço: é por ele que você acompanha o seu apadrinhamento.</p>
              <div className="mt-3">
                <CopyButton value={`${SITE.url}/pedido/${p.token}`} label="Copiar endereço desta página" />
              </div>
            </div>
          )}
        </div>
      </div>
      <Rodape variante="campanha" />
    </>
  );
}
