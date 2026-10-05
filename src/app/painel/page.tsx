import Link from "next/link";
import { desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { StatusBadge } from "@/components/painel/status-badge";
import { usuarioAtual } from "@/lib/auth";
import { entregasAtrasadas, MODALIDADE_LABEL, progressoCampanhas, STATUS_CAMPANHA_LABEL, STATUS_PEDIDO_LABEL } from "@/lib/campanhas";
import { formatDateTime, formatIsoDate } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";

const { campanhas, pedidos, padrinhos, criancas } = schema;

export default async function PainelInicio() {
  const db = getDb();
  const usuario = await usuarioAtual();
  const [lista, [contagem], pendencias, atrasados, recentes] = await Promise.all([
    db.select().from(campanhas).where(ne(campanhas.status, "encerrada")).orderBy(desc(campanhas.criadoEm)),
    db.select({ n: sql<number>`count(*)` }).from(criancas).where(eq(criancas.ativo, true)),
    db.select({ id: pedidos.id, pendencia: pedidos.pendencia }).from(pedidos).where(isNotNull(pedidos.pendencia)),
    entregasAtrasadas(),
    db
      .select({ p: pedidos, padrinho: padrinhos.nome })
      .from(pedidos)
      .innerJoin(padrinhos, eq(padrinhos.id, pedidos.padrinhoId))
      .where(inArray(pedidos.status, ["pendente", "pago", "aguardando_entrega", "entregue"]))
      .orderBy(desc(pedidos.criadoEm))
      .limit(8),
  ]);
  const progresso = await progressoCampanhas(lista.map((c) => c.id));

  return (
    <div>
      <h1 className="text-3xl font-semibold">Olá{usuario?.nome ? `, ${usuario.nome}` : ""}</h1>
      <p className="mt-1 text-tinta-2">{Number(contagem?.n ?? 0)} crianças ativas no cadastro.</p>

      {(pendencias.length > 0 || atrasados.length > 0) && (
        <section className="mt-6 space-y-2">
          {pendencias.map((p) => (
            <Link key={`p${p.id}`} href={`/pedidos/${p.id}`} className="block rounded-xl border border-vermelho/30 bg-vermelho/5 p-4 text-sm hover:bg-vermelho/10">
              <span className="font-semibold text-vermelho">Pedido #{p.id}:</span> {p.pendencia}
            </Link>
          ))}
          {atrasados.map((a) => (
            <Link key={`a${a.id}`} href={`/pedidos/${a.id}`} className="block rounded-xl border border-laranja/30 bg-laranja/5 p-4 text-sm hover:bg-laranja/10">
              <span className="font-semibold text-laranja">Entrega atrasada:</span> {a.nome} tinha até {a.prazoEntrega && formatIsoDate(a.prazoEntrega)} (pedido #{a.id}).
            </Link>
          ))}
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Campanhas</h2>
          <Link href="/campanhas" className="text-sm text-roxo hover:underline">
            Ver todas
          </Link>
        </div>
        {lista.length === 0 ? (
          <p className="cartao mt-3 p-6 text-tinta-2">Nenhuma campanha em andamento.</p>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {lista.map((c) => {
              const p = progresso.get(c.id) ?? { total: 0, comPadrinho: 0 };
              return (
                <Link key={c.id} href={`/campanhas/${c.id}`} className="cartao block p-5 hover:border-tinta/25">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{c.nome}</h3>
                    <StatusBadge status={c.status} label={STATUS_CAMPANHA_LABEL[c.status]} />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-creme">
                    <div className="h-full rounded-full bg-roxo" style={{ width: `${p.total ? (p.comPadrinho / p.total) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-tinta-2">
                    {p.comPadrinho} de {p.total} crianças com padrinho
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Últimos pedidos</h2>
          <Link href="/pedidos" className="text-sm text-roxo hover:underline">
            Ver todos
          </Link>
        </div>
        {recentes.length === 0 ? (
          <p className="cartao mt-3 p-6 text-tinta-2">Nenhum pedido ainda.</p>
        ) : (
          <ul className="cartao mt-3 divide-y divide-linha">
            {recentes.map(({ p, padrinho }) => (
              <li key={p.id}>
                <Link href={`/pedidos/${p.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm hover:bg-creme/40">
                  <span className="font-semibold">#{p.id}</span>
                  <span>{padrinho}</span>
                  <span className="text-tinta-2">{MODALIDADE_LABEL[p.modalidade]}</span>
                  <span className="ml-auto flex items-center gap-3">
                    <StatusBadge status={p.status} label={STATUS_PEDIDO_LABEL[p.status]} />
                    <span className="text-tinta-2">{formatDateTime(p.criadoEm)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
