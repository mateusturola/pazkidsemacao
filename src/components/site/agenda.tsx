"use client";

import { useMemo, useState } from "react";
import {
  ESTADOS,
  MAPA_TRANSFORM,
  MAPA_VIEWBOX,
  noEstado,
  UFS,
  type UF,
} from "@/content/mapa-brasil";
import { SITE } from "@/content/site";
import type { PontoAgenda } from "@/lib/agenda";
import { corDoDia } from "@/lib/agenda-pontos";

// Uma cor de balão do logo por estado atendido; amarelo fica de fora, porque some no fundo creme.
const CORES = [
  "#6b3fa0",
  "#1f74c9",
  "#e3262f",
  "#2c9a47",
  "#e8830c",
  "#1b1633",
  "#c2185b",
];
const APAGADO = "#e9dcb4";

const rota = (p: PontoAgenda) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.endereco)}`;

/**
 * O Brasil com os estados onde o projeto está. Passar o mouse mostra o nome; clicar (ou tocar, no
 * celular) escolhe o estado e mostra a agenda dele. Os botões com os nomes fazem o mesmo, para quem
 * usa teclado ou leitor de tela. `completo` mostra endereço e rota de cada encontro (/agenda).
 */
export function AgendaBrasil({
  estados,
  agenda,
  inicial,
  completo = false,
  cabecalho,
}: {
  estados: UF[];
  agenda: PontoAgenda[];
  inicial?: string;
  completo?: boolean;
  cabecalho?: React.ReactNode;
}) {
  const cor = useMemo(
    () =>
      Object.fromEntries(
        estados.map((u, i) => [u, CORES[i % CORES.length]]),
      ) as Record<UF, string>,
    [estados],
  );
  // Abre no estado com mais encontros cadastrados: é onde o visitante mais provavelmente está.
  const maisEncontros = [...estados].sort(
    (a, b) =>
      agenda.filter((p) => p.estado === b).length -
      agenda.filter((p) => p.estado === a).length,
  )[0];
  const [escolhido, setEscolhido] = useState<UF | undefined>(
    estados.find((u) => u === inicial) ?? maisEncontros,
  );
  const [sobre, setSobre] = useState<{ uf: UF; x: number; y: number } | null>(
    null,
  );

  const encontros = agenda.filter((p) => p.estado === escolhido);
  const dias = [...new Set(encontros.map((p) => p.dia))];
  const cidades = [
    ...new Set(encontros.map((p) => p.cidade).filter(Boolean)),
  ] as string[];

  return (
    // No celular: título, mapa e, embaixo, os estados com a agenda. No computador, o mapa fica à direita.
    <div className="grid items-start gap-x-14 gap-y-8 lg:grid-cols-[1fr_1.05fr]">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">{cabecalho}</div>

      <div
        className="relative lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        onMouseLeave={() => setSobre(null)}
      >
        <svg
          viewBox={MAPA_VIEWBOX}
          className="mx-auto h-auto w-full max-w-[560px]"
          role="img"
          aria-label={`Mapa do Brasil com os estados onde o ${SITE.nome} está`}
        >
          <g transform={MAPA_TRANSFORM}>
            {UFS.map((u) => {
              const atende = estados.includes(u);
              const ativo = u === escolhido;
              return (
                <path
                  key={u}
                  d={ESTADOS[u].d}
                  fill={atende ? cor[u] : APAGADO}
                  stroke={ativo ? "#1b1633" : "#fffbef"}
                  strokeWidth={ativo ? 2.5 : 1}
                  vectorEffect="non-scaling-stroke"
                  className={
                    atende
                      ? "cursor-pointer transition-opacity hover:opacity-85"
                      : undefined
                  }
                  onClick={atende ? () => setEscolhido(u) : undefined}
                  onMouseMove={
                    atende
                      ? (ev) => {
                          const caixa = (
                            ev.currentTarget.ownerSVGElement
                              ?.parentElement as HTMLElement
                          ).getBoundingClientRect();
                          setSobre({
                            uf: u,
                            x: ev.clientX - caixa.left,
                            y: ev.clientY - caixa.top,
                          });
                        }
                      : undefined
                  }
                >
                  <title>{ESTADOS[u].nome}</title>
                </path>
              );
            })}
          </g>
        </svg>
        {sobre && (
          <span
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-tinta px-3 py-1.5 text-sm font-bold whitespace-nowrap text-white"
            style={{ left: sobre.x, top: sobre.y - 10 }}
          >
            {ESTADOS[sobre.uf].nome}
          </span>
        )}
      </div>

      <div className="min-w-0 lg:col-start-1 lg:row-start-2">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Escolha o estado"
        >
          {estados.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setEscolhido(u)}
              aria-pressed={u === escolhido}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors ${
                u === escolhido
                  ? "border-transparent text-white"
                  : "border-linha bg-white text-tinta hover:border-tinta/30"
              }`}
              style={u === escolhido ? { background: cor[u] } : undefined}
            >
              {u !== escolhido && (
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: cor[u] }}
                  aria-hidden
                />
              )}
              {ESTADOS[u].nome}
            </button>
          ))}
        </div>

        {escolhido && (
          <div
            className="mt-6 rounded-[24px] bg-white p-6 sm:p-7"
            aria-live="polite"
          >
            <p className="font-titulo text-2xl font-semibold text-verde">
              {ESTADOS[escolhido].nome}
            </p>
            {cidades.length > 0 && (
              <p className="mt-1 text-tinta-2">{cidades.join(" · ")}</p>
            )}
            {encontros.length ? (
              <div
                className={`mt-5 grid gap-x-6 gap-y-6 ${completo ? "" : "sm:grid-cols-2"}`}
              >
                {dias.map((dia) => (
                  <div
                    key={dia}
                    className="border-t-4 pt-3"
                    style={{ borderColor: corDoDia(dia) }}
                  >
                    <p className="chamada" style={{ color: corDoDia(dia) }}>
                      {dia}
                    </p>
                    <ul className="mt-2 space-y-2.5">
                      {encontros
                        .filter((p) => p.dia === dia)
                        .map((p) => (
                          <li
                            key={`${p.hora}${p.nome}`}
                            className="leading-snug"
                          >
                            {p.hora && (
                              <span className="font-titulo font-semibold text-verde tabular-nums">
                                {p.hora}{" "}
                              </span>
                            )}
                            <span className="text-tinta">{p.nome}</span>
                            {completo && (
                              <span className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-4 text-[15px] text-tinta-2">
                                <span>
                                  {p.endereco}
                                  {p.complemento && <> · {p.complemento}</>}
                                </span>
                                <a
                                  href={rota(p)}
                                  target="_blank"
                                  rel="noopener"
                                  className="shrink-0 text-sm font-bold text-verde underline decoration-amarelo decoration-2 underline-offset-4"
                                >
                                  Como chegar
                                </a>
                              </span>
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-tinta-2">
                O Paz Kids em Ação está {noEstado(escolhido)}. Para saber onde e
                quando são os encontros, chame a gente no WhatsApp{" "}
                <a
                  href={SITE.whatsapp.link}
                  target="_blank"
                  rel="noopener"
                  className="font-bold text-verde underline decoration-amarelo decoration-2 underline-offset-4"
                >
                  {SITE.whatsapp.numero}
                </a>
                .
              </p>
            )}
            {!completo && encontros.length > 0 && (
              <a
                href={`/agenda?estado=${escolhido}`}
                className="btn btn-primario btn-sm mt-6"
              >
                Endereços e como chegar
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
