import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { StatusBadge } from "@/components/painel/status-badge";
import { MODALIDADE_LABEL, STATUS_PEDIDO_LABEL } from "@/lib/campanhas";
import { formatDateTime, formatIsoDate, todayIso } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = { title: "Pedidos" };

const { pedidos, padrinhos, campanhas, pedidoItens } = schema;
const FILTROS = [
  { k: "", label: "Todos" },
  { k: "pendencia", label: "Com pendência" },
  { k: "aguardando_entrega", label: "Aguardando entrega" },
  { k: "pago", label: "Pagos" },
  { k: "pendente", label: "Aguardando pagamento" },
  { k: "entregue", label: "Entregues" },
  { k: "fechados", label: "Cancelados e expirados" },
];

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = "" } = await searchParams;
  const where =
    f === "pendencia"
      ? isNotNull(pedidos.pendencia)
      : f === "fechados"
        ? sql`${pedidos.status} in ('cancelado','expirado')`
        : ["aguardando_entrega", "pago", "pendente", "entregue"].includes(f)
          ? eq(pedidos.status, f as "pago")
          : undefined;
  const lista = await getDb()
    .select({
      p: pedidos,
      padrinho: padrinhos.nome,
      campanha: campanhas.nome,
      criancas: sql<number>`(select count(*) from ${pedidoItens} where ${pedidoItens.pedidoId} = ${pedidos.id})`,
    })
    .from(pedidos)
    .innerJoin(padrinhos, eq(padrinhos.id, pedidos.padrinhoId))
    .innerJoin(campanhas, eq(campanhas.id, pedidos.campanhaId))
    .where(and(where))
    .orderBy(desc(pedidos.criadoEm))
    .limit(300);
  const hoje = todayIso();

  return (
    <div>
      <h1 className="text-3xl font-semibold">Pedidos</h1>
      <p className="mt-1 text-tinta-2">Cada vez que alguém finaliza a escolha no site vira um pedido, com uma ou mais crianças.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTROS.map((x) => (
          <Link
            key={x.k}
            href={x.k ? `/pedidos?f=${x.k}` : "/pedidos"}
            className={`rounded-lg px-3 py-1 text-sm ${f === x.k ? "bg-tinta text-white" : "bg-white text-tinta-2 ring-1 ring-linha hover:text-tinta"}`}
          >
            {x.label}
          </Link>
        ))}
      </div>
      {lista.length === 0 ? (
        <p className="cartao mt-4 p-8 text-center text-tinta-2">Nenhum pedido aqui.</p>
      ) : (
        <div className="cartao mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-linha text-left text-xs text-tinta-2 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Pedido</th>
                <th className="px-4 py-3 font-semibold">Padrinho</th>
                <th className="px-4 py-3 font-semibold">Como</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {lista.map(({ p, padrinho, campanha, criancas }) => {
                const atrasado = p.status === "aguardando_entrega" && p.prazoEntrega && p.prazoEntrega < hoje;
                return (
                  <tr key={p.id} className="hover:bg-creme/40">
                    <td className="px-4 py-2.5">
                      <Link href={`/pedidos/${p.id}`} className="font-semibold hover:text-roxo">
                        #{p.id} · {criancas} criança(s)
                      </Link>
                      <span className="block text-xs text-tinta-2">{campanha}</span>
                    </td>
                    <td className="px-4 py-2.5">{padrinho}</td>
                    <td className="px-4 py-2.5 text-tinta-2">
                      {MODALIDADE_LABEL[p.modalidade]}
                      {p.valor ? <span className="block text-xs">{formatBRL(p.valor)}</span> : null}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status} label={STATUS_PEDIDO_LABEL[p.status]} />
                      {atrasado && <span className="block text-xs font-semibold text-vermelho">Prazo vencido em {formatIsoDate(p.prazoEntrega!)}</span>}
                      {p.pendencia && <span className="block text-xs font-semibold text-vermelho">Pendência</span>}
                    </td>
                    <td className="px-4 py-2.5 text-tinta-2">{formatDateTime(p.criadoEm)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
