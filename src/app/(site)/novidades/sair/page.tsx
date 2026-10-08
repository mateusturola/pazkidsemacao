import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Rodape } from "@/components/site/rodape";
import { Topo } from "@/components/site/topo";
import { SITE } from "@/content/site";
import { getDb, schema } from "@/lib/db";
import { confirmarSaida } from "./actions";

export const dynamic = "force-dynamic";

// O link leva o token da pessoa: fora dos buscadores e sem passar o endereço adiante.
export const metadata: Metadata = { title: "Não quero mais receber", robots: { index: false, follow: false }, referrer: "no-referrer" };

/**
 * O "não quero mais receber" dos convites. Pede um clique de confirmação porque alguns filtros de
 * e-mail abrem os links sozinhos: sem ele, a pessoa sairia da lista sem ter pedido.
 */
export default async function SairPage({ searchParams }: { searchParams: Promise<{ t?: string; ok?: string }> }) {
  const { t = "", ok } = await searchParams;
  const [inscricao] = t
    ? await getDb().select().from(schema.inscricoesNovidades).where(eq(schema.inscricoesNovidades.token, t)).limit(1)
    : [];
  const saiu = Boolean(inscricao?.descadastradoEm) || ok === "1";

  return (
    <div className="tema-paz">
      <Topo variante="institucional" links={[{ href: "/", label: "Início" }]} />
      <main className="bg-creme pt-[72px]">
        <section className="mx-auto max-w-xl px-4 py-20 sm:px-8 sm:py-28">
          {!inscricao ? (
            <>
              <h1 className="text-3xl font-bold text-verde sm:text-4xl">Link não encontrado</h1>
              <p className="mt-4 text-lg text-tinta-2">
                Este link não é mais válido. Se quiser sair da lista, chame a gente no WhatsApp{" "}
                <a href={SITE.whatsapp.link} className="font-bold text-verde underline decoration-amarelo decoration-2 underline-offset-4">
                  {SITE.whatsapp.numero}
                </a>
                .
              </p>
            </>
          ) : saiu ? (
            <>
              <h1 className="text-3xl font-bold text-verde sm:text-4xl">Pronto, você saiu da lista</h1>
              <p className="mt-4 text-lg text-tinta-2">
                Não vamos mais mandar as próximas campanhas para <strong>{inscricao.email}</strong>. Se um dia quiser voltar, é só marcar a opção quando
                apadrinhar de novo.
              </p>
              <Link href="/" className="btn btn-claro mt-8">
                Conhecer o Paz Kids em Ação
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-verde sm:text-4xl">Não quer mais receber nossas campanhas?</h1>
              <p className="mt-4 text-lg text-tinta-2">
                Ao confirmar, <strong>{inscricao.email}</strong> sai da lista. Os e-mails de um apadrinhamento que já está em andamento continuam
                chegando, porque eles falam da entrega da sacolinha.
              </p>
              <form action={confirmarSaida.bind(null, t)} className="mt-8">
                <button className="btn btn-escuro">Confirmar: não quero mais receber</button>
              </form>
            </>
          )}
        </section>
      </main>
      <Rodape variante="institucional" />
    </div>
  );
}
