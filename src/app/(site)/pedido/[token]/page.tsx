import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { AguardandoPagamento, LimparCarrinho } from "@/components/site/pedido-vivo";
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

  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-20 sm:px-6">
      {!fechado && <LimparCarrinho slug={campanha.slug} />}
      <p className="chamada">
        {campanha.nome} · pedido nº {p.id}
      </p>
      <h1 className="mt-3 text-4xl font-semibold">{titulo}</h1>

      {p.status === "pendente" && (
        <div className="cartao mt-6 p-6">
          <p className="text-lg">
            Total: <strong className="font-titulo text-2xl">{formatBRL(p.valor)}</strong> {p.forma === "cartao" ? `no cartão${p.parcelas > 1 ? ` em ${p.parcelas}x` : ""}` : "no Pix"}
          </p>
          {p.asaasInvoiceUrl && (
            <a href={p.asaasInvoiceUrl} target="_blank" rel="noopener" className="btn btn-primario mt-4 h-12 px-8">
              {p.forma === "cartao" ? "Pagar com cartão" : "Abrir o Pix"}
            </a>
          )}
          {p.reservadoAte && (
            <div className="mt-4">
              <AguardandoPagamento ate={p.reservadoAte.getTime()} />
            </div>
          )}
        </div>
      )}
      {p.status === "pago" && <p className="mt-4 text-lg text-tinta-2">Pagamento confirmado. A equipe do Paz Kids em Ação vai montar a sacolinha e entregar para cada criança.</p>}
      {p.status === "aguardando_entrega" && (
        <div className="mt-6 rounded-2xl bg-creme p-6">
          <p className="text-lg">
            Monte uma sacolinha para cada criança e entregue até <strong>{p.prazoEntrega && formatIsoDate(p.prazoEntrega)}</strong> em:
          </p>
          {ponto && (
            <div className="mt-3">
              <p className="font-titulo text-xl font-semibold">{ponto.nome}</p>
              {ponto.endereco && <p className="whitespace-pre-line text-tinta-2">{ponto.endereco}</p>}
              {ponto.horarios && <p className="mt-1 whitespace-pre-line">{ponto.horarios}</p>}
            </div>
          )}
          <p className="mt-4 font-semibold">Identifique cada sacolinha com o nome da criança e o número do pedido ({p.id}).</p>
        </div>
      )}
      {fechado && (
        <div className="mt-4">
          <p className="text-lg text-tinta-2">
            {p.status === "expirado"
              ? "O pagamento não foi confirmado a tempo e as crianças voltaram para a lista. Se você pagou, fale com a equipe: nada se perde."
              : "Este pedido foi cancelado e as crianças voltaram para a lista."}
          </p>
          {campanha.status === "ativa" && (
            <Link href={`/${campanha.slug}#criancas`} className="btn btn-primario mt-5">
              Escolher de novo
            </Link>
          )}
        </div>
      )}

      <h2 className="mt-12 text-2xl font-semibold">{itens.length === 1 ? "Sua criança" : "Suas crianças"}</h2>
      <ul className="mt-4 space-y-4">
        {itens.map((c) => (
          <li key={c.id} className="cartao flex gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagemPublica(c.id, (c.autorizacaoImagem && c.fotoKey) || c.avatarKey)} alt="" className="size-20 shrink-0 rounded-xl bg-creme object-cover" />
            <div className="min-w-0">
              <p className="font-titulo text-xl font-semibold">{nomePublico(c)}</p>
              <p className="text-sm text-tinta-2">{idadeTexto(c.dataNascimento)}</p>
              <p className="mt-2 text-sm">
                Camiseta <strong>{c.tamanhoCamiseta || "—"}</strong> · Calça <strong>{c.tamanhoCalca || "—"}</strong> · Calçado{" "}
                <strong>{c.tamanhoCalcado || "—"}</strong>
              </p>
              {c.sugestaoPresente && <p className="mt-1 text-sm">Sugestão de presente: {c.sugestaoPresente}</p>}
              {c.gostos && <p className="text-sm">Gosta de: {c.gostos}</p>}
              {!fechado && c.pedidoDaCrianca !== p.id && p.status !== "pendente" && (
                <p className="mt-1 text-sm font-semibold text-laranja">A equipe vai falar com você sobre esta criança.</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!fechado && (
        <div className="mt-10 rounded-2xl border border-linha bg-white p-5 text-sm text-tinta-2">
          <p>Guarde este endereço: é por ele que você acompanha o seu apadrinhamento.</p>
          <div className="mt-3">
            <CopyButton value={`${SITE.url}/pedido/${p.token}`} label="Copiar endereço desta página" />
          </div>
        </div>
      )}
    </div>
  );
}
