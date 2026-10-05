"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MAX_POR_PEDIDO } from "@/lib/regras";

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

/** A escolha fica no navegador até finalizar: a reserva de verdade só acontece no servidor, ao finalizar. */
export function chaveCarrinho(slug: string) {
  return `pkea:carrinho:${slug}`;
}

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
      // Navegador sem armazenamento (aba anônima, por exemplo): o carrinho só vive nesta página.
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
    return criancas.filter(
      (c) => (!sexo || c.sexo === sexo) && (!f || f.min === undefined || (c.idade != null && c.idade >= f.min && c.idade <= f.max!)),
    );
  }, [criancas, faixa, sexo]);

  const nomes = escolhidas.map((id) => criancas.find((c) => c.id === id)?.nome).filter(Boolean);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <select value={faixa} onChange={(e) => setFaixa(e.target.value)} className="campo w-auto" aria-label="Filtrar por idade">
          {FAIXAS.map((f) => (
            <option key={f.k} value={f.k}>
              {f.label}
            </option>
          ))}
        </select>
        <select value={sexo} onChange={(e) => setSexo(e.target.value)} className="campo w-auto" aria-label="Filtrar por menino ou menina">
          <option value="">Meninas e meninos</option>
          <option value="F">Meninas</option>
          <option value="M">Meninos</option>
        </select>
        <p className="self-center text-sm text-tinta-2">{filtradas.length} criança(s)</p>
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-8 text-tinta-2">Nenhuma criança disponível com esse filtro.</p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((c) => {
            const escolhida = escolhidas.includes(c.id);
            return (
              <li key={c.id} className={`cartao flex flex-col overflow-hidden transition-[border-color,box-shadow] ${escolhida ? "border-roxo shadow-[0_0_0_3px_var(--color-roxo)]" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.imagem} alt="" loading="lazy" className="aspect-[4/3] w-full bg-creme object-cover" />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-2xl font-semibold">{c.nome}</h3>
                  <p className="text-tinta-2">{[c.sexo === "F" ? "Menina" : c.sexo === "M" ? "Menino" : null, c.idadeTexto].filter(Boolean).join(", ")}</p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      ["Camiseta", c.camiseta],
                      ["Calça", c.calca],
                      ["Calçado", c.calcado],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-creme px-2 py-2">
                        <dt className="text-[11px] font-semibold text-tinta-2 uppercase">{k}</dt>
                        <dd className="font-titulo text-lg font-semibold">{v || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                  {(c.sugestao || c.gostos) && (
                    <div className="mt-4 space-y-1 text-sm">
                      {c.sugestao && (
                        <p>
                          <span className="font-semibold">Sugestão de presente:</span> {c.sugestao}
                        </p>
                      )}
                      {c.gostos && (
                        <p>
                          <span className="font-semibold">Gosta de:</span> {c.gostos}
                        </p>
                      )}
                    </div>
                  )}
                  {aberta && (
                    <button
                      type="button"
                      onClick={() => alternar(c.id)}
                      aria-pressed={escolhida}
                      className={`btn mt-5 w-full ${escolhida ? "btn-escuro" : "btn-primario"}`}
                    >
                      {escolhida ? "Escolhida ✓ (tirar)" : `Apadrinhar ${c.nome}`}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {aviso && <p className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md rounded-xl bg-tinta p-3 text-center text-sm text-white">{aviso}</p>}

      {escolhidas.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="font-titulo text-lg font-semibold">
                {escolhidas.length} {escolhidas.length === 1 ? "criança escolhida" : "crianças escolhidas"}
              </p>
              <p className="truncate text-sm text-tinta-2">{nomes.join(", ")}</p>
            </div>
            <button type="button" onClick={() => salvar([])} className="hidden text-sm text-tinta-2 hover:text-tinta sm:block">
              Limpar
            </button>
            <Link href={`/${slug}/finalizar?c=${escolhidas.join(",")}`} className="btn btn-primario shrink-0">
              Continuar
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
