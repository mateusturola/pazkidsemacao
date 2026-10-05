import { ActionForm } from "@/components/ui/action-form";
import { DatePicker } from "@/components/ui/date-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Crianca } from "@/db/schema";

type Action = (prev: string | null, form: FormData) => Promise<string | null>;

function Campo({ label, children, dica, className = "" }: { label: string; children: React.ReactNode; dica?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="rotulo">{label}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-tinta-2">{dica}</span>}
    </label>
  );
}

export function CriancaForm({ action, crianca, botao }: { action: Action; crianca?: Crianca; botao: string }) {
  const c = crianca;
  return (
    <ActionForm action={action} className="space-y-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="chamada mb-3">Dados</legend>
        <Campo label="Nome completo" className="sm:col-span-2">
          <input name="nome" required defaultValue={c?.nome} className="campo" />
        </Campo>
        <Campo label="Nome no site" dica="Vazio, o site mostra só o primeiro nome. Sobrenome nunca aparece.">
          <input name="apelidoPublico" defaultValue={c?.apelidoPublico ?? ""} className="campo" />
        </Campo>
        <div>
          <span className="rotulo">Data de nascimento</span>
          <DatePicker name="dataNascimento" defaultValue={c?.dataNascimento ?? ""} />
        </div>
        <Campo label="Sexo">
          <select name="sexo" defaultValue={c?.sexo ?? ""} className="campo">
            <option value="">Não informado</option>
            <option value="F">Menina</option>
            <option value="M">Menino</option>
          </select>
        </Campo>
        <Campo label="Código no sistema antigo" dica="Usado pela importação para atualizar em vez de duplicar.">
          <input name="idExterno" defaultValue={c?.idExterno ?? ""} className="campo" />
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="chamada mb-3">Tamanhos</legend>
        <Campo label="Camiseta">
          <input name="tamanhoCamiseta" defaultValue={c?.tamanhoCamiseta ?? ""} placeholder="Ex.: 8" className="campo" />
        </Campo>
        <Campo label="Calça">
          <input name="tamanhoCalca" defaultValue={c?.tamanhoCalca ?? ""} placeholder="Ex.: 8" className="campo" />
        </Campo>
        <Campo label="Calçado">
          <input name="tamanhoCalcado" defaultValue={c?.tamanhoCalcado ?? ""} placeholder="Ex.: 30" className="campo" />
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="chamada mb-3">Para o padrinho (aparece no site)</legend>
        <Campo label="Sugestão de presente">
          <input name="sugestaoPresente" defaultValue={c?.sugestaoPresente ?? ""} className="campo" />
        </Campo>
        <Campo label="Do que gosta">
          <input name="gostos" defaultValue={c?.gostos ?? ""} placeholder="Ex.: futebol, desenhar" className="campo" />
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="chamada mb-3">Responsável (só no painel)</legend>
        <Campo label="Nome do responsável">
          <input name="responsavelNome" defaultValue={c?.responsavelNome ?? ""} className="campo" />
        </Campo>
        <Campo label="Contato do responsável">
          <input name="responsavelContato" defaultValue={c?.responsavelContato ?? ""} placeholder="Telefone ou WhatsApp" className="campo" />
        </Campo>
        <Campo label="Autorização de uso de imagem" dica="Sem autorização, o site mostra o avatar no lugar da foto.">
          <select name="autorizacaoImagem" defaultValue={c?.autorizacaoImagem ? "sim" : "nao"} className="campo">
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
        </Campo>
        <div>
          <span className="rotulo">Data da autorização</span>
          <DatePicker name="autorizacaoImagemData" defaultValue={c?.autorizacaoImagemData ?? ""} />
        </div>
        <Campo label="Observações" className="sm:col-span-2">
          <textarea name="observacoes" rows={3} defaultValue={c?.observacoes ?? ""} className="campo" />
        </Campo>
      </fieldset>

      <SubmitButton className="btn btn-primario">{botao}</SubmitButton>
    </ActionForm>
  );
}
