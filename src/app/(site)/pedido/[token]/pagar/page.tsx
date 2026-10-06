import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { PagamentoDemo } from "@/components/site/pagamento-demo";
import { getDb, schema } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { modoPagamento } from "@/lib/pagamento";
import { liberarExpiradas } from "@/lib/reservas";
import { simularPagamento } from "./actions";

export const metadata: Metadata = { title: "Pagamento", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

// Tela de pagamento do modo demonstração, no lugar da fatura do Asaas. Mostra o que o doador vai
// ver (Pix com QR Code ou cartão) e confirma o pedido como o webhook faria.
export default async function PagarPage({ params }: { params: Promise<{ token: string }> }) {
  if (modoPagamento() !== "demo") notFound();
  const { token } = await params;
  await liberarExpiradas();
  const [linha] = await getDb()
    .select({ p: schema.pedidos, campanha: schema.campanhas.nome, padrinho: schema.padrinhos.nome })
    .from(schema.pedidos)
    .innerJoin(schema.campanhas, eq(schema.campanhas.id, schema.pedidos.campanhaId))
    .innerJoin(schema.padrinhos, eq(schema.padrinhos.id, schema.pedidos.padrinhoId))
    .where(eq(schema.pedidos.token, token))
    .limit(1);
  if (!linha || linha.p.modalidade !== "pagamento_online") notFound();
  if (linha.p.status !== "pendente") redirect(`/pedido/${token}`);

  // Código no formato do Pix copia e cola, mas sem chave de verdade: o banco recusaria.
  const copiaECola = `00020126580014BR.GOV.BCB.PIX0136DEMONSTRACAO-PAZKIDSEMACAO-${linha.p.id}5204000053039865406${((linha.p.valor ?? 0) / 100).toFixed(2)}5802BR5916PAZ KIDS EM ACAO6009SAO PAULO62070503***6304DEMO`;
  const qr = await QRCode.toString(copiaECola, { type: "svg", margin: 0, color: { dark: "#1e4b36", light: "#00000000" } });

  return (
    <div className="min-h-dvh bg-creme">
      <div className="bg-amarelo px-4 py-2 text-center text-sm font-bold text-verde-escuro">
        Demonstração: esta tela simula o pagamento. Nenhum valor é cobrado.
      </div>
      <div className="mx-auto max-w-xl px-4 py-10">
        <Link href={`/pedido/${token}`} className="text-sm text-tinta-2 hover:text-tinta">
          ← Voltar ao pedido
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <Image src="/natal/logo/paz-kids-simbolo-colorida.svg" alt="" width={48} height={48} className="size-12" />
          <div>
            <p className="chamada text-verde">{linha.campanha}</p>
            <p className="text-sm text-tinta-2">Pedido nº {linha.p.id}</p>
          </div>
        </div>
        <p className="mt-6 font-titulo text-4xl font-bold text-verde">{formatBRL(linha.p.valor)}</p>
        <PagamentoDemo
          forma={linha.p.forma ?? "pix"}
          parcelas={linha.p.parcelas}
          valor={formatBRL(linha.p.valor)}
          qrSvg={qr}
          copiaECola={copiaECola}
          reservadoAte={linha.p.reservadoAte?.getTime() ?? null}
          pagar={simularPagamento.bind(null, token)}
        />
      </div>
    </div>
  );
}
