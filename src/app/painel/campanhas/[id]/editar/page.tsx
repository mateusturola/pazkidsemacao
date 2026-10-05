import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CampanhaForm } from "@/components/painel/campanha-form";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { salvarCampanha } from "../../actions";

export const metadata: Metadata = { title: "Editar campanha" };

export default async function EditarCampanhaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const [c] = await getDb().select().from(schema.campanhas).where(eq(schema.campanhas.id, id)).limit(1);
  if (!c) notFound();
  return (
    <div className="max-w-3xl">
      <Link href={`/campanhas/${c.id}`} className="text-sm text-tinta-2 hover:text-tinta">
        ← {c.nome}
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">Editar campanha</h1>
      <div className="cartao mt-6 p-6">
        <CampanhaForm action={salvarCampanha.bind(null, c.id)} campanha={c} botao="Salvar" />
      </div>
    </div>
  );
}
