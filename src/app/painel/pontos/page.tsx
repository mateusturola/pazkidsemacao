import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { PontoColeta } from "@/db/schema";
import { usuarioAtual } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { criarPonto, salvarPonto } from "./actions";

export const metadata: Metadata = { title: "Pontos de entrega" };

function Campos({ p }: { p?: PontoColeta }) {
  return (
    <>
      <label className="block">
        <span className="rotulo">Nome</span>
        <input name="nome" required defaultValue={p?.nome} placeholder="Ex.: Paz Kids · Campus Heliópolis" className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Endereço</span>
        <textarea name="endereco" rows={2} defaultValue={p?.endereco ?? ""} className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Horários para entregar</span>
        <textarea name="horarios" rows={2} defaultValue={p?.horarios ?? ""} placeholder="Ex.: domingos, 9h às 12h e 17h às 20h" className="campo" />
      </label>
    </>
  );
}

export default async function PontosPage() {
  const usuario = await usuarioAtual();
  const admin = usuario?.papel === "admin";
  const pontos = await getDb().select().from(schema.pontosColeta).orderBy(desc(schema.pontosColeta.ativo), asc(schema.pontosColeta.nome));
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold">Pontos de entrega</h1>
      <p className="mt-1 text-tinta-2">Os balcões onde o padrinho entrega a sacolinha. Os ativos aparecem no site para ele escolher.</p>

      <div className="mt-6 space-y-4">
        {pontos.length === 0 && <p className="cartao p-8 text-center text-tinta-2">Nenhum ponto cadastrado ainda.</p>}
        {pontos.map((p) =>
          admin ? (
            <details key={p.id} className="cartao p-5">
              <summary className="flex cursor-pointer items-center justify-between gap-3">
                <span>
                  <span className="font-semibold">{p.nome}</span>
                  {!p.ativo && <span className="ml-2 rounded-md bg-tinta/10 px-2 py-0.5 text-xs">Inativo</span>}
                  <span className="block text-sm text-tinta-2">{p.endereco}</span>
                </span>
                <span className="text-sm text-verde">Editar</span>
              </summary>
              <ActionForm action={salvarPonto.bind(null, p.id)} className="mt-4 grid gap-3">
                <Campos p={p} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="ativo" value="1" defaultChecked={p.ativo} className="size-4 accent-verde" />
                  Ativo (aparece no site)
                </label>
                <div>
                  <SubmitButton className="btn btn-claro btn-sm">Salvar</SubmitButton>
                </div>
              </ActionForm>
            </details>
          ) : (
            <div key={p.id} className="cartao p-5">
              <p className="font-semibold">{p.nome}</p>
              <p className="text-sm whitespace-pre-line text-tinta-2">{p.endereco}</p>
              <p className="text-sm whitespace-pre-line text-tinta-2">{p.horarios}</p>
            </div>
          ),
        )}
      </div>

      {admin && (
        <section className="cartao mt-8 p-5">
          <h2 className="text-lg font-semibold">Novo ponto de entrega</h2>
          <ActionForm action={criarPonto} resetOnSuccess className="mt-4 grid gap-3">
            <Campos />
            <div>
              <SubmitButton className="btn btn-primario btn-sm">Adicionar</SubmitButton>
            </div>
          </ActionForm>
        </section>
      )}
    </div>
  );
}
