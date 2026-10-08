import type { Metadata } from "next";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { accountInfo, asaasConfigured, asaasEnv, findWebhook } from "@/lib/asaas";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { formatBRL } from "@/lib/money";
import { instagramConfigurado, postsInstagram } from "@/lib/instagram";
import { modoPagamento } from "@/lib/pagamento";
import { emailConfigurado } from "@/lib/email";
import { contarDemonstracao } from "@/lib/demonstracao";
import { apagarDadosDemonstracao, atualizarInstagramAgora, configurarWebhook } from "./actions";

export const metadata: Metadata = { title: "Configurações" };

async function statusAsaas() {
  if (!asaasConfigured()) return { erro: "Sem chave (secret ASAAS_API_KEY). O pagamento online fica escondido no site." };
  try {
    const url = `${env("SITE_URL")}/api/asaas/webhook`;
    const [conta, webhook] = await Promise.all([accountInfo(), findWebhook(url)]);
    return { conta, webhook, url };
  } catch (err) {
    return { erro: err instanceof Error ? err.message : "Não foi possível falar com o Asaas." };
  }
}

export default async function ConfiguracoesPage() {
  await requireAdmin();
  const s = await statusAsaas();
  const [igOk, posts, demo] = await Promise.all([instagramConfigurado(), postsInstagram(), contarDemonstracao()]);
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold">Configurações</h1>

      <section id="demonstracao" className="cartao scroll-mt-24 p-5">
        <h2 className="text-lg font-semibold">Dados de demonstração</h2>
        {demo.criancas ? (
          <>
            <p className="mt-1 text-sm text-tinta-2">
              Há <strong>{demo.criancas} criança(s) de demonstração</strong>, com nomes fictícios, aparecendo no site
              {demo.pedidos ? <>, e {demo.pedidos} pedido(s) de teste</> : null}. Apague antes de divulgar a campanha. Saem também os pedidos, e-mails e
              padrinhos de teste ligados a elas. As crianças reais não são afetadas.
            </p>
            <ActionForm action={apagarDadosDemonstracao} className="mt-3 space-y-2">
              <label className="block text-sm">
                Para confirmar, digite <strong>APAGAR</strong>
                <input name="confirmar" autoComplete="off" className="campo mt-1 max-w-xs" />
              </label>
              <SubmitButton className="btn btn-sm bg-vermelho text-white hover:bg-vermelho/90" pendingText="Apagando…">
                Apagar dados de demonstração
              </SubmitButton>
            </ActionForm>
          </>
        ) : (
          <p className="mt-1 text-sm text-tinta-2">Nenhum dado de demonstração. Tudo que está no painel é real.</p>
        )}
      </section>

      <section className="cartao p-5">
        <h2 className="text-lg font-semibold">Asaas</h2>
        <p className="mt-1 text-sm text-tinta-2">
          Ambiente: <strong>{asaasEnv() === "production" ? "produção (cobranças reais)" : "sandbox (testes)"}</strong>. Muda pela variável ASAAS_ENV no wrangler.jsonc.
        </p>
        {"erro" in s ? (
          <p className="mt-3 text-sm text-vermelho">{s.erro}</p>
        ) : (
          <>
            <dl className="mt-3 space-y-1 text-sm">
              <div>
                <dt className="inline text-tinta-2">Conta: </dt>
                <dd className="inline">{s.conta.name}</dd>
              </div>
              <div>
                <dt className="inline text-tinta-2">Saldo: </dt>
                <dd className="inline">{formatBRL(s.conta.balanceCents)}</dd>
              </div>
              <div>
                <dt className="inline text-tinta-2">Webhook: </dt>
                <dd className="inline">
                  {s.webhook ? (s.webhook.enabled && !s.webhook.interrupted ? "ativo" : "pausado pelo Asaas") : "não cadastrado"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-tinta-2">
              O webhook é como o Asaas avisa que o pagamento caiu. Sem ele, as crianças pagas online voltam para o site depois de 30 minutos.
            </p>
            <ActionForm action={configurarWebhook} className="mt-3 space-y-2">
              <SubmitButton className="btn btn-claro btn-sm" pendingText="Configurando…">
                {s.webhook ? "Reativar webhook" : "Cadastrar webhook"}
              </SubmitButton>
            </ActionForm>
          </>
        )}
      </section>

      <section className="cartao p-5">
        <h2 className="text-lg font-semibold">Pagamento online</h2>
        <p className="mt-1 text-sm text-tinta-2">
          {modoPagamento() === "demo"
            ? "Modo demonstração (PAGAMENTO_MODO=demo): o fluxo funciona inteiro com uma tela de pagamento simulada, e ninguém é cobrado."
            : "Cobrança de verdade pelo Asaas (PAGAMENTO_MODO=asaas)."}
        </p>
      </section>

      <section className="cartao p-5">
        <h2 className="text-lg font-semibold">E-mails</h2>
        <p className="mt-1 text-sm text-tinta-2">
          {emailConfigurado()
            ? "Envio ativo pelo Resend. Veja cada e-mail em E-mails."
            : "Modo demonstração: os e-mails aparecem em E-mails, mas não são enviados (falta RESEND_API_KEY ou EMAIL_REMETENTE)."}
        </p>
      </section>

      <section className="cartao p-5">
        <h2 className="text-lg font-semibold">Instagram</h2>
        <p className="mt-1 text-sm text-tinta-2">
          {igOk
            ? `Conectado. ${posts.length} post(s) no site; atualiza sozinho todo dia.`
            : "Sem token: o site mostra fotos das ações no lugar dos posts. Cadastre o secret INSTAGRAM_TOKEN (veja o README)."}
        </p>
        {igOk && (
          <ActionForm action={atualizarInstagramAgora} className="mt-3 space-y-2">
            <SubmitButton className="btn btn-claro btn-sm" pendingText="Buscando…">
              Atualizar agora
            </SubmitButton>
          </ActionForm>
        )}
      </section>

      <section className="cartao p-5">
        <h2 className="text-lg font-semibold">Backup</h2>
        <p className="mt-1 text-sm text-tinta-2">
          O D1 guarda 30 dias de histórico (Time Travel) e permite voltar a qualquer minuto desse período. Para ter uma cópia fora da
          Cloudflare, rode <code className="rounded bg-creme px-1">npm run db:backup</code> de tempos em tempos e guarde o arquivo num lugar
          privado: ele tem dados de crianças.
        </p>
      </section>
    </div>
  );
}
