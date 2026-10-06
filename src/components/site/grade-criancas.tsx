"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MAX_POR_PEDIDO } from "@/lib/regras";
import { IconeCheck, IconeSacola, IconeSeta } from "./icones";

export type CriancaCard = {
  id: number;
  nome: string;
  idade: number | null;
  idadeTexto: string | null;
  sexo: "F" | "M" | null;
  camiseta: string | null;
  calca: string | null;
  calcado: string | null;
  sugestao: string | null;
  gostos: string | null;
  imagem: string;
};

const FAIXAS = [
  { k: "", label: "Todas as idades" },
  { k: "0-3", label: "Até 3 anos", min: 0, max: 3 },
  { k: "4-6", label: "4 a 6 anos", min: 4, max: 6 },
  { k: "7-9", label: "7 a 9 anos", min: 7, max: 9 },
  { k: "10-99", label: "10 anos ou mais", min: 10, max: 99 },
];

/** A escolha fica no navegador até finalizar: a reserva de verdade só acontece no servidor. */
export function chaveCarrinho(slug: string) {
  return `pkea:carrinho:${slug}`;
}

// Etiqueta kraft com o canto cortado, como a etiqueta da sacolinha no manual da marca.
const ETIQUETA = "polygon(16% 0, 84% 0, 100% 9%, 100% 100%, 0 100%, 0 9%)";

export function GradeCriancas({ slug, criancas, aberta }: { slug: string; criancas: CriancaCard[]; aberta: boolean }) {
  const [escolhidas, setEscolhidas] = useState<number[]>([]);
  const [faixa, setFaixa] = useState("");
  const [sexo, setSexo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(chaveCarrinho(slug)) ?? "[]") as number[];
      // Quem saiu da lista (escolhida por outra pessoa) sai do carrinho também.
      const disponiveis = new Set(criancas.map((c) => c.id));
      setEscolhidas(salvo.filter((id) => disponiveis.has(id)));
    } catch {
      // Navegador sem armazenamento (aba anônima, por exemplo): o carrinho vive só nesta página.
    }
  }, [slug, criancas]);

  function salvar(ids: number[]) {
    setEscolhidas(ids);
    try {
      localStorage.setItem(chaveCarrinho(slug), JSON.stringify(ids));
    } catch {}
  }

  function alternar(id: number) {
    setAviso(null);
    if (escolhidas.includes(id)) salvar(escolhidas.filter((x) => x !== id));
    else if (escolhidas.length >= MAX_POR_PEDIDO) setAviso(`Dá para escolher até ${MAX_POR_PEDIDO} crianças por vez. Finalize estas e depois volte para escolher mais.`);
    else salvar([...escolhidas, id]);
  }

  const filtradas = useMemo(() => {
    const f = FAIXAS.find((x) => x.k === faixa);
    return criancas.filter((c) => (!sexo || c.sexo === sexo) && (!f || f.min === undefined || (c.idade != null && c.idade >= f.min && c.idade <= f.max!)));
  }, [criancas, faixa, sexo]);

  const nomes = escolhidas.map((id) => criancas.find((c) => c.id === id)?.nome).filter(Boolean);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={faixa} onChange={(e) => setFaixa(e.target.value)} className="campo w-auto bg-white" aria-label="Filtrar por idade">
          {FAIXAS.map((f) => (
            <option key={f.k} value={f.k}>
              {f.label}
            </option>
          ))}
        </select>
        <select value={sexo} onChange={(e) => setSexo(e.target.value)} className="campo w-auto bg-white" aria-label="Filtrar por menina ou menino">
          <option value="">Meninas e meninos</option>
          <option value="F">Meninas</option>
          <option value="M">Meninos</option>
        </select>
        <p className="ml-1 text-tinta-2">
          {filtradas.length} {filtradas.length === 1 ? "criança esperando" : "crianças esperando"}
        </p>
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-10 text-lg text-tinta-2">Nenhuma criança com esse filtro agora.</p>
      ) : (
        <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((c) => {
            const escolhida = escolhidas.includes(c.id);
            return (
              <li key={c.id} className={`relative transition-transform duration-300 ${escolhida ? "-rotate-1" : "hover:-translate-y-1"}`}>
                <div
                  className="relative flex h-full flex-col items-center px-6 pt-12 pb-6 text-center"
                  style={{
                    clipPath: ETIQUETA,
                    background: "radial-gradient(rgba(120,85,40,.07) 1px, transparent 1.4px) 0 0/7px 7px, var(--color-kraft)",
                  }}
                >
                  <span className="absolute top-4 left-1/2 size-5 -translate-x-1/2 rounded-full bg-papel shadow-[inset_0_1px_2px_rgba(0,0,0,.25)]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imagem} alt="" loading="lazy" className="size-28 rounded-full border-4 border-papel object-cover" />
                  <p className="chamada mt-5 text-verde/70">Para:</p>
                  <h3 className="font-mao text-[2.6rem] leading-none text-verde">{c.nome}</h3>
                  <p className="mt-1 font-bold text-verde/80">{[c.sexo === "F" ? "Menina" : c.sexo === "M" ? "Menino" : null, c.idadeTexto].filter(Boolean).join(" · ")}</p>
                  <dl className="mt-5 grid w-full grid-cols-3 gap-2">
                    {[
                      ["Camiseta", c.camiseta],
                      ["Calça", c.calca],
                      ["Calçado", c.calcado],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-papel/70 px-1 py-2">
                        <dt className="text-[11px] font-extrabold tracking-wider text-tinta-2 uppercase">{k}</dt>
                        <dd className="font-titulo text-xl font-bold text-verde">{v || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                  {(c.sugestao || c.gostos) && (
                    <div className="mt-4 w-full space-y-1 text-left text-[15px] text-tinta">
                      {c.sugestao && (
                        <p>
                          <span className="font-extrabold text-verde">Ideia de presente:</span> {c.sugestao}
                        </p>
                      )}
                      {c.gostos && (
                        <p>
                          <span className="font-extrabold text-verde">Gosta de:</span> {c.gostos}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex-1" />
                  {aberta && (
                    <button
                      type="button"
                      onClick={() => alternar(c.id)}
                      aria-pressed={escolhida}
                      className={`btn mt-6 w-full ${escolhida ? "bg-verde text-creme hover:bg-verde-2" : "btn-acao"}`}
                    >
                      {escolhida ? (
                        <>
                          <IconeCheck className="size-5" /> Na sua sacolinha
                        </>
                      ) : (
                        `Adotar a sacolinha de ${c.nome}`
                      )}
                    </button>
                  )}
                </div>
                {/* O laço vermelho marca quem já está na sacolinha do doador. */}
                {escolhida && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/natal/simbolos/coracao.svg" alt="" className="absolute -top-3 -right-2 size-12 rotate-12 drop-shadow-sm" />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {aviso && <p className="fixed inset-x-4 bottom-28 z-40 mx-auto max-w-md rounded-xl bg-tinta p-3 text-center text-sm text-white">{aviso}</p>}

      {escolhidas.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-verde text-creme shadow-[0_-8px_30px_rgba(20,52,38,.25)]">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-8">
            <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-creme/10 text-amarelo sm:grid">
              <IconeSacola className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-titulo text-lg font-semibold">
                {escolhidas.length} {escolhidas.length === 1 ? "sacolinha escolhida" : "sacolinhas escolhidas"}
              </p>
              <p className="truncate text-sm text-creme/75">Para {nomes.join(", ")}</p>
            </div>
            <button type="button" onClick={() => salvar([])} className="hidden text-sm text-creme/70 hover:text-creme sm:block">
              Limpar
            </button>
            <Link href={`/${slug}/finalizar?c=${escolhidas.join(",")}`} className="btn btn-acao shrink-0">
              Continuar <IconeSeta className="size-5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
