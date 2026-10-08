import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Parceiro } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { criarParceiro, enviarLogo, excluirParceiro, salvarParceiro } from "./actions";

export const metadata: Metadata = { title: "Parceiros" };

function Campos({ p }: { p?: Parceiro }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <label className="block">
          <span className="rotulo">Nome da empresa</span>
          <input name="nome" required maxLength={80} defaultValue={p?.nome} className="campo" />
        </label>
        <label className="block">
          <span className="rotulo">Ordem</span>
          <input name="ordem" type="number" defaultValue={p?.ordem ?? 0} className="campo" />
        </label>
      </div>
      <label className="block">
        <span className="rotulo">O que faz pelo projeto (uma frase)</span>
        <input name="descricao" maxLength={200} defaultValue={p?.descricao ?? ""} placeholder="Ex.: Doa todo mês o lanche das ações de sábado." className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Link (site ou loja)</span>
        <input name="link" defaultValue={p?.link ?? ""} placeholder="https://" className="campo" />
      </label>
    </>
  );
}

/** As empresas de "Quem faz parte", na página inicial. */
export default async function ParceirosPage() {
  await requireAdmin();
  const lista = await getDb().select().from(schema.parceiros).orderBy(asc(schema.parceiros.ordem), asc(schema.parceiros.id));
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold">Parceiros</h1>
      <p className="mt-1 text-tinta-2">
        As empresas que apoiam o projeto, em &quot;Quem faz parte&quot;, na página inicial, com o logo e o link. O número da ordem decide quem
        vem primeiro.
      </p>

      <div className="mt-6 space-y-4">
        {lista.length === 0 && <p className="cartao p-8 text-center text-tinta-2">Nenhuma empresa cadastrada ainda.</p>}
        {lista.map((p) => (
          <details key={p.id} className="cartao p-5">
            <summary className="flex cursor-pointer items-center gap-4">
              {p.logoKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/parceiros/${p.id}/logo?v=${encodeURIComponent(p.logoKey)}`} alt="" className="h-12 w-24 shrink-0 object-contain" />
              ) : (
                <span className="grid h-12 w-24 shrink-0 place-items-center rounded-xl bg-creme text-xs text-tinta-2">sem logo</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{p.nome}</span>
                {!p.ativo && <span className="ml-2 rounded-md bg-tinta/10 px-2 py-0.5 text-xs">Fora do site</span>}
                <span className="block truncate text-sm text-tinta-2">{p.descricao}</span>
              </span>
              <span className="text-sm text-verde">Editar</span>
            </summary>

            <ActionForm action={salvarParceiro.bind(null, p.id)} className="mt-4 grid gap-3">
              <Campos p={p} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="ativo" value="1" defaultChecked={p.ativo} className="size-4 accent-verde" />
                Aparece no site
              </label>
              <div>
                <SubmitButton className="btn btn-claro btn-sm">Salvar</SubmitButton>
              </div>
            </ActionForm>

            <ActionForm action={enviarLogo.bind(null, p.id)} className="mt-5 space-y-2 border-t border-linha pt-4">
              <span className="rotulo">Logo</span>
              <p className="text-sm text-tinta-2">De preferência em PNG com fundo transparente, na versão colorida (o fundo da seção é claro).</p>
              <input
                type="file"
                name="logo"
                accept="image/png,image/webp,image/jpeg"
                required
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-linha file:bg-white file:px-3 file:py-1.5 file:text-sm"
              />
              <SubmitButton className="btn btn-claro btn-sm" pendingText="Enviando…">
                {p.logoKey ? "Trocar logo" : "Enviar logo"}
              </SubmitButton>
            </ActionForm>

            <details className="mt-5 border-t border-linha pt-4 text-sm">
              <summary className="cursor-pointer text-tinta-2">Excluir de vez</summary>
              <p className="mt-2 text-tinta-2">Para tirar do site por um tempo, desmarque &quot;Aparece no site&quot;. Excluir apaga o cadastro e o logo.</p>
              <form action={excluirParceiro.bind(null, p.id)} className="mt-2">
                <button className="btn btn-sm bg-vermelho text-white hover:bg-vermelho/90">Excluir {p.nome}</button>
              </form>
            </details>
          </details>
        ))}
      </div>

      <section className="cartao mt-8 p-5">
        <h2 className="text-lg font-semibold">Adicionar empresa</h2>
        <p className="mt-1 text-sm text-tinta-2">Depois de salvar, abra o cadastro na lista para enviar o logo.</p>
        <ActionForm action={criarParceiro} resetOnSuccess className="mt-4 grid gap-3">
          <Campos />
          <div>
            <SubmitButton className="btn btn-primario btn-sm">Adicionar</SubmitButton>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
