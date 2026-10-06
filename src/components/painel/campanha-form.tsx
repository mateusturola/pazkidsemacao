import { ActionForm } from "@/components/ui/action-form";
import { DatePicker } from "@/components/ui/date-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Campanha } from "@/db/schema";
import { centsToInput } from "@/lib/money";

type Action = (prev: string | null, form: FormData) => Promise<string | null>;

export function CampanhaForm({ action, campanha, botao }: { action: Action; campanha?: Campanha; botao: string }) {
  const c = campanha;
  return (
    <ActionForm action={action} className="space-y-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="chamada mb-3">Campanha</legend>
        <label className="block sm:col-span-2">
          <span className="rotulo">Nome</span>
          <input name="nome" required defaultValue={c?.nome} placeholder="Ex.: Sacolinha de Natal" className="campo" />
        </label>
        <label className="block">
          <span className="rotulo">Endereço no site</span>
          <div className="flex items-center rounded-lg border border-linha bg-white focus-within:border-verde/50 focus-within:ring-4 focus-within:ring-verde/10">
            <span className="pl-3.5 text-sm text-tinta-2">pazkidsemacao.com/</span>
            <input name="slug" defaultValue={c?.slug} placeholder="natal" className="w-full bg-transparent py-2.5 pr-3.5 text-[15px] outline-none" />
          </div>
        </label>
        <label className="block">
          <span className="rotulo">Tipo</span>
          <select name="tipo" defaultValue={c?.tipo ?? "natal"} className="campo">
            <option value="natal">Natal</option>
            <option value="pascoa">Páscoa</option>
            <option value="dia_das_criancas">Dia das Crianças</option>
            <option value="volta_as_aulas">Volta às aulas</option>
            <option value="outra">Outra</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="rotulo">Descrição (aparece no topo da página)</span>
          <textarea name="descricao" rows={3} defaultValue={c?.descricao ?? ""} className="campo" />
        </label>
        <div>
          <span className="rotulo">Início</span>
          <DatePicker name="dataInicio" defaultValue={c?.dataInicio ?? ""} />
        </div>
        <div>
          <span className="rotulo">Fim</span>
          <DatePicker name="dataFim" defaultValue={c?.dataFim ?? ""} />
        </div>
        <label className="block">
          <span className="rotulo">Situação</span>
          <select name="status" defaultValue={c?.status ?? "rascunho"} className="campo">
            <option value="rascunho">Rascunho (só no painel)</option>
            <option value="ativa">Ativa (no site, recebendo padrinhos)</option>
            <option value="encerrada">Encerrada (no site, sem receber)</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="chamada mb-3">Sacolinha</legend>
        <label className="block sm:col-span-2">
          <span className="rotulo">O que vai na sacolinha</span>
          <textarea name="itensSacolinha" rows={4} defaultValue={c?.itensSacolinha ?? ""} placeholder={"1 camiseta\n1 calça\n1 calçado\n1 presente"} className="campo" />
          <span className="mt-1 block text-xs text-tinta-2">Um item por linha.</span>
        </label>
        <div>
          <span className="rotulo">Data limite para entregar no balcão</span>
          <DatePicker name="prazoEntrega" defaultValue={c?.prazoEntrega ?? ""} />
          <span className="mt-1 block text-xs text-tinta-2">Até lá a criança fica reservada para quem vai montar a sacolinha.</span>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="chamada mb-3">Pagamento online</legend>
        <label className="block">
          <span className="rotulo">Valor da sacolinha</span>
          <input name="valorSacolinha" inputMode="decimal" defaultValue={centsToInput(c?.valorSacolinha)} placeholder="Ex.: 180,00" className="campo" />
          <span className="mt-1 block text-xs text-tinta-2">Vazio, o site só oferece montar e entregar.</span>
        </label>
        <label className="block">
          <span className="rotulo">Parcelas no cartão (máximo)</span>
          <select name="maxParcelas" defaultValue={String(c?.maxParcelas ?? 1)} className="campo">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "À vista" : `Até ${n}x`}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <SubmitButton className="btn btn-primario">{botao}</SubmitButton>
    </ActionForm>
  );
}
