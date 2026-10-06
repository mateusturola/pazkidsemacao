import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, notInArray, sql } from "drizzle-orm";
import { FotoCrianca } from "@/components/painel/foto-crianca";
import { StatusBadge } from "@/components/painel/status-badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { StatusParticipacao } from "@/db/schema";
import { STATUS_PARTICIPACAO } from "@/db/schema";
import { modoPagamento, pagamentoOnlineDisponivel } from "@/lib/pagamento";
import { usuarioAtual } from "@/lib/auth";
import { CANAL_LABEL, resumoCampanha, STATUS_CAMPANHA_LABEL, STATUS_LABEL } from "@/lib/campanhas";
import { idadeTexto } from "@/lib/criancas";
import { formatIsoDate } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { formatBRL } from "@/lib/money";
import { adicionarCriancas, removerDaCampanha } from "../actions";

export const metadata: Metadata = { title: "Campanha" };

const { participacoes, criancas, pedidos } = schema;

export default async function CampanhaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }) {
  const id = Number((await params).id);
  const { status } = await searchParams;
  const filtro = STATUS_PARTICIPACAO.includes(status as StatusParticipacao) ? (status as StatusParticipacao) : null;
  const db = getDb();
  const [c] = await db.select().from(schema.campanhas).where(eq(schema.campanhas.id, id)).limit(1);
  if (!c) notFound();
  const usuario = await usuarioAtual();

  const [resumo, linhas, foraDaCampanha, [pontosAtivos]] = await Promise.all([
    resumoCampanha(id),
    db
      .select({ p: participacoes, c: criancas, modalidade: pedidos.modalidade })
      .from(participacoes)
      .innerJoin(criancas, eq(criancas.id, participacoes.criancaId))
      .leftJoin(pedidos, eq(pedidos.id, participacoes.pedidoId))
      .where(and(eq(participacoes.campanhaId, id), filtro ? eq(participacoes.status, filtro) : undefined))
      .orderBy(asc(sql`lower(${criancas.nome})`)),
    db
      .select({ id: criancas.id, nome: criancas.nome, dataNascimento: criancas.dataNascimento })
      .from(criancas)
      .where(
        and(
          eq(criancas.ativo, true),
          notInArray(criancas.id, db.select({ id: participacoes.criancaId }).from(participacoes).where(eq(participacoes.campanhaId, id))),
        ),
      )
      .orderBy(asc(sql`lower(${criancas.nome})`)),
    db.select({ n: sql<number>`count(*)` }).from(schema.pontosColeta).where(eq(schema.pontosColeta.ativo, true)),
  ]);

  const avisos: string[] = [];
  if (c.status === "rascunho") avisos.push("A campanha está em rascunho: ainda não aparece no site.");
  if (!c.valorSacolinha) avisos.push("Sem valor da sacolinha: o site não oferece o pagamento online, só montar e entregar.");
  else if (!pagamentoOnlineDisponivel()) avisos.push("O Asaas não está configurado: o pagamento online fica escondido até a chave ser cadastrada.");
  else if (modoPagamento() === "demo") avisos.push("Pagamento online em modo demonstração: o fluxo funciona inteiro, mas ninguém é cobrado.");
  if (!c.prazoEntrega) avisos.push("Sem data limite de entrega: o site não oferece montar e entregar no balcão.");
  if (!Number(pontosAtivos?.n)) avisos.push("Nenhum ponto de coleta ativo: cadastre os balcões em Pontos de coleta.");
  if (resumo.total === 0) avisos.push("Nenhuma criança na campanha ainda. Adicione abaixo.");

  const siteUrl = env("SITE_URL") || "https://pazkidsemacao.com";

  return (
    <div>
      <Link href="/campanhas" className="text-sm text-tinta-2 hover:text-tinta">
        ← Campanhas
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{c.nome}</h1>
        <StatusBadge status={c.status} label={STATUS_CAMPANHA_LABEL[c.status]} />
        <div className="ml-auto flex gap-2">
          {c.status !== "rascunho" && (
            <a href={`${siteUrl}/${c.slug}`} target="_blank" rel="noopener" className="btn btn-claro btn-sm">
              Ver no site
            </a>
          )}
          {usuario?.papel === "admin" && (
            <Link href={`/campanhas/${c.id}/editar`} className="btn btn-claro btn-sm">
              Editar campanha
            </Link>
          )}
        </div>
      </div>
      <p className="mt-1 text-tinta-2">
        {[
          c.valorSacolinha ? `Sacolinha ${formatBRL(c.valorSacolinha)}` : null,
          c.prazoEntrega ? `entrega até ${formatIsoDate(c.prazoEntrega)}` : null,
          c.dataInicio && c.dataFim ? `${formatIsoDate(c.dataInicio)} a ${formatIsoDate(c.dataFim)}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {avisos.length > 0 && (
        <ul className="mt-5 space-y-1 rounded-xl border border-amarelo/60 bg-amarelo/10 p-4 text-sm">
          {avisos.map((a) => (
            <li key={a}>• {a}</li>
          ))}
        </ul>
      )}

      {resumo.atrasados.length > 0 && (
        <div className="mt-5 rounded-xl border border-vermelho/30 bg-vermelho/5 p-4 text-sm">
          <p className="font-semibold text-vermelho">
            {resumo.atrasados.length} entrega(s) no balcão passaram do prazo. As crianças continuam reservadas até alguém decidir.
          </p>
          <ul className="mt-2 space-y-1">
            {resumo.atrasados.map((a) => (
              <li key={a.id}>
                <Link href={`/pedidos/${a.id}`} className="underline underline-offset-2">
                  Pedido #{a.id} · {a.nome}
                </Link>{" "}
                (prazo {a.prazoEntrega && formatIsoDate(a.prazoEntrega)})
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Numero label="Crianças" valor={resumo.total} />
        {STATUS_PARTICIPACAO.map((s) => (
          <Numero key={s} label={STATUS_LABEL[s]} valor={resumo.status[s] ?? 0} />
        ))}
        <Numero label="Recebido online" valor={formatBRL(resumo.recebidoCentavos)} detalhe={`${resumo.pedidosPagos} pedido(s)`} />
      </section>
      {resumo.canais.length > 0 && (
        <p className="mt-3 text-sm text-tinta-2">
          Por canal: {resumo.canais.map((r) => `${r.canal ? CANAL_LABEL[r.canal] : "sem canal"} ${r.n}`).join(" · ")}
        </p>
      )}

      <section className="mt-10">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-xl font-semibold">Crianças da campanha</h2>
          {[null, ...STATUS_PARTICIPACAO].map((s) => (
            <Link
              key={s ?? "todas"}
              href={s ? `/campanhas/${id}?status=${s}` : `/campanhas/${id}`}
              className={`rounded-lg px-3 py-1 text-sm ${filtro === s ? "bg-tinta text-white" : "bg-white text-tinta-2 ring-1 ring-linha hover:text-tinta"}`}
            >
              {s ? STATUS_LABEL[s] : "Todas"}
            </Link>
          ))}
        </div>
        {linhas.length === 0 ? (
          <p className="cartao mt-4 p-8 text-center text-tinta-2">Nenhuma criança {filtro ? "com esse status" : "na campanha"}.</p>
        ) : (
          <div className="cartao mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-linha text-left text-xs text-tinta-2 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Criança</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Quem ajudou</th>
                  <th className="px-4 py-3 font-semibold">Canal</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {linhas.map(({ p, c: cr, modalidade }) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5">
                      <Link href={`/criancas/${cr.id}`} className="flex items-center gap-3 font-semibold hover:text-verde">
                        <FotoCrianca id={cr.id} versao={cr.fotoKey ?? cr.avatarKey} />
                        <span>
                          {cr.nome}
                          <span className="block text-xs font-normal text-tinta-2">
                            {[idadeTexto(cr.dataNascimento), [cr.tamanhoCamiseta, cr.tamanhoCalca, cr.tamanhoCalcado].map((t) => t || "—").join(" · ")].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status} label={STATUS_LABEL[p.status]} />
                      {p.status === "reservada" && modalidade && (
                        <span className="block text-xs text-tinta-2">{modalidade === "entrega_balcao" ? "vai entregar no balcão" : "pagando online"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-tinta-2">
                      {p.padrinhoNome ?? "—"}
                      {p.pedidoId && (
                        <Link href={`/pedidos/${p.pedidoId}`} className="block text-xs text-verde hover:underline">
                          Pedido #{p.pedidoId}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-tinta-2">{p.canal ? CANAL_LABEL[p.canal] : "—"}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <Link href={`/campanhas/${id}/p/${p.id}`} className="text-verde hover:underline">
                        Registrar
                      </Link>
                      {p.status === "disponivel" && (
                        <form action={removerDaCampanha.bind(null, p.id)} className="ml-3 inline">
                          <ConfirmButton message={`Tirar ${cr.nome} desta campanha?`} className="text-tinta-2 hover:text-vermelho">
                            Tirar
                          </ConfirmButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="cartao mt-8 p-5">
        <h2 className="text-lg font-semibold">Adicionar crianças</h2>
        {foraDaCampanha.length === 0 ? (
          <p className="mt-1 text-sm text-tinta-2">Todas as crianças ativas já estão nesta campanha.</p>
        ) : (
          <>
            <form action={adicionarCriancas.bind(null, id)} className="mt-2">
              <input type="hidden" name="todas" value="1" />
              <SubmitButton className="btn btn-claro btn-sm" pendingText="Adicionando…">
                Adicionar todas as {foraDaCampanha.length} crianças ativas
              </SubmitButton>
            </form>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-verde">Escolher uma a uma</summary>
              <form action={adicionarCriancas.bind(null, id)} className="mt-3">
                <div className="grid max-h-80 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                  {foraDaCampanha.map((cr) => (
                    <label key={cr.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-creme/50">
                      <input type="checkbox" name="crianca" value={cr.id} className="size-4 accent-verde" />
                      {cr.nome}
                      {cr.dataNascimento && <span className="text-tinta-2">· {idadeTexto(cr.dataNascimento)}</span>}
                    </label>
                  ))}
                </div>
                <SubmitButton className="btn btn-primario btn-sm mt-3" pendingText="Adicionando…">
                  Adicionar selecionadas
                </SubmitButton>
              </form>
            </details>
          </>
        )}
      </section>
    </div>
  );
}

function Numero({ label, valor, detalhe }: { label: string; valor: number | string; detalhe?: string }) {
  return (
    <div className="cartao p-4">
      <p className="text-xs font-semibold text-tinta-2 uppercase">{label}</p>
      <p className="mt-1 font-titulo text-2xl font-semibold">{valor}</p>
      {detalhe && <p className="text-xs text-tinta-2">{detalhe}</p>}
    </div>
  );
}
