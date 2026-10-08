"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Número que sobe de zero até o valor quando aparece na tela. O HTML já vem com o valor final:
 * sem JavaScript, para o Google e para quem pede menos movimento no sistema, o número fica parado.
 */
export function Contador({ valor, duracao = 1800, className }: { valor: number; duracao?: number; className?: string }) {
  const [atual, setAtual] = useState(valor);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let quadro = 0;
    setAtual(0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const inicio = performance.now();
        const passo = (agora: number) => {
          const t = Math.min(1, (agora - inicio) / duracao);
          // Desacelera no fim: os últimos números passam devagar, e o valor final fica marcado.
          setAtual(Math.round(valor * (1 - Math.pow(1 - t, 3))));
          if (t < 1) quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(quadro);
    };
  }, [valor, duracao]);

  return (
    <span ref={ref} className={className}>
      {/* A largura não muda enquanto conta: o número final reserva o espaço. */}
      <span className="sr-only">{valor.toLocaleString("pt-BR")}</span>
      <span aria-hidden className="inline-grid tabular-nums">
        <span className="invisible col-start-1 row-start-1">{valor.toLocaleString("pt-BR")}</span>
        <span className="col-start-1 row-start-1 text-right">{atual.toLocaleString("pt-BR")}</span>
      </span>
    </span>
  );
}
