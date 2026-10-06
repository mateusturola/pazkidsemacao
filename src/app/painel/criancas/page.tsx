import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { FotoCrianca } from "@/components/painel/foto-crianca";
import { usuarioAtual } from "@/lib/auth";
import { idadeTexto, SEXO_LABEL } from "@/lib/criancas";
import { getDb, schema } from "@/lib/db";

export const metadata: Metadata = { title: "Crianças" };

const { criancas } = schema;

export default async function CriancasPage({ searchParams }: { searchParams: Promise<{ q?: string; inativas?: string }> }) {
  const { q = "", inativas } = await searchParams;
  const usuario = await usuarioAtual();
  const busca = q.trim();
  const lista = await getDb()
    .select()
    .from(criancas)
    .where(
      and(
        eq(criancas.ativo, !inativas),
        busca ? or(like(criancas.nome, `%${busca}%`), like(criancas.apelidoPublico, `%${busca}%`), like(criancas.responsavelNome, `%${busca}%`)) : undefined,
      ),
    )
    .orderBy(asc(sql`lower(${criancas.nome})`));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Crianças</h1>
          <p className="mt-1 text-tinta-2">
            {lista.length} {inativas ? "desativada(s)" : "ativa(s)"}. A mesma criança participa de várias campanhas.
          </p>
        </div>
        <div className="flex gap-2">
          {usuario?.papel === "admin" && (
            <Link href="/criancas/importar" className="btn btn-claro">
              Importar planilha
            </Link>
          )}
          <Link href="/criancas/nova" className="btn btn-primario">
            Nova criança
          </Link>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={busca} placeholder="Buscar por nome ou responsável" className="campo max-w-sm" />
        {inativas && <input type="hidden" name="inativas" value="1" />}
        <button className="btn btn-claro">Buscar</button>
        <Link href={inativas ? "/criancas" : "/criancas?inativas=1"} className="ml-auto self-center text-sm text-tinta-2 underline-offset-2 hover:underline">
          {inativas ? "Ver ativas" : "Ver desativadas"}
        </Link>
      </form>

      {lista.length === 0 ? (
        <div className="cartao mt-6 p-10 text-center text-tinta-2">
          {busca ? "Ninguém encontrado com essa busca." : "Nenhuma criança cadastrada ainda. Cadastre uma a uma ou importe a planilha do sistema antigo."}
        </div>
      ) : (
        <div className="cartao mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-linha text-left text-xs text-tinta-2 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Criança</th>
                <th className="px-4 py-3 font-semibold">Idade</th>
                <th className="px-4 py-3 font-semibold">Camiseta · Calça · Calçado</th>
                <th className="px-4 py-3 font-semibold">Responsável</th>
                <th className="px-4 py-3 font-semibold">Imagem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {lista.map((c) => (
                <tr key={c.id} className="hover:bg-creme/40">
                  <td className="px-4 py-2.5">
                    <Link href={`/criancas/${c.id}`} className="flex items-center gap-3 font-semibold hover:text-verde">
                      <FotoCrianca id={c.id} versao={c.fotoKey ?? c.avatarKey} />
                      <span>
                        {c.nome}
                        {c.apelidoPublico && <span className="block text-xs font-normal text-tinta-2">No site: {c.apelidoPublico}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-tinta-2">
                    {idadeTexto(c.dataNascimento) ?? "—"}
                    {c.sexo && <span className="block text-xs">{SEXO_LABEL[c.sexo]}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-tinta-2">{[c.tamanhoCamiseta, c.tamanhoCalca, c.tamanhoCalcado].map((t) => t || "—").join(" · ")}</td>
                  <td className="px-4 py-2.5 text-tinta-2">{c.responsavelNome ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {c.autorizacaoImagem ? (
                      <span className="text-verde">Foto autorizada</span>
                    ) : c.fotoKey ? (
                      <span className="text-laranja">Foto sem autorização</span>
                    ) : c.avatarKey ? (
                      <span className="text-tinta-2">Avatar</span>
                    ) : (
                      <span className="text-tinta-2">Sem imagem</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
