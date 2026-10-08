"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_POR_PEDIDO } from "@/lib/regras";
import { IconeCheck, IconeSacola, IconeSeta } from "./icones";

export type CriancaCard = {
  id: number;
  nome: string;
  idade: number | null;
  idadeTexto: string | null;
  /** "sonha em ser professora", ou null. */
  sonho: string | null;
  /** A apresentação da criança: a história da família ou o texto montado com o cadastro. */
  historia: string;
  /** A história veio da família; sem ela, o texto já cita gostos e presente e a lista não se repete. */
  historiaPropria: boolean;
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

// A etiqueta da sacolinha do manual da marca, deitada: o canto cortado e o furo ficam à esquerda.
// Deitada, cabem várias por tela no celular; a história completa abre no "Conhecer".
const ETIQUETA = "polygon(0 18%, 22px 0, 100% 0, 100% 100%, 22px 100%, 0 82%)";
const KRAFT = "radial-gradient(rgba(120,85,40,.07) 1px, transparent 1.4px) 0 0/7px 7px, var(--color-kraft)";

// Com centenas de crianças, a lista vem aos poucos: 18 fecha as linhas de 2 e de 3 colunas.
const POR_VEZ = 18;

const sem = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function embaralhar<T>(lista: T[]) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function GradeCriancas({ slug, criancas, aberta }: { slug: string; criancas: CriancaCard[]; aberta: boolean }) {
  const [escolhidas, setEscolhidas] = useState<number[]>([]);
  const [faixa, setFaixa] = useState("");
  const [sexo, setSexo] = useState("");
  const [busca, setBusca] = useState("");
  const [mostrar, setMostrar] = useState(POR_VEZ);
  const [quantas, setQuantas] = useState(1);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conhecendo, setConhecendo] = useState<CriancaCard | null>(null);
  // A lista das escolhidas, aberta pela barra: o jeito de tirar alguém sem caçar na lista embaralhada.
  const [verLista, setVerLista] = useState(false);
  useEffect(() => {
    if (escolhidas.length === 0) setVerLista(false);
  }, [escolhidas.length]);
  const janela = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (conhecendo) janela.current?.showModal();
  }, [conhecendo]);
  // Com centenas de crianças, quem aparece primeiro é escolhido primeiro. A ordem é sorteada a cada
  // visita (depois de montar, para não divergir do HTML do servidor): todas têm a mesma chance.
  const [ordem, setOrdem] = useState(criancas);
  useEffect(() => setOrdem(embaralhar(criancas)), [criancas]);

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
    const q = sem(busca.trim());
    return ordem.filter(
      (c) =>
        (!sexo || c.sexo === sexo) &&
        (!f || f.min === undefined || (c.idade != null && c.idade >= f.min && c.idade <= f.max!)) &&
        (!q || sem(c.nome).includes(q)),
    );
  }, [ordem, faixa, sexo, busca]);

  // Filtro novo começa do início da lista.
  useEffect(() => setMostrar(POR_VEZ), [faixa, sexo, busca]);

  const vagas = MAX_POR_PEDIDO - escolhidas.length;

  /** "Escolha por mim": sorteia entre as crianças do filtro atual que ainda não estão na sacolinha. */
  function escolherPorMim() {
    setAviso(null);
    const livres = embaralhar(filtradas.filter((c) => !escolhidas.includes(c.id)));
    const n = Math.min(quantas, vagas, livres.length);
    if (n <= 0) {
      setAviso(vagas <= 0 ? `Dá para escolher até ${MAX_POR_PEDIDO} crianças por vez. Finalize estas primeiro.` : "Nenhuma criança livre com esse filtro.");
      return;
    }
    salvar([...escolhidas, ...livres.slice(0, n).map((c) => c.id)]);
  }

  const visiveis = filtradas.slice(0, mostrar);

  const naSacolinha = escolhidas.map((id) => criancas.find((c) => c.id === id)).filter((c): c is CriancaCard => !!c);
  const nomes = naSacolinha.map((c) => c.nome);

  return (
    <div>
      <div className="rounded-[24px] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pelo nome"
            aria-label="Buscar criança pelo nome"
            className="campo max-w-xs flex-1"
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por idade">
            {FAIXAS.map((f) => (
              <button
                key={f.k}
                type="button"
                onClick={() => setFaixa(f.k)}
                aria-pressed={faixa === f.k}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${faixa === f.k ? "bg-verde text-creme" : "bg-creme text-verde hover:bg-linha"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2" role="group" aria-label="Filtrar por menina ou menino">
            {[
              ["", "Todos"],
              ["F", "Meninas"],
              ["M", "Meninos"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSexo(k)}
                aria-pressed={sexo === k}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${sexo === k ? "bg-verde text-creme" : "bg-creme text-verde hover:bg-linha"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-linha pt-5">
          <p className="text-tinta-2">
            <strong className="font-titulo text-xl text-verde">{filtradas.length}</strong> {filtradas.length === 1 ? "criança esperando" : "crianças esperando"}
            {filtradas.length !== criancas.length && ` de ${criancas.length}`}
          </p>
          {aberta && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-verde">Escolha por mim:</span>
              <select value={quantas} onChange={(e) => setQuantas(Number(e.target.value))} className="campo w-auto py-2" aria-label="Quantas crianças">
                {Array.from({ length: MAX_POR_PEDIDO }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "criança" : "crianças"}
                  </option>
                ))}
              </select>
              <button type="button" onClick={escolherPorMim} className="btn btn-primario h-11 px-5 text-base">
                Escolher
              </button>
            </div>
          )}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-10 text-lg text-tinta-2">Nenhuma criança com esse filtro agora.</p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((c) => {
            const escolhida = escolhidas.includes(c.id);
            return (
              <li key={c.id} className="relative flex">
                <div
                  className={`relative flex w-full items-center gap-3 py-3 pr-3 pl-9 transition-[filter] sm:gap-4 ${escolhida ? "brightness-[.93]" : ""}`}
                  style={{ clipPath: ETIQUETA, background: KRAFT }}
                >
                  <span className="absolute top-1/2 left-3 size-3 -translate-y-1/2 rounded-full bg-papel shadow-[inset_0_1px_2px_rgba(0,0,0,.25)]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imagem} alt="" loading="lazy" className="size-14 shrink-0 rounded-full border-[3px] border-papel object-cover sm:size-16" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-mao text-[1.75rem] leading-none text-verde">{c.nome}</h3>
                    <p className="text-xs font-bold text-verde/80 sm:text-sm">
                      {[c.sexo === "F" ? "Menina" : c.sexo === "M" ? "Menino" : null, c.idadeTexto].filter(Boolean).join(" · ")}
                    </p>
                    {c.sonho && <p className="truncate text-xs text-tinta sm:text-[13px]">{c.sonho.charAt(0).toUpperCase() + c.sonho.slice(1)}</p>}
                    <button
                      type="button"
                      onClick={() => setConhecendo(c)}
                      className="mt-0.5 text-xs font-extrabold text-verde underline decoration-vermelho decoration-2 underline-offset-2"
                    >
                      Conhecer
                    </button>
                  </div>
                  {aberta && (
                    <button
                      type="button"
                      onClick={() => alternar(c.id)}
                      aria-pressed={escolhida}
                      aria-label={escolhida ? `Tirar ${c.nome} da sua lista` : `Apadrinhar ${c.nome}`}
                      className={`btn h-10 shrink-0 px-3 text-sm ${escolhida ? "bg-verde text-creme hover:bg-verde-2" : "btn-acao"}`}
                    >
                      {escolhida ? (
                        <>
                          <IconeCheck className="size-4" /> Escolhida
                        </>
                      ) : (
                        "Apadrinhar"
                      )}
                    </button>
                  )}
                </div>
                {/* O laço vermelho marca quem já está na sacolinha do doador. */}
                {escolhida && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/natal/simbolos/coracao.svg" alt="" className="absolute -top-2 -right-1 size-8 rotate-12 drop-shadow-sm" />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {filtradas.length > mostrar && (
        <div className="mt-12 text-center">
          <button type="button" onClick={() => setMostrar((m) => m + POR_VEZ)} className="btn btn-claro h-12 px-8">
            Mostrar mais crianças
          </button>
          <p className="mt-2 text-sm text-tinta-2">
            Mostrando {visiveis.length} de {filtradas.length}
          </p>
        </div>
      )}

      {/* Conhecer a criança: a história, o sonho e o botão de apadrinhar no mesmo lugar. */}
      <dialog
        ref={janela}
        onClose={() => setConhecendo(null)}
        onClick={(e) => e.target === e.currentTarget && janela.current?.close()}
        className="m-auto w-[min(92vw,560px)] rounded-[28px] bg-papel p-0 text-tinta backdrop:bg-verde-escuro/60 max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none"
      >
        {conhecendo && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={conhecendo.imagem} alt="" className="size-20 shrink-0 rounded-full border-4 border-white object-cover sm:size-24" />
              <div>
                <h3 className="font-mao text-[2.6rem] leading-none text-verde">{conhecendo.nome}</h3>
                <p className="mt-1 font-bold text-verde/80">
                  {[conhecendo.sexo === "F" ? "Menina" : conhecendo.sexo === "M" ? "Menino" : null, conhecendo.idadeTexto].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            {conhecendo.sonho && (
              <p className="mt-6 font-titulo text-2xl leading-snug font-semibold text-verde">
                {conhecendo.nome} <span className="pincelada">{conhecendo.sonho}</span>.
              </p>
            )}
            <p className="mt-4 text-lg leading-relaxed">{conhecendo.historia}</p>
            <dl className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                ["Camiseta", conhecendo.camiseta],
                ["Calça", conhecendo.calca],
                ["Calçado", conhecendo.calcado],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white px-1 py-2">
                  <dt className="text-[11px] font-extrabold tracking-wider text-tinta-2 uppercase">{k}</dt>
                  <dd className="font-titulo text-xl font-bold text-verde">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            {conhecendo.historiaPropria && (conhecendo.gostos || conhecendo.sugestao) && (
              <div className="mt-4 space-y-1 text-[15px]">
                {conhecendo.gostos && (
                  <p>
                    <span className="font-extrabold text-verde">Gosta de:</span> {conhecendo.gostos}
                  </p>
                )}
                {conhecendo.sugestao && (
                  <p>
                    <span className="font-extrabold text-verde">Ideia de presente:</span> {conhecendo.sugestao}
                  </p>
                )}
              </div>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              {aberta && (
                <button
                  type="button"
                  onClick={() => {
                    if (!escolhidas.includes(conhecendo.id)) alternar(conhecendo.id);
                    janela.current?.close();
                  }}
                  className={`btn flex-1 ${escolhidas.includes(conhecendo.id) ? "bg-verde text-creme hover:bg-verde-2" : "btn-acao"}`}
                >
                  {escolhidas.includes(conhecendo.id) ? (
                    <>
                      <IconeCheck className="size-5" /> Já está na sua lista
                    </>
                  ) : (
                    `Apadrinhar ${conhecendo.sexo === "M" ? "o" : conhecendo.sexo === "F" ? "a" : ""} ${conhecendo.nome}`
                  )}
                </button>
              )}
              <button type="button" onClick={() => janela.current?.close()} className="btn btn-claro">
                Fechar
              </button>
            </div>
          </div>
        )}
      </dialog>

      {aviso && <p className="fixed inset-x-4 bottom-28 z-40 mx-auto max-w-md rounded-xl bg-tinta p-3 text-center text-sm text-white">{aviso}</p>}

      {escolhidas.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-verde text-creme shadow-[0_-8px_30px_rgba(20,52,38,.25)]">
          {verLista && (
            <div id="lista-sacolinha" className="mx-auto max-h-[55dvh] max-w-7xl overflow-y-auto border-b border-creme/15 px-4 pt-4 pb-2 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <p className="chamada text-amarelo">Sua sacolinha</p>
                <button type="button" onClick={() => salvar([])} className="text-sm font-bold text-creme/75 underline underline-offset-4 hover:text-creme">
                  Limpar tudo
                </button>
              </div>
              <ul className="mt-2 divide-y divide-creme/10">
                {naSacolinha.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.imagem} alt="" className="size-10 shrink-0 rounded-full border-2 border-creme/30 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mao text-2xl leading-none">{c.nome}</p>
                      <p className="text-xs text-creme/70">{[c.sexo === "F" ? "Menina" : c.sexo === "M" ? "Menino" : null, c.idadeTexto].filter(Boolean).join(" · ")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => alternar(c.id)}
                      aria-label={`Tirar ${c.nome} da sacolinha`}
                      className="rounded-lg border border-creme/30 px-3 py-1.5 text-sm font-bold hover:bg-creme/10"
                    >
                      Tirar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-8">
            <button
              type="button"
              onClick={() => setVerLista((v) => !v)}
              aria-expanded={verLista}
              aria-controls="lista-sacolinha"
              className="flex min-w-0 flex-1 items-center gap-4 text-left"
            >
              <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-creme/10 text-amarelo sm:grid">
                <IconeSacola className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-titulo text-lg font-semibold">
                  {escolhidas.length} {escolhidas.length === 1 ? "sacolinha escolhida" : "sacolinhas escolhidas"}
                </span>
                <span className="block truncate text-sm text-creme/75">
                  Para {nomes.join(", ")} · <span className="underline underline-offset-2">{verLista ? "fechar" : "ver ou tirar"}</span>
                </span>
              </span>
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
