"use client";

import { useActionState, useEffect, useState } from "react";
import type { Estado } from "@/app/(site)/[slug]/finalizar/actions";
import { chaveCarrinho } from "./grade-criancas";

type Ponto = { id: number; nome: string; endereco: string | null; horarios: string | null };

export function FinalizarForm({
  slug,
  acao,
  online,
  balcao,
  valorTotal,
  maxParcelas,
  prazo,
  pontos,
}: {
  slug: string;
  acao: (prev: Estado, form: FormData) => Promise<Estado>;
  online: boolean;
  balcao: boolean;
  valorTotal: string | null;
  maxParcelas: number;
  prazo: string | null;
  pontos: Ponto[];
}) {
  const [estado, formAction, pending] = useActionState(acao, null);
  const [modalidade, setModalidade] = useState(online ? "pagamento_online" : "entrega_balcao");
  const [forma, setForma] = useState("pix");

  // Quem foi escolhido por outra pessoa sai do carrinho, para a volta à lista já vir certa.
  useEffect(() => {
    if (!estado?.indisponiveis?.length) return;
    try {
      const k = chaveCarrinho(slug);
      const ids = (JSON.parse(localStorage.getItem(k) ?? "[]") as number[]).filter((id) => !estado.indisponiveis!.includes(id));
      localStorage.setItem(k, JSON.stringify(ids));
    } catch {}
  }, [estado, slug]);

  return (
    <form action={formAction} className="space-y-8">
      {online && balcao && (
        <fieldset>
          <legend className="font-titulo text-2xl font-semibold text-verde">Como você vai ajudar?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Opcao nome="modalidade" valor="pagamento_online" atual={modalidade} onChange={setModalidade} titulo={`Pagar online · ${valorTotal}`}>
              Pix ou cartão. A equipe compra e monta a sacolinha.
            </Opcao>
            <Opcao nome="modalidade" valor="entrega_balcao" atual={modalidade} onChange={setModalidade} titulo="Montar e entregar">
              Você compra os itens e entrega num ponto de coleta até {prazo}.
            </Opcao>
          </div>
        </fieldset>
      )}
      {!(online && balcao) && <input type="hidden" name="modalidade" value={modalidade} />}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-titulo text-2xl font-semibold text-verde">Seus dados</legend>
        <label className="block sm:col-span-2">
          <span className="rotulo">Nome completo</span>
          <input name="nome" required autoComplete="name" className="campo" />
        </label>
        <label className="block">
          <span className="rotulo">E-mail</span>
          <input name="email" type="email" required autoComplete="email" className="campo" />
        </label>
        <label className="block">
          <span className="rotulo">WhatsApp</span>
          <input name="telefone" type="tel" required autoComplete="tel" placeholder="(11) 90000-0000" className="campo" />
        </label>
        {modalidade === "pagamento_online" && (
          <label className="block">
            <span className="rotulo">CPF</span>
            <input name="cpf" required inputMode="numeric" placeholder="000.000.000-00" className="campo" />
            <span className="mt-1 block text-xs text-tinta-2">Exigido para gerar a cobrança.</span>
          </label>
        )}
      </fieldset>

      {modalidade === "pagamento_online" ? (
        <fieldset>
          <legend className="font-titulo text-2xl font-semibold text-verde">Pagamento · {valorTotal}</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Opcao nome="forma" valor="pix" atual={forma} onChange={setForma} titulo="Pix">
              Aprovação na hora.
            </Opcao>
            <Opcao nome="forma" valor="cartao" atual={forma} onChange={setForma} titulo="Cartão de crédito">
              {maxParcelas > 1 ? `Em até ${maxParcelas}x.` : "À vista."}
            </Opcao>
          </div>
          {forma === "cartao" && maxParcelas > 1 && (
            <label className="mt-4 block max-w-xs">
              <span className="rotulo">Parcelas</span>
              <select name="parcelas" className="campo" defaultValue="1">
                {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? "À vista" : `${n}x`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="mt-3 text-sm text-tinta-2">
            As crianças ficam reservadas para você por 30 minutos enquanto o pagamento não confirma. Depois disso, voltam para a lista.
          </p>
        </fieldset>
      ) : (
        <fieldset>
          <legend className="font-titulo text-2xl font-semibold text-verde">Onde você vai entregar?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {pontos.map((p) => (
              <label key={p.id} className="cartao flex cursor-pointer gap-3 p-4 has-[:checked]:border-verde has-[:checked]:shadow-[0_0_0_2px_var(--color-verde)]">
                <input type="radio" name="ponto" value={p.id} required className="mt-1 size-4 accent-verde" defaultChecked={pontos.length === 1} />
                <span>
                  <span className="block font-semibold">{p.nome}</span>
                  {p.endereco && <span className="block text-sm whitespace-pre-line text-tinta-2">{p.endereco}</span>}
                  {p.horarios && <span className="mt-1 block text-sm whitespace-pre-line">{p.horarios}</span>}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm text-tinta-2">As crianças ficam reservadas para você até {prazo}.</p>
        </fieldset>
      )}

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="aceite" value="1" required className="mt-0.5 size-4 accent-verde" />
        <span>Autorizo o Paz Kids em Ação a usar meus dados só para esta campanha: confirmar o apadrinhamento e falar comigo sobre a entrega.</span>
      </label>

      {estado?.erro && (
        <p className="rounded-xl border border-vermelho/30 bg-vermelho/5 p-4 text-vermelho" role="alert">
          {estado.erro}
        </p>
      )}

      <button className="btn btn-acao h-14 w-full px-8 text-lg sm:w-auto" disabled={pending}>
        {pending ? "Reservando…" : modalidade === "pagamento_online" ? "Reservar e ir para o pagamento" : "Reservar as crianças"}
      </button>
    </form>
  );
}

function Opcao({ nome, valor, atual, onChange, titulo, children }: { nome: string; valor: string; atual: string; onChange: (v: string) => void; titulo: string; children: React.ReactNode }) {
  return (
    <label className={`cartao flex cursor-pointer gap-3 p-4 ${atual === valor ? "border-verde shadow-[0_0_0_2px_var(--color-verde)]" : ""}`}>
      <input type="radio" name={nome} value={valor} checked={atual === valor} onChange={() => onChange(valor)} className="mt-1 size-4 accent-verde" />
      <span>
        <span className="block font-semibold">{titulo}</span>
        <span className="block text-sm text-tinta-2">{children}</span>
      </span>
    </label>
  );
}
