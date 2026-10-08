import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ESTADOS, UFS } from "@/content/mapa-brasil";
import type { EncontroAgenda } from "@/db/schema";
import { DIAS } from "@/lib/agenda";
import { lerAlcance } from "@/lib/alcance";
import { requireUsuario } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { criarEncontro, excluirEncontro, salvarAlcance, salvarEncontro } from "./actions";

export const metadata: Metadata = { title: "Agenda semanal" };

// Segunda primeiro, domingo por último, como na arte dos stories.
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

function Campos({ e }: { e?: EncontroAgenda }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <label className="block">
          <span className="rotulo">Dia</span>
          <select name="diaSemana" required defaultValue={e?.diaSemana ?? ""} className="campo">
            <option value="" disabled>
              Escolha o dia
            </option>
            {ORDEM.map((d) => (
              <option key={d} value={d}>
                {DIAS[d]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="rotulo">Hora (se tiver)</span>
          <input name="hora" defaultValue={e?.hora} placeholder="19:00" inputMode="numeric" className="campo" />
        </label>
      </div>
      <label className="block">
        <span className="rotulo">Nome do encontro</span>
        <input name="nome" required defaultValue={e?.nome} placeholder="Ex.: Pracinha da Rua Embu" className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Endereço</span>
        <input name="endereco" required defaultValue={e?.endereco} placeholder="Rua, número, bairro, cidade" className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Complemento (opcional)</span>
        <input name="complemento" defaultValue={e?.complemento ?? ""} placeholder="Ex.: Casa do Amor em Ação" className="campo" />
      </label>
      <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
        <label className="block">
          <span className="rotulo">Estado</span>
          <select name="estado" required defaultValue={e?.estado ?? "SP"} className="campo">
            {UFS.map((u) => (
              <option key={u} value={u}>
                {ESTADOS[u].nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="rotulo">Cidade</span>
          <input name="cidade" defaultValue={e?.cidade ?? ""} placeholder="Ex.: São Paulo" className="campo" />
        </label>
      </div>
    </>
  );
}

export default async function AgendaPainel() {
  const usuario = await requireUsuario();
  const [encontros, alcance] = await Promise.all([getDb().select().from(schema.agenda).orderBy(asc(schema.agenda.hora)), lerAlcance()]);
  const porDia = ORDEM.map((d) => ({ d, lista: encontros.filter((e) => e.diaSemana === d) })).filter((g) => g.lista.length);

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Agenda semanal</h1>
          <p className="mt-1 max-w-xl text-tinta-2">
            Os encontros que aparecem no site e em{" "}
            <a href="https://pazkidsemacao.com/agenda" target="_blank" rel="noopener" className="text-verde underline">
              pazkidsemacao.com/agenda
            </a>{" "}
            (o link da bio). Mudou aqui, muda lá na hora.
          </p>
        </div>
        <Link href="/agenda/story" className="btn btn-primario btn-sm">
          Gerar story
        </Link>
      </div>

      {/* Pinta o mapa do Brasil no site e entra nos textos ("em 7 estados", "1.628 crianças por semana"). */}
      {usuario.papel === "admin" && (
        <details className="cartao mt-6 p-5">
          <summary className="cursor-pointer">
            <span className="font-semibold">Onde o projeto está</span>
            <span className="ml-2 text-sm text-tinta-2">
              {alcance.estados.length} estado(s){alcance.criancasPorSemana ? ` · ${alcance.criancasPorSemana.toLocaleString("pt-BR")} crianças por semana` : ""}
            </span>
          </summary>
          <ActionForm action={salvarAlcance} className="mt-4 space-y-4">
            <fieldset>
              <legend className="rotulo">Estados atendidos (ficam coloridos no mapa do site)</legend>
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {UFS.map((u) => (
                  <label key={u} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="estados" value={u} defaultChecked={alcance.estados.includes(u)} className="size-4 accent-verde" />
                    {ESTADOS[u].nome}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block max-w-xs">
              <span className="rotulo">Crianças alcançadas por semana, no Brasil todo</span>
              <input name="criancas" inputMode="numeric" defaultValue={alcance.criancasPorSemana ?? ""} className="campo" />
              <span className="mt-1 block text-xs text-tinta-2">Só número real. Vazio, o número sai do site.</span>
            </label>
            <SubmitButton className="btn btn-claro btn-sm">Salvar</SubmitButton>
          </ActionForm>
        </details>
      )}

      <div className="mt-8 space-y-8">
        {porDia.length === 0 && <p className="cartao p-8 text-center text-tinta-2">Nenhum encontro cadastrado. Sem encontro, a agenda sai do site.</p>}
        {porDia.map(({ d, lista }) => (
          <section key={d}>
            <h2 className="text-sm font-bold tracking-wider text-tinta-2 uppercase">{DIAS[d]}</h2>
            <div className="mt-2 space-y-3">
              {lista.map((e) => (
                <details key={e.id} className="cartao p-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="font-semibold">
                        {e.hora && <span className="tabular-nums">{e.hora} · </span>}
                        {e.nome}
                      </span>
                      {!e.ativo && <span className="ml-2 rounded-md bg-tinta/10 px-2 py-0.5 text-xs">Fora do site</span>}
                      <span className="ml-2 rounded-md bg-tinta/[0.06] px-2 py-0.5 text-xs">{e.cidade ? `${e.cidade} · ${e.estado}` : e.estado}</span>
                      <span className="block truncate text-sm text-tinta-2">{e.endereco}</span>
                    </span>
                    <span className="shrink-0 text-sm text-verde">Editar</span>
                  </summary>
                  <ActionForm action={salvarEncontro.bind(null, e.id)} className="mt-4 grid gap-3">
                    <Campos e={e} />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="ativo" value="1" defaultChecked={e.ativo} className="size-4 accent-verde" />
                      Aparece no site
                    </label>
                    <div>
                      <SubmitButton className="btn btn-claro btn-sm">Salvar</SubmitButton>
                    </div>
                  </ActionForm>
                  <form action={excluirEncontro.bind(null, e.id)} className="mt-3 border-t border-linha pt-3 text-right">
                    <ConfirmButton message={`Excluir "${e.nome}" da agenda?`} className="text-sm text-tinta-2 hover:text-vermelho">
                      Excluir encontro
                    </ConfirmButton>
                  </form>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="cartao mt-10 p-5">
        <h2 className="text-lg font-semibold">Novo encontro</h2>
        <ActionForm action={criarEncontro} resetOnSuccess className="mt-4 grid gap-3">
          <Campos />
          <div>
            <SubmitButton className="btn btn-primario btn-sm">Adicionar</SubmitButton>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
