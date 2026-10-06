import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { formatDateTime } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { STATUS_EMAIL, TIPO_EMAIL } from "@/lib/email-labels";

export const metadata: Metadata = { title: "E-mail" };

export default async function EmailPage({ params }: { params: Promise<{ id: string }> }) {
  const [e] = await getDb()
    .select()
    .from(schema.emailsEnviados)
    .where(eq(schema.emailsEnviados.id, Number((await params).id)))
    .limit(1);
  if (!e) notFound();
  return (
    <div className="max-w-3xl">
      <Link href="/emails" className="text-sm text-tinta-2 hover:text-tinta">
        ← E-mails
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{e.assunto}</h1>
      <p className="mt-1 text-sm text-tinta-2">
        Para {e.para} · {TIPO_EMAIL[e.tipo]} · <span className={STATUS_EMAIL[e.status].cor}>{STATUS_EMAIL[e.status].label}</span> ·{" "}
        {formatDateTime(e.criadoEm)} ·{" "}
        <Link href={`/pedidos/${e.pedidoId}`} className="text-verde hover:underline">
          pedido #{e.pedidoId}
        </Link>
      </p>
      {e.erro && <p className="mt-3 rounded-lg bg-vermelho/5 p-3 text-sm text-vermelho">{e.erro}</p>}
      {/* sandbox sem permissões: o HTML é nosso, mas o painel não executa nada que venha de um e-mail. */}
      <iframe title="Prévia do e-mail" srcDoc={e.html} sandbox="" className="mt-6 h-[900px] w-full rounded-2xl border border-linha bg-white" />
    </div>
  );
}
