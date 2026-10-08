"use client";

import { useState, useTransition } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { IconeCartao, IconePix } from "./icones";

export function PagamentoDemo({
  forma,
  parcelas,
  valor,
  qrSvg,
  copiaECola,
  reservadoAte,
  pagar,
}: {
  forma: "pix" | "cartao";
  parcelas: number;
  valor: string;
  qrSvg: string;
  copiaECola: string;
  reservadoAte: number | null;
  pagar: () => Promise<void>;
}) {
  const [aba, setAba] = useState(forma);
  const [pending, start] = useTransition();
  const confirmar = () => start(() => pagar());

  return (
    <div className="mt-6 overflow-clip rounded-3xl bg-white shadow-[0_1px_0_var(--color-linha)]">
      <div className="grid grid-cols-2 border-b border-linha">
        {(["pix", "cartao"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setAba(k)}
            className={`flex items-center justify-center gap-2 py-4 font-titulo text-lg font-semibold ${aba === k ? "bg-white text-verde" : "bg-creme/60 text-tinta-2"}`}
          >
            {k === "pix" ? <IconePix className="size-5" /> : <IconeCartao className="size-5" />}
            {k === "pix" ? "Pix" : "Cartão"}
          </button>
        ))}
      </div>

      {aba === "pix" ? (
        <div className="p-6 text-center">
          <div className="mx-auto size-56 rounded-2xl border border-linha p-4 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <p className="mt-4 text-tinta-2">Abra o app do seu banco, escolha pagar com Pix e aponte a câmera para o código.</p>
          <div className="mt-4 rounded-xl bg-creme p-3 text-left font-mono text-xs break-all text-tinta-2">{copiaECola}</div>
          <div className="mt-3">
            <CopyButton value={copiaECola} label="Copiar código Pix" className="btn btn-claro btn-sm" />
          </div>
          <button type="button" onClick={confirmar} disabled={pending} className="btn btn-acao mt-6 w-full">
            {pending ? "Confirmando…" : "Já paguei (simular confirmação)"}
          </button>
        </div>
      ) : (
        <form
          className="space-y-4 p-6"
          onSubmit={(e) => {
            // Os dados do cartão nunca saem deste navegador: é só a simulação do formulário.
            e.preventDefault();
            confirmar();
          }}
        >
          <label className="block">
            <span className="rotulo">Número do cartão</span>
            <input className="campo" inputMode="numeric" placeholder="0000 0000 0000 0000" autoComplete="off" />
          </label>
          <label className="block">
            <span className="rotulo">Nome impresso no cartão</span>
            <input className="campo" autoComplete="off" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="rotulo">Validade</span>
              <input className="campo" placeholder="MM/AA" autoComplete="off" />
            </label>
            <label className="block">
              <span className="rotulo">CVV</span>
              <input className="campo" inputMode="numeric" placeholder="123" autoComplete="off" />
            </label>
          </div>
          <button disabled={pending} className="btn btn-acao w-full">
            {pending ? "Processando…" : `Pagar ${valor}${parcelas > 1 ? ` em ${parcelas}x` : ""}`}
          </button>
        </form>
      )}
      {reservadoAte && <p className="border-t border-linha px-6 py-3 text-center text-sm text-tinta-2">As crianças ficam reservadas para você por 30 minutos.</p>}
    </div>
  );
}
