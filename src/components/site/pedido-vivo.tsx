"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { chaveCarrinho } from "./grade-criancas";

/** O pedido foi feito: o carrinho daquela campanha esvazia. */
export function LimparCarrinho({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      localStorage.removeItem(chaveCarrinho(slug));
    } catch {}
  }, [slug]);
  return null;
}

/** Enquanto o pagamento não confirma, a página se atualiza sozinha e mostra quanto falta da reserva. */
export function AguardandoPagamento({ ate }: { ate: number }) {
  const router = useRouter();
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const relogio = setInterval(() => setAgora(Date.now()), 1000);
    const atualizar = setInterval(() => router.refresh(), 10_000);
    return () => {
      clearInterval(relogio);
      clearInterval(atualizar);
    };
  }, [router]);
  const resta = Math.max(0, ate - agora);
  const min = Math.floor(resta / 60000);
  const seg = Math.floor((resta % 60000) / 1000);
  return (
    <p className="text-sm text-tinta-2">
      {resta > 0 ? (
        <>
          Reserva garantida por mais{" "}
          <strong className="font-titulo text-base text-tinta tabular-nums">
            {min}:{String(seg).padStart(2, "0")}
          </strong>
          . Esta página se atualiza sozinha quando o pagamento confirmar.
        </>
      ) : (
        "O tempo da reserva acabou. Se você já pagou, aguarde: a confirmação chega em instantes."
      )}
    </p>
  );
}
