import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray, or, isNotNull } from "drizzle-orm";
import { PrintButton } from "@/components/ui/print-button";
import { requireUsuario } from "@/lib/auth";
import { nomePublico } from "@/lib/criancas";
import { getDb, schema } from "@/lib/db";

export const metadata: Metadata = { title: "Mensagens para imprimir" };

const { pedidos, pedidoItens, criancas, padrinhos, campanhas } = schema;

/**
 * Os recados dos padrinhos, um cartão por criança, para imprimir e pôr na sacolinha. Só de pedido
 * que vale (pago, aguardando entrega ou entregue): cancelado e expirado não viram sacolinha.
 */
export default async function MensagensPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ entregues?: string }> }) {
  await requireUsuario();
  const id = Number((await params).id);
  const comEntregues = (await searchParams).entregues === "1";
  const db = getDb();
  const [campanha] = await db.select().from(campanhas).where(eq(campanhas.id, id)).limit(1);
  if (!campanha) notFound();

  const recados = await db
    .select({
      pedidoId: pedidos.id,
      crianca: { nome: criancas.nome, apelidoPublico: criancas.apelidoPublico },
      padrinho: padrinhos.nome,
      mensagem: pedidoItens.mensagem,
      vaiOrar: pedidoItens.vaiOrar,
    })
    .from(pedidoItens)
    .innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
    .innerJoin(criancas, eq(criancas.id, pedidoItens.criancaId))
    .innerJoin(padrinhos, eq(padrinhos.id, pedidos.padrinhoId))
    .where(
      and(
        eq(pedidos.campanhaId, id),
        inArray(pedidos.status, comEntregues ? ["pago", "aguardando_entrega", "entregue"] : ["pago", "aguardando_entrega"]),
        or(isNotNull(pedidoItens.mensagem), eq(pedidoItens.vaiOrar, true)),
      ),
    )
    .orderBy(asc(criancas.nome));

  return (
    <div className="max-w-4xl">
      <div className="print:hidden">
        <Link href={`/campanhas/${id}`} className="text-sm text-tinta-2 hover:text-tinta">
          ← {campanha.nome}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Mensagens para imprimir</h1>
            <p className="mt-1 max-w-xl text-tinta-2">
              Um cartão por criança, com o recado do padrinho. Leia antes de imprimir: tudo o que estiver aqui vai chegar à criança.
            </p>
          </div>
          {recados.length > 0 && <PrintButton className="btn btn-primario btn-sm">Imprimir {recados.length} {recados.length === 1 ? "cartão" : "cartões"}</PrintButton>}
        </div>
        <p className="mt-3 text-sm">
          {comEntregues ? (
            <Link href={`/campanhas/${id}/mensagens`} className="text-verde underline">
              Esconder as sacolinhas já entregues
            </Link>
          ) : (
            <Link href={`/campanhas/${id}/mensagens?entregues=1`} className="text-verde underline">
              Incluir as sacolinhas já entregues
            </Link>
          )}
        </p>
      </div>

      {recados.length === 0 ? (
        <p className="cartao mt-8 p-8 text-center text-tinta-2">Nenhuma mensagem por enquanto.</p>
      ) : (
        <div className="mt-8 grid gap-6 print:mt-0 print:block">
          {recados.map((r) => {
            const nome = nomePublico(r.crianca);
            const padrinho = r.padrinho.trim().split(/\s+/)[0];
            return (
              <article
                key={`${r.pedidoId}-${r.crianca.nome}`}
                className="relative flex min-h-[125mm] break-inside-avoid flex-col rounded-[24px] border-2 border-verde/20 bg-papel p-10 print:mb-[8mm] print:min-h-[132mm] print:rounded-none print:border-verde/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/natal/simbolos/estrela.svg" alt="" className="absolute top-8 right-8 size-10" />
                <p className="font-mao text-5xl leading-none text-verde">Para {nome}</p>
                {r.mensagem && <p className="mt-8 text-2xl leading-relaxed whitespace-pre-line text-tinta">{r.mensagem}</p>}
                <div className="flex-1" />
                <p className="mt-8 font-titulo text-2xl font-semibold text-verde">Com carinho, {padrinho}</p>
                {r.vaiOrar && <p className="mt-1 text-lg text-vermelho">{padrinho} vai orar por você.</p>}
                <p className="mt-6 border-t border-verde/15 pt-3 text-xs text-tinta-2">
                  {r.crianca.nome} · pedido #{r.pedidoId} · Paz Kids em Ação · {campanha.nome}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
