"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { LinhaImportacao, ResultadoImportacao } from "@/app/painel/criancas/actions";

type Campo = keyof LinhaImportacao;

// Nomes de coluna que a planilha do sistema antigo pode trazer. A comparação ignora acento,
// maiúscula e pontuação, então "Data de Nascimento" e "data_nascimento" dão no mesmo.
const CAMPOS: { campo: Campo; label: string; nomes: string[] }[] = [
  { campo: "nome", label: "Nome completo", nomes: ["nome", "nomecompleto", "crianca", "nomedacrianca", "aluno"] },
  { campo: "apelidoPublico", label: "Nome no site", nomes: ["apelido", "apelidopublico", "nomenosite"] },
  { campo: "dataNascimento", label: "Data de nascimento", nomes: ["datanascimento", "datadenascimento", "nascimento", "dtnascimento", "datanasc", "aniversario"] },
  { campo: "sexo", label: "Sexo", nomes: ["sexo", "genero"] },
  { campo: "tamanhoCamiseta", label: "Camiseta", nomes: ["camiseta", "tamanhocamiseta", "camisa", "blusa", "tamanhoroupa", "roupa"] },
  { campo: "tamanhoCalca", label: "Calça", nomes: ["calca", "tamanhocalca", "bermuda", "short"] },
  { campo: "tamanhoCalcado", label: "Calçado", nomes: ["calcado", "tamanhocalcado", "sapato", "tenis", "numero", "numeracao"] },
  { campo: "sugestaoPresente", label: "Sugestão de presente", nomes: ["presente", "sugestaopresente", "sugestaodepresente", "brinquedo", "desejo"] },
  { campo: "gostos", label: "Do que gosta", nomes: ["gostos", "hobbies", "hobby", "gosta", "preferencias"] },
  { campo: "responsavelNome", label: "Responsável", nomes: ["responsavel", "nomeresponsavel", "nomedoresponsavel", "mae", "pai"] },
  { campo: "responsavelContato", label: "Contato do responsável", nomes: ["contato", "telefone", "celular", "whatsapp", "contatoresponsavel", "telefoneresponsavel"] },
  { campo: "autorizacaoImagem", label: "Autoriza imagem", nomes: ["autorizacao", "autorizacaoimagem", "autorizacaodeimagem", "usodeimagem", "autorizafoto"] },
  { campo: "observacoes", label: "Observações", nomes: ["observacoes", "obs", "observacao", "anotacoes"] },
  { campo: "idExterno", label: "Código no sistema antigo", nomes: ["id", "codigo", "cod", "matricula", "idexterno"] },
];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** CSV com vírgula ou ponto e vírgula (o Excel em português salva com ";"), aspas e quebras dentro de aspas. */
function lerCsv(texto: string): string[][] {
  const primeira = texto.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primeira.match(/;/g)?.length ?? 0) > (primeira.match(/,/g)?.length ?? 0) ? ";" : ",";
  const linhas: string[][] = [];
  let linha: string[] = [];
  let celula = "";
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (aspas) {
      if (ch === '"' && texto[i + 1] === '"') {
        celula += '"';
        i++;
      } else if (ch === '"') aspas = false;
      else celula += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === sep) {
      linha.push(celula);
      celula = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      linha.push(celula);
      linhas.push(linha);
      linha = [];
      celula = "";
    } else celula += ch;
  }
  if (celula || linha.length) {
    linha.push(celula);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((c) => c.trim()));
}

/** Planilha salva pelo Excel no Windows costuma vir em Windows-1252, não UTF-8. */
function decodificar(buf: ArrayBuffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Converte o que vier da planilha em "YYYY-MM-DD"; o que não reconhecer passa adiante e o servidor avisa. */
function dataIso(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
  if (typeof v === "number" && v > 20000 && v < 80000) {
    // Número de série do Excel: dias desde 30/12/1899.
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  const s = String(v ?? "").trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (m) {
    let ano = Number(m[3]);
    if (m[3].length === 2) ano += ano > 50 ? 1900 : 2000;
    return `${ano}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return s;
}

function textoCelula(v: unknown) {
  if (v == null) return "";
  if (v instanceof Date) return dataIso(v);
  return String(v).trim();
}

export function Importador({ campanhas, importar }: { campanhas: { id: number; nome: string }[]; importar: (linhas: LinhaImportacao[], campanhaId: number | null) => Promise<ResultadoImportacao> }) {
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [cabecalho, setCabecalho] = useState<string[]>([]);
  const [dados, setDados] = useState<unknown[][]>([]);
  const [mapa, setMapa] = useState<Partial<Record<Campo, number>>>({});
  const [campanhaId, setCampanhaId] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [pending, start] = useTransition();

  async function abrir(file: File) {
    setErro(null);
    setResultado(null);
    try {
      let linhas: unknown[][];
      if (/\.xlsx$/i.test(file.name)) {
        const { readSheet } = await import("read-excel-file/universal");
        linhas = (await readSheet(file)) as unknown[][];
      } else if (/\.(csv|txt)$/i.test(file.name)) {
        linhas = lerCsv(decodificar(await file.arrayBuffer()));
      } else {
        setErro("Use um arquivo .xlsx ou .csv. Planilha .xls antiga: abra no Excel e salve como .xlsx.");
        return;
      }
      if (linhas.length < 2) {
        setErro("A planilha precisa de uma linha de cabeçalho e pelo menos uma criança.");
        return;
      }
      const cab = linhas[0].map(textoCelula);
      const auto: Partial<Record<Campo, number>> = {};
      for (const c of CAMPOS) {
        const i = cab.findIndex((h) => c.nomes.includes(norm(h)));
        if (i >= 0 && !Object.values(auto).includes(i)) auto[c.campo] = i;
      }
      setArquivo(file.name);
      setCabecalho(cab);
      setDados(linhas.slice(1).filter((l) => l.some((v) => textoCelula(v))));
      setMapa(auto);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível ler o arquivo.");
    }
  }

  const linhas = useMemo<LinhaImportacao[]>(
    () =>
      dados.map((l) => {
        const o: LinhaImportacao = {};
        for (const c of CAMPOS) {
          const i = mapa[c.campo];
          if (i == null) continue;
          o[c.campo] = c.campo === "dataNascimento" ? dataIso(l[i]) : textoCelula(l[i]);
        }
        return o;
      }),
    [dados, mapa],
  );

  if (resultado) {
    return (
      <div className="cartao p-6">
        <h2 className="text-xl font-semibold">Importação concluída</h2>
        <p className="mt-2">
          {resultado.criadas} criança(s) nova(s) e {resultado.atualizadas} atualizada(s).
          {campanhaId && ` ${resultado.naCampanha} entraram na campanha.`}
        </p>
        {resultado.erros.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold text-laranja">Atenção:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-tinta-2">
              {resultado.erros.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 flex gap-2">
          <Link href="/criancas" className="btn btn-primario">
            Ver crianças
          </Link>
          <button type="button" className="btn btn-claro" onClick={() => (setResultado(null), setArquivo(null), setDados([]))}>
            Importar outra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="cartao p-6">
        <label className="rotulo" htmlFor="planilha">
          Planilha (.xlsx ou .csv)
        </label>
        <input
          id="planilha"
          type="file"
          accept=".xlsx,.csv,.txt"
          onChange={(e) => e.target.files?.[0] && abrir(e.target.files[0])}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-linha file:bg-white file:px-3 file:py-2 file:text-sm"
        />
        <p className="mt-2 text-sm text-tinta-2">
          A primeira linha precisa ser o cabeçalho (nome das colunas). Quem já existe (mesmo código, ou mesmo nome e nascimento) é atualizado, não duplicado.
          Célula vazia não apaga o que já está no painel.
        </p>
        {erro && <p className="mt-2 text-sm text-vermelho">{erro}</p>}
      </div>

      {arquivo && (
        <>
          <div className="cartao p-6">
            <h2 className="text-lg font-semibold">Colunas de {arquivo}</h2>
            <p className="mt-1 text-sm text-tinta-2">{dados.length} linha(s). Confira qual coluna da planilha vai para cada campo.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPOS.map((c) => (
                <label key={c.campo} className="block">
                  <span className="rotulo">{c.label}</span>
                  <select
                    className="campo"
                    value={mapa[c.campo] ?? ""}
                    onChange={(e) => setMapa((m) => ({ ...m, [c.campo]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  >
                    <option value="">Não importar</option>
                    {cabecalho.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Coluna ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="cartao overflow-x-auto p-6">
            <h2 className="text-lg font-semibold">Prévia</h2>
            <table className="mt-3 w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-tinta-2 uppercase">
                <tr>
                  {CAMPOS.filter((c) => mapa[c.campo] != null).map((c) => (
                    <th key={c.campo} className="py-2 pr-4 font-semibold">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {linhas.slice(0, 8).map((l, i) => (
                  <tr key={i}>
                    {CAMPOS.filter((c) => mapa[c.campo] != null).map((c) => (
                      <td key={c.campo} className="py-2 pr-4">
                        {l[c.campo] || <span className="text-tinta-2/50">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {linhas.length > 8 && <p className="mt-2 text-xs text-tinta-2">…e mais {linhas.length - 8}.</p>}
          </div>

          <div className="cartao flex flex-wrap items-end gap-4 p-6">
            <label className="block min-w-60">
              <span className="rotulo">Colocar também numa campanha</span>
              <select className="campo" value={campanhaId} onChange={(e) => setCampanhaId(e.target.value)}>
                <option value="">Não, só cadastrar</option>
                {campanhas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-primario"
              disabled={pending || mapa.nome == null}
              onClick={() =>
                start(async () => {
                  setErro(null);
                  try {
                    setResultado(await importar(linhas, campanhaId ? Number(campanhaId) : null));
                  } catch (e) {
                    setErro(e instanceof Error ? e.message : "Não foi possível importar.");
                  }
                })
              }
            >
              {pending ? "Importando…" : `Importar ${linhas.length} criança(s)`}
            </button>
            {mapa.nome == null && <p className="text-sm text-laranja">Escolha qual coluna é o nome.</p>}
            {erro && <p className="text-sm text-vermelho">{erro}</p>}
          </div>
        </>
      )}
    </div>
  );
}
