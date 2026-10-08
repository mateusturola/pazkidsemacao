import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, and } from "drizzle-orm";
import { FotoCrianca } from "@/components/painel/foto-crianca";
import { StatusBadge } from "@/components/painel/status-badge";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { MODALIDADE_LABEL, STATUS_LABEL, STATUS_PEDIDO_LABEL } from "@/lib/campanhas";
import { formatDateTime, formatIsoDate, todayIso } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { STATUS_EMAIL, TIPO_EMAIL } from "@/lib/email-labels";
import { cancelar, entregue, pagamentoManual, salvarObservacoes } from "../actions";

export const metadata: Metadata = { title: "Pedido" };

const { pedidos, padrinhos, campanhas, pedidoItens, criancas, participacoes, pontosColeta, logAuditoria } = schema;

/** CPF só com os 3 primeiros e os 2 últimos dígitos: o painel inteiro não precisa do documento. */
function cpfParcial(cpf: string | null) {
  if (!cpf || cpf.length !== 11) return cpf;
  return `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}`;
}

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const db = getDb();
  const [linha] = await db
    .select({ p: pedidos, padrinho: padrinhos, campanha: campanhas, ponto: pontosColeta })
    .from(pedidos)
    .innerJoin(padrinhos, eq(padrinhos.id, pedidos.padrinhoId))
    .innerJoin(campanhas, eq(campanhas.id, pedidos.campanhaId))
    .leftJoin(pontosColeta, eq(pontosColeta.id, pedidos.pontoColetaId))
    .where(eq(pedidos.id, id))
    .limit(1);
  if (!linha) notFound();
  const { p, padrinho, campanha, ponto } = linha;

  const [itens, historico, emails] = await Promise.all([
    db
      .select({ c: criancas, status: participacoes.status, pedidoDaParticipacao: participacoes.pedidoId, mensagem: pedidoItens.mensagem, vaiOrar: pedidoItens.vaiOrar })
      .from(pedidoItens)
      .innerJoin(criancas, eq(criancas.id, pedidoItens.criancaId))
      .leftJoin(participacoes, and(eq(participacoes.criancaId, pedidoItens.criancaId), eq(participacoes.campanhaId, p.campanhaId)))
      .where(eq(pedidoItens.pedidoId, id)),
    db
      .select()
      .from(logAuditoria)
      .where(and(eq(logAuditoria.entidade, "pedido"), eq(logAuditoria.entidadeId, String(id))))
      .orderBy(desc(logAuditoria.criadoEm)),
    db.select().from(schema.emailsEnviados).where(eq(schema.emailsEnviados.pedidoId, id)).orderBy(desc(schema.emailsEnviados.criadoEm)),
  ]);

  const atrasado = p.status === "aguardando_entrega" && p.prazoEntrega && p.prazoEntrega < todayIso();
  const aberto = p.status === "pendente" || p.status === "aguardando_entrega";

  return (
    <div className="max-w-4xl">
      <Link href="/pedidos" className="text-sm text-tinta-2 hover:text-tinta">
        ← Pedidos
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">Pedido #{p.id}</h1>
        <StatusBadge status={p.status} label={STATUS_PEDIDO_LABEL[p.status]} />
      </div>
      <p className="mt-1 text-tinta-2">
        <Link href={`/campanhas/${campanha.id}`} className="hover:text-verde">
          {campanha.nome}
        </Link>{" "}
        · {MODALIDADE_LABEL[p.modalidade]} · feito em {formatDateTime(p.criadoEm)}
      </p>

      {p.pendencia && (
        <div className="mt-5 rounded-xl border border-vermelho/30 bg-vermelho/5 p-4 text-sm whitespace-pre-line">
          <p className="font-semibold text-vermelho">Pendência</p>
          {p.pendencia}
        </div>
      )}
      {atrasado && (
        <div className="mt-5 rounded-xl border border-vermelho/30 bg-vermelho/5 p-4 text-sm">
          <p className="font-semibold text-vermelho">O prazo de entrega ({formatIsoDate(p.prazoEntrega!)}) passou.</p>
          Fale com o padrinho. Se ele desistiu, cancele o pedido para as crianças voltarem para o site.
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="cartao p-5">
          <h2 className="text-lg font-semibold">Padrinho</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Item k="Nome" v={padrinho.nome} />
            <Item k="E-mail" v={padrinho.email} />
            <Item k="Telefone" v={padrinho.telefone} />
            {padrinho.cpf && <Item k="CPF" v={cpfParcial(padrinho.cpf)} />}
          </dl>
          {padrinho.telefone && (
            <a
              href={`https://wa.me/55${padrinho.telefone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "")}`}
              target="_blank"
              rel="noopener"
              className="btn btn-claro btn-sm mt-4"
            >
              Abrir WhatsApp
            </a>
          )}
        </section>

        <section className="cartao p-5">
          <h2 className="text-lg font-semibold">{p.modalidade === "pagamento_online" ? "Pagamento" : "Entrega"}</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            {p.modalidade === "pagamento_online" ? (
              <>
                <Item k="Valor" v={p.valor ? formatBRL(p.valor) : null} />
                <Item k="Forma" v={p.forma === "cartao" ? `Cartão${p.parcelas > 1 ? ` em ${p.parcelas}x` : ""}` : "Pix"} />
                {p.status === "pendente" && p.reservadoAte && <Item k="Reserva até" v={formatDateTime(p.reservadoAte)} />}
                {p.pagoEm && <Item k="Pago em" v={formatDateTime(p.pagoEm)} />}
                {p.asaasPaymentId && (
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-tinta-2">Asaas</dt>
                    <dd>
                      {p.asaasInvoiceUrl ? (
                        <a href={p.asaasInvoiceUrl} target="_blank" rel="noopener" className="text-verde hover:underline">
                          {p.asaasPaymentId}
                        </a>
                      ) : (
                        p.asaasPaymentId
                      )}
                    </dd>
                  </div>
                )}
              </>
            ) : (
              <>
                <Item k="Ponto de coleta" v={ponto?.nome} />
                <Item k="Prazo" v={p.prazoEntrega ? formatIsoDate(p.prazoEntrega) : null} />
              </>
            )}
            {p.entregueEm && <Item k="Entregue em" v={formatDateTime(p.entregueEm)} />}
          </dl>
        </section>
      </div>

      <section className="cartao mt-6 p-5">
        <h2 className="text-lg font-semibold">Crianças</h2>
        <ul className="mt-3 divide-y divide-linha">
          {itens.map(({ c, status, pedidoDaParticipacao, mensagem, vaiOrar }) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
              <FotoCrianca id={c.id} versao={c.fotoKey ?? c.avatarKey} />
              <Link href={`/criancas/${c.id}`} className="font-semibold hover:text-verde">
                {c.nome}
              </Link>
              <span className="text-tinta-2">
                Camiseta {c.tamanhoCamiseta || "—"} · Calça {c.tamanhoCalca || "—"} · Calçado {c.tamanhoCalcado || "—"}
              </span>
              <span className="ml-auto">
                {pedidoDaParticipacao === p.id && status ? (
                  <StatusBadge status={status} label={STATUS_LABEL[status]} />
                ) : (
                  <span className="text-xs text-tinta-2">não está mais com este pedido</span>
                )}
              </span>
              {(mensagem || vaiOrar) && (
                <div className="w-full rounded-lg bg-creme/60 px-3 py-2 text-tinta">
                  {mensagem && <p className="whitespace-pre-line">“{mensagem}”</p>}
                  {vaiOrar && <p className="mt-1 text-xs font-bold text-verde">Vai orar pela criança</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 flex flex-wrap gap-3">
        {(p.status === "aguardando_entrega" || p.status === "pago") && (
          <form action={entregue.bind(null, p.id)}>
            <ConfirmButton message="Confirmar que a sacolinha chegou?" className="btn btn-primario">
              Marcar sacolinha entregue
            </ConfirmButton>
          </form>
        )}
        {p.status === "pendente" && (
          <form action={pagamentoManual.bind(null, p.id)}>
            <ConfirmButton message="Confirmar que o pagamento foi recebido por fora do Asaas?" className="btn btn-claro">
              Recebido por fora
            </ConfirmButton>
          </form>
        )}
        {aberto && (
          <form action={cancelar.bind(null, p.id)}>
            <ConfirmButton message="Cancelar o pedido e devolver as crianças para o site?" className="btn btn-claro text-vermelho">
              Cancelar e liberar crianças
            </ConfirmButton>
          </form>
        )}
      </section>

      <section className="cartao mt-6 p-5">
        <h2 className="text-lg font-semibold">Observações da equipe</h2>
        <ActionForm action={salvarObservacoes.bind(null, p.id)} className="mt-3 space-y-3">
          <textarea name="observacoes" rows={3} defaultValue={p.observacoes ?? ""} className="campo" />
          {p.pendencia && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="resolvida" value="1" className="size-4 accent-verde" />
              Pendência resolvida
            </label>
          )}
          <SubmitButton className="btn btn-claro btn-sm">Salvar</SubmitButton>
        </ActionForm>
      </section>

      {emails.length > 0 && (
        <section className="cartao mt-6 p-5">
          <h2 className="text-lg font-semibold">E-mails ao padrinho</h2>
          <ul className="mt-3 divide-y divide-linha text-sm">
            {emails.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-3 py-2">
                <Link href={`/emails/${e.id}`} className="font-semibold hover:text-verde">
                  {TIPO_EMAIL[e.tipo]}
                </Link>
                <span className={STATUS_EMAIL[e.status].cor}>{STATUS_EMAIL[e.status].label}</span>
                <span className="ml-auto text-tinta-2">{formatDateTime(e.criadoEm)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {historico.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-tinta-2 uppercase">Histórico</h2>
          <ul className="mt-2 space-y-1 text-sm text-tinta-2">
            {historico.map((h) => (
              <li key={h.id}>
                {formatDateTime(h.criadoEm)} · {h.acao} · {h.autor}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Item({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-tinta-2">{k}</dt>
      <dd className="min-w-0 break-words">{v || "—"}</dd>
    </div>
  );
}
