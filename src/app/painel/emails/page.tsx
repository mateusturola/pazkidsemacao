import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { usuarioAtual } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { emailConfigurado } from "@/lib/email";
import { STATUS_EMAIL, TIPO_EMAIL } from "@/lib/email-labels";
import { rodarLembretes } from "./actions";

export const metadata: Metadata = { title: "E-mails" };

export default async function EmailsPage() {
  const u = await usuarioAtual();
  const lista = await getDb()
    .select({ e: schema.emailsEnviados, padrinho: schema.padrinhos.nome })
    .from(schema.emailsEnviados)
    .innerJoin(schema.pedidos, eq(schema.pedidos.id, schema.emailsEnviados.pedidoId))
    .innerJoin(schema.padrinhos, eq(schema.padrinhos.id, schema.pedidos.padrinhoId))
    .orderBy(desc(schema.emailsEnviados.criadoEm))
    .limit(200);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">E-mails aos padrinhos</h1>
          <p className="mt-1 max-w-2xl text-tinta-2">
            Agradecimento ao apadrinhar (no online, quando o pagamento confirma), lembrete 3 dias antes e na véspera do prazo do balcão, e aviso
            quando a sacolinha chega. Os lembretes saem sozinhos todo dia às 9h.
          </p>
        </div>
        {u?.papel === "admin" && (
          <ActionForm action={rodarLembretes} className="flex flex-col items-end gap-1">
            <SubmitButton className="btn btn-claro" pendingText="Verificando…">
              Rodar lembretes agora
            </SubmitButton>
          </ActionForm>
        )}
      </div>
      {!emailConfigurado() && (
        <p className="mt-5 rounded-xl border border-amarelo/60 bg-amarelo/10 p-4 text-sm">
          Modo demonstração: os e-mails são montados e aparecem aqui, mas ninguém recebe. Para enviar de verdade, cadastre RESEND_API_KEY e um
          remetente com domínio verificado no Resend.
        </p>
      )}
      {lista.length === 0 ? (
        <p className="cartao mt-6 p-8 text-center text-tinta-2">Nenhum e-mail ainda.</p>
      ) : (
        <ul className="cartao mt-6 divide-y divide-linha">
          {lista.map(({ e, padrinho }) => (
            <li key={e.id}>
              <Link href={`/emails/${e.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm hover:bg-creme/40">
                <span className="font-semibold">{e.assunto}</span>
                <span className="text-tinta-2">
                  {padrinho} · {e.para}
                </span>
                <span className="ml-auto flex items-center gap-3">
                  <span className="text-tinta-2">{TIPO_EMAIL[e.tipo]}</span>
                  <span className={STATUS_EMAIL[e.status].cor}>{STATUS_EMAIL[e.status].label}</span>
                  <span className="text-tinta-2">{formatDateTime(e.criadoEm)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
