"use client";

import { useMemo, useState, useTransition } from "react";
import { avatarSvg, novaSemente } from "@/lib/avatar";

/**
 * Gera a prévia do avatar no navegador (DiceBear, sem custo e sem IA). "Gerar outro" troca a semente;
 * "Usar este" manda só a semente, e o servidor desenha de novo e guarda no R2.
 */
export function AvatarGerador({ seedAtual, salvar }: { seedAtual: string | null; salvar: (seed: string) => Promise<void> }) {
  const [seed, setSeed] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const src = useMemo(() => (seed ? `data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg(seed))}` : null), [seed]);

  if (!seed) {
    return (
      <button type="button" className="btn btn-claro btn-sm" onClick={() => setSeed(novaSemente())}>
        {seedAtual ? "Gerar outro avatar" : "Gerar avatar"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src!} alt="Prévia do avatar" className="size-24 rounded-xl" />
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="btn btn-primario btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setErro(null);
              try {
                await salvar(seed);
                setSeed(null);
              } catch {
                setErro("Não foi possível salvar.");
              }
            })
          }
        >
          {pending ? "Salvando…" : "Usar este"}
        </button>
        <button type="button" className="btn btn-claro btn-sm" disabled={pending} onClick={() => setSeed(novaSemente())}>
          Gerar outro
        </button>
        <button type="button" className="text-xs text-tinta-2 hover:text-tinta" disabled={pending} onClick={() => setSeed(null)}>
          Cancelar
        </button>
        {erro && <p className="text-xs text-vermelho">{erro}</p>}
      </div>
    </div>
  );
}
