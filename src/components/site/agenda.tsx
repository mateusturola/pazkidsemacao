"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapaLeaflet, Marker } from "leaflet";
import type { PontoAgenda } from "@/lib/agenda";
import { corDoDia as cor, lugaresDaAgenda, type Lugar } from "@/lib/agenda-pontos";

const rota = (p: PontoAgenda) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.endereco)}`;

function mediana(v: number[]) {
  const o = [...v].sort((a, b) => a - b);
  return o[Math.floor(o.length / 2)];
}

/** Monta o mapa do Leaflet com um pino numerado por lugar, enquadrado onde está a maioria dos encontros. */
function useMapa(lugares: Lugar[], aoTocar?: (n: number) => void) {
  const caixa = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const pinos = useRef(new Map<number, Marker>());
  const tocar = useRef(aoTocar);
  tocar.current = aoTocar;

  useEffect(() => {
    let cancelado = false;
    const marcados = pinos.current;
    (async () => {
      // O Leaflet mexe em window ao carregar: só entra no navegador.
      const L = (await import("leaflet")).default;
      if (cancelado || !caixa.current || mapa.current || !lugares.length) return;
      const toque = window.matchMedia("(pointer: coarse)").matches;
      const m = L.map(caixa.current, {
        scrollWheelZoom: false,
        // No celular, arrastar com um dedo rola a página em vez de prender o leitor no mapa.
        dragging: !toque,
        attributionControl: true,
        // Zoom quebrado: o enquadramento aproveita a largura do mapa baixo da página inicial.
        zoomSnap: 0.25,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(m);
      for (const l of lugares) {
        const c = cor(l.pontos[0].dia);
        const icone = L.divIcon({
          className: "",
          html: `<span class="pino-agenda" style="--c:${c}">${l.n}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        const linhas = l.pontos.map((p) => `<strong>${p.dia}, ${p.hora}</strong> · ${p.nome}`).join("<br>");
        const pino = L.marker([l.lat, l.lng], { icon: icone, title: l.pontos[0].nome })
          .addTo(m)
          .bindPopup(`${linhas}<br><a href="${rota(l.pontos[0])}" target="_blank" rel="noopener">Como chegar</a>`);
        pino.on("click", () => tocar.current?.(l.n));
        marcados.set(l.n, pino);
      }
      // Um ponto mais longe (Diadema) deixaria Heliópolis minúsculo, com os pinos uns sobre os
      // outros. Ele continua no mapa e aparece ao tocar na lista ou tirar o zoom.
      const meio = L.latLng(mediana(lugares.map((l) => l.lat)), mediana(lugares.map((l) => l.lng)));
      const perto = lugares.filter((l) => meio.distanceTo([l.lat, l.lng]) < 3000);
      m.fitBounds(L.latLngBounds((perto.length ? perto : lugares).map((l) => [l.lat, l.lng] as [number, number])), { padding: [40, 40] });
      mapa.current = m;
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      marcados.clear();
    };
  }, [lugares]);

  return { caixa, mapa, pinos };
}

/** Só o mapa, largo e baixo: o da página inicial, embaixo dos dias. */
export function MapaAgenda({ agenda, className = "" }: { agenda: PontoAgenda[]; className?: string }) {
  const lugares = useMemo(() => lugaresDaAgenda(agenda), [agenda]);
  const { caixa } = useMapa(lugares);
  if (!lugares.length) return null;
  return <div ref={caixa} className={`isolate bg-creme ${className}`} role="region" aria-label="Mapa dos encontros da semana" />;
}

export function Agenda({ agenda }: { agenda: PontoAgenda[] }) {
  const lugares = useMemo(() => lugaresDaAgenda(agenda), [agenda]);
  const numero = (p: PontoAgenda) => lugares.find((l) => l.pontos.includes(p))?.n;

  const dias = useMemo(() => [...new Set(agenda.map((p) => p.dia))], [agenda]);
  const [ativo, setAtivo] = useState<number | null>(null);
  const { caixa, mapa, pinos } = useMapa(lugares, setAtivo);

  function mostrar(n: number | undefined) {
    if (!n) return;
    setAtivo(n);
    const pino = pinos.current.get(n);
    if (!pino || !mapa.current) return;
    mapa.current.flyTo(pino.getLatLng(), 16, { duration: 0.6 });
    pino.openPopup();
  }

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:items-start">
      <div className="order-2 space-y-8 lg:order-1">
        {dias.map((dia) => (
          <div key={dia}>
            <p className="chamada" style={{ color: cor(dia) }}>
              {dia}
            </p>
            <ul className="mt-3 divide-y divide-linha border-y border-linha">
              {agenda
                .filter((p) => p.dia === dia)
                .map((p) => {
                  const n = numero(p);
                  return (
                    <li key={`${p.dia}${p.hora}${p.nome}`} className={`flex items-start gap-4 py-4 transition-colors ${n && n === ativo ? "bg-white/70" : ""}`}>
                      <button
                        type="button"
                        onClick={() => mostrar(n)}
                        disabled={!n}
                        aria-label={n ? `Mostrar ${p.nome} no mapa` : undefined}
                        className="flex min-w-0 flex-1 items-start gap-4 text-left disabled:cursor-default"
                      >
                        <span
                          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full font-titulo text-sm font-semibold text-white"
                          style={{ background: n ? cor(p.dia) : "transparent", boxShadow: n ? undefined : `inset 0 0 0 2px ${cor(p.dia)}` }}
                          aria-hidden
                        >
                          {n ?? ""}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-titulo text-lg leading-snug font-semibold text-verde">
                            <span className="tabular-nums">{p.hora}</span> · {p.nome}
                          </span>
                          <span className="mt-0.5 block text-[15px] text-tinta-2">
                            {p.endereco}
                            {p.complemento && <> · {p.complemento}</>}
                          </span>
                        </span>
                      </button>
                      <a
                        href={rota(p)}
                        target="_blank"
                        rel="noopener"
                        className="mt-1 shrink-0 text-sm font-bold text-verde underline decoration-amarelo decoration-2 underline-offset-4"
                      >
                        Como chegar
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
      <div className="order-1 lg:sticky lg:top-24 lg:order-2">
        <div ref={caixa} className="isolate h-80 overflow-clip rounded-2xl border border-linha bg-creme sm:h-[460px] lg:h-[560px]" role="region" aria-label="Mapa dos encontros da semana" />
      </div>
    </div>
  );
}
