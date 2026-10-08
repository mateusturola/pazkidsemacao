import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { MembroEquipe } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { criarMembro, enviarFotoMembro, excluirMembro, salvarMembro } from "./actions";

export const metadata: Metadata = { title: "Equipe" };

function Campos({ m }: { m?: MembroEquipe }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <label className="block">
          <span className="rotulo">Nome</span>
          <input name="nome" required maxLength={80} defaultValue={m?.nome} placeholder="Ex.: Pra. Mary Vasconcelos" className="campo" />
        </label>
        <label className="block">
          <span className="rotulo">Ordem</span>
          <input name="ordem" type="number" defaultValue={m?.ordem ?? 0} className="campo" />
        </label>
      </div>
      <label className="block">
        <span className="rotulo">Função</span>
        <input name="funcao" maxLength={120} defaultValue={m?.funcao ?? ""} placeholder="Ex.: Missionária da Paz Church" className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Sobre (2 a 4 frases)</span>
        <textarea name="texto" rows={4} maxLength={700} defaultValue={m?.texto ?? ""} className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Instagram</span>
        <input name="instagram" defaultValue={m?.instagram ? `@${m.instagram}` : ""} placeholder="@usuario" className="campo" />
      </label>
    </>
  );
}

/** Quem aparece em "Quem cuida do projeto", na página inicial. Uma pessoa ou um casal por cadastro. */
export default async function EquipePage() {
  await requireAdmin();
  const lista = await getDb().select().from(schema.equipe).orderBy(asc(schema.equipe.ordem), asc(schema.equipe.id));
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold">Equipe</h1>
      <p className="mt-1 text-tinta-2">
        Quem aparece em &quot;Quem cuida do projeto&quot;, na página inicial, na ordem do número (menor primeiro). Sem Instagram, o ícone leva ao
        Instagram do projeto.
      </p>

      <div className="mt-6 space-y-4">
        {lista.length === 0 && <p className="cartao p-8 text-center text-tinta-2">Ninguém cadastrado ainda. A seção só aparece no site com alguém ativo.</p>}
        {lista.map((m) => (
          <details key={m.id} className="cartao p-5">
            <summary className="flex cursor-pointer items-center gap-4">
              {m.fotoKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/equipe/${m.id}/foto?v=${encodeURIComponent(m.fotoKey)}`} alt="" className="size-14 shrink-0 rounded-xl bg-[#6b3fa0] object-cover object-top" />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-creme text-xs text-tinta-2">sem foto</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{m.nome}</span>
                {!m.ativo && <span className="ml-2 rounded-md bg-tinta/10 px-2 py-0.5 text-xs">Fora do site</span>}
                <span className="block truncate text-sm text-tinta-2">{m.funcao}</span>
              </span>
              <span className="text-sm text-verde">Editar</span>
            </summary>

            <ActionForm action={salvarMembro.bind(null, m.id)} className="mt-4 grid gap-3">
              <Campos m={m} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="ativo" value="1" defaultChecked={m.ativo} className="size-4 accent-verde" />
                Aparece no site
              </label>
              <div>
                <SubmitButton className="btn btn-claro btn-sm">Salvar</SubmitButton>
              </div>
            </ActionForm>

            <ActionForm action={enviarFotoMembro.bind(null, m.id)} className="mt-5 space-y-2 border-t border-linha pt-4">
              <span className="rotulo">Foto</span>
              <p className="text-sm text-tinta-2">
                Para ficar igual às outras, use a foto com o fundo recortado (PNG transparente): o site põe a cor atrás. Uma foto comum também
                funciona.
              </p>
              <input
                type="file"
                name="foto"
                accept="image/jpeg,image/png,image/webp"
                required
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-linha file:bg-white file:px-3 file:py-1.5 file:text-sm"
              />
              <SubmitButton className="btn btn-claro btn-sm" pendingText="Enviando…">
                {m.fotoKey ? "Trocar foto" : "Enviar foto"}
              </SubmitButton>
            </ActionForm>

            <details className="mt-5 border-t border-linha pt-4 text-sm">
              <summary className="cursor-pointer text-tinta-2">Excluir de vez</summary>
              <p className="mt-2 text-tinta-2">Para tirar do site por um tempo, desmarque &quot;Aparece no site&quot;. Excluir apaga o cadastro e a foto.</p>
              <form action={excluirMembro.bind(null, m.id)} className="mt-2">
                <button className="btn btn-sm bg-vermelho text-white hover:bg-vermelho/90">Excluir {m.nome}</button>
              </form>
            </details>
          </details>
        ))}
      </div>

      <section className="cartao mt-8 p-5">
        <h2 className="text-lg font-semibold">Adicionar pessoa ou casal</h2>
        <p className="mt-1 text-sm text-tinta-2">Depois de salvar, abra o cadastro na lista para enviar a foto.</p>
        <ActionForm action={criarMembro} resetOnSuccess className="mt-4 grid gap-3">
          <Campos />
          <div>
            <SubmitButton className="btn btn-primario btn-sm">Adicionar</SubmitButton>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
