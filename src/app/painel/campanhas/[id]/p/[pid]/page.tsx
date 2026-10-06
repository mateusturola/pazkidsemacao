import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { FotoCrianca } from "@/components/painel/foto-crianca";
import { ActionForm } from "@/components/ui/action-form";
import { DatePicker } from "@/components/ui/date-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { CANAIS, STATUS_PARTICIPACAO } from "@/db/schema";
import { CANAL_LABEL, STATUS_LABEL } from "@/lib/campanhas";
import { getDb, schema } from "@/lib/db";
import { salvarParticipacao } from "../../../actions";

export const metadata: Metadata = { title: "Registrar apadrinhamento" };

export default async function ParticipacaoPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  const db = getDb();
  const [linha] = await db
    .select({ p: schema.participacoes, c: schema.criancas, campanha: schema.campanhas.nome })
    .from(schema.participacoes)
    .innerJoin(schema.criancas, eq(schema.criancas.id, schema.participacoes.criancaId))
    .innerJoin(schema.campanhas, eq(schema.campanhas.id, schema.participacoes.campanhaId))
    .where(eq(schema.participacoes.id, Number(pid)))
    .limit(1);
  if (!linha || linha.p.campanhaId !== Number(id)) notFound();
  const { p, c } = linha;

  return (
    <div className="max-w-2xl">
      <Link href={`/campanhas/${id}`} className="text-sm text-tinta-2 hover:text-tinta">
        ← {linha.campanha}
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <FotoCrianca id={c.id} versao={c.fotoKey ?? c.avatarKey} className="size-14" />
        <div>
          <h1 className="text-2xl font-semibold">{c.nome}</h1>
          <p className="text-sm text-tinta-2">
            Camiseta {c.tamanhoCamiseta || "—"} · Calça {c.tamanhoCalca || "—"} · Calçado {c.tamanhoCalcado || "—"}
          </p>
        </div>
      </div>

      {p.pedidoId && (
        <p className="mt-4 rounded-xl bg-creme p-3 text-sm">
          Esta criança está ligada ao{" "}
          <Link href={`/pedidos/${p.pedidoId}`} className="font-semibold text-verde underline underline-offset-2">
            pedido #{p.pedidoId}
          </Link>
          . Para entregas e pagamentos, prefira agir pelo pedido; aqui é para correções.
        </p>
      )}

      <div className="cartao mt-6 p-6">
        <ActionForm action={salvarParticipacao.bind(null, p.id)} className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="rotulo">Status</span>
            <select name="status" defaultValue={p.status} className="campo">
              {STATUS_PARTICIPACAO.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="rotulo">Canal</span>
            <select name="canal" defaultValue={p.canal ?? ""} className="campo">
              <option value="">—</option>
              {CANAIS.map((k) => (
                <option key={k} value={k}>
                  {CANAL_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="rotulo">Quem ajudou</span>
            <input name="padrinhoNome" defaultValue={p.padrinhoNome ?? ""} className="campo" />
          </label>
          <label className="block">
            <span className="rotulo">Contato</span>
            <input name="padrinhoContato" defaultValue={p.padrinhoContato ?? ""} placeholder="Telefone ou e-mail" className="campo" />
          </label>
          <div>
            <span className="rotulo">Data do apadrinhamento</span>
            <DatePicker name="dataApadrinhamento" defaultValue={p.dataApadrinhamento ?? ""} />
          </div>
          <div>
            <span className="rotulo">Data da entrega</span>
            <DatePicker name="dataEntrega" defaultValue={p.dataEntrega ?? ""} />
          </div>
          <label className="block sm:col-span-2">
            <span className="rotulo">Observações</span>
            <textarea name="observacoes" rows={3} defaultValue={p.observacoes ?? ""} className="campo" />
          </label>
          <p className="text-xs text-tinta-2 sm:col-span-2">Voltar para “Disponível” apaga o padrinho e devolve a criança para o site.</p>
          <div>
            <SubmitButton className="btn btn-primario">Salvar</SubmitButton>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
