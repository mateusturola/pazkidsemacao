import type { Metadata } from "next";
import { desc, ne } from "drizzle-orm";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { campanhaAberta } from "@/lib/campanhas";
import { getDb, schema } from "@/lib/db";
import { emailConfigurado } from "@/lib/email";
import { convitesDaCampanha, destinatarios, montarConvite, resumoOrigem, textoPadrao, type Destinatario } from "@/lib/novidades";
import { enviarConvitesAction } from "./actions";

export const metadata: Metadata = { title: "Convites" };

// Só para a prévia quando ninguém da lista está apto: mostra como o e-mail fica, sem dado de ninguém.
const EXEMPLO: Destinatario = { email: "", nome: "Fulano", token: "exemplo", criancas: [{ nome: "Maria", apelidoPublico: null, sexo: "F", sonho: "professora" }] };

/**
 * Convite de uma campanha nova para quem apadrinhou numa anterior. Vai só para quem marcou, no
 * finalizar, que quer receber as próximas campanhas (LGPD), e uma vez por pessoa por campanha.
 */
export default async function ConvitesPage({ searchParams }: { searchParams: Promise<{ origem?: string; destino?: string; assunto?: string; mensagem?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const lista = await getDb().select().from(schema.campanhas).where(ne(schema.campanhas.status, "rascunho")).orderBy(desc(schema.campanhas.criadoEm));

  const destino = lista.find((c) => c.id === Number(sp.destino)) ?? lista.find(campanhaAberta) ?? lista[0];
  const anteriores = lista.filter((c) => c.id !== destino?.id);
  const origem = anteriores.find((c) => c.id === Number(sp.origem)) ?? anteriores[0];

  if (!destino || !origem) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold">Convites</h1>
        <p className="cartao mt-6 p-6 text-tinta-2">
          Ainda não há uma campanha anterior para convidar os padrinhos. Quando a próxima campanha for criada, é aqui que vocês convidam quem
          apadrinhou nesta. Até lá, o site já está guardando quem pediu para receber as próximas campanhas.
        </p>
      </div>
    );
  }

  const padrao = textoPadrao(destino);
  const assunto = sp.assunto?.trim() || padrao.assunto;
  const mensagem = sp.mensagem?.trim() || padrao.mensagem;
  const [fila, resumo, jaEnviados] = await Promise.all([destinatarios(origem.id, destino.id), resumoOrigem(origem.id), convitesDaCampanha(destino.id)]);
  const previa = montarConvite(fila[0] ?? EXEMPLO, origem, destino, assunto, mensagem);
  const aberta = campanhaAberta(destino);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold">Convites</h1>
      <p className="mt-1 max-w-2xl text-tinta-2">
        Mande a campanha nova para quem apadrinhou numa anterior. O e-mail lembra das crianças que a pessoa apadrinhou e só vai para quem pediu para
        receber as próximas campanhas.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <form className="cartao space-y-4 p-5">
            <label className="block">
              <span className="rotulo">Convidar para</span>
              <select name="destino" defaultValue={destino.id} className="campo">
                {lista.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                    {campanhaAberta(c) ? " (aberta)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="rotulo">Quem apadrinhou em</span>
              <select name="origem" defaultValue={origem.id} className="campo">
                {anteriores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="rotulo">Assunto</span>
              <input name="assunto" defaultValue={assunto} maxLength={150} className="campo" />
            </label>
            <label className="block">
              <span className="rotulo">Mensagem (depois de &quot;Na campanha tal, você apadrinhou…&quot;)</span>
              <textarea name="mensagem" defaultValue={mensagem} rows={6} maxLength={3000} className="campo" />
            </label>
            <button className="btn btn-claro">Atualizar a prévia</button>
          </form>

          <div className="cartao space-y-2 p-5 text-sm">
            <p>
              Na <strong>{origem.nome}</strong>, {resumo.padrinhos} pessoa(s) apadrinharam e {resumo.inscritos} pediram para receber as próximas
              campanhas.
            </p>
            <p>
              Ainda não receberam este convite: <strong>{fila.length}</strong>.
              {jaEnviados.enviado ? ` Já enviados: ${jaEnviados.enviado}.` : ""}
              {jaEnviados.demo ? ` Gerados sem envio: ${jaEnviados.demo}.` : ""}
              {jaEnviados.erro ? ` Com erro: ${jaEnviados.erro}.` : ""}
            </p>
            {!emailConfigurado() && <p className="text-vermelho">O envio de e-mail não está configurado: o convite é gerado, mas ninguém recebe.</p>}
            {!aberta && <p className="text-vermelho">A {destino.nome} não está aberta. Ative a campanha antes de convidar.</p>}
          </div>

          {/* Sempre montado quando a campanha está aberta: o resultado do envio continua na tela mesmo com a fila zerada. */}
          {aberta && (
            <ActionForm action={enviarConvitesAction} className="cartao space-y-3 p-5">
              <input type="hidden" name="origem" value={origem.id} />
              <input type="hidden" name="destino" value={destino.id} />
              <input type="hidden" name="assunto" value={assunto} />
              <input type="hidden" name="mensagem" value={mensagem} />
              {fila.length > 0 ? (
                <>
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" name="conferi" value="1" required className="mt-0.5 size-4" />
                    <span>Conferi a prévia ao lado. Cada pessoa recebe um e-mail só, com as crianças dela.</span>
                  </label>
                  <SubmitButton className="btn btn-primario" pendingText="Enviando…">
                    Enviar convite para {fila.length} pessoa(s)
                  </SubmitButton>
                </>
              ) : (
                <p className="text-sm text-tinta-2">Ninguém para convidar agora: quem pediu para receber já recebeu este convite.</p>
              )}
            </ActionForm>
          )}
        </div>

        <div>
          <p className="rotulo">
            Prévia{fila[0] ? `: como ${fila[0].nome.split(" ")[0]} vai receber` : " com dados de exemplo (ninguém da lista ainda)"}
          </p>
          <p className="mt-1 text-sm text-tinta-2">Assunto: {previa.assunto}</p>
          {/* Sem permissão nenhuma: a prévia só mostra o HTML, não roda nada. */}
          <iframe title="Prévia do convite" srcDoc={previa.html} sandbox="" className="mt-2 h-[760px] w-full rounded-xl border border-linha bg-white" />
        </div>
      </div>
    </div>
  );
}
