import type { Metadata } from "next";
import Link from "next/link";
import { desc, ne } from "drizzle-orm";
import { Importador } from "@/components/painel/importador";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { importarCriancas } from "../actions";

export const metadata: Metadata = { title: "Importar planilha" };

export default async function ImportarPage() {
  await requireAdmin();
  const campanhas = await getDb()
    .select({ id: schema.campanhas.id, nome: schema.campanhas.nome })
    .from(schema.campanhas)
    .where(ne(schema.campanhas.status, "encerrada"))
    .orderBy(desc(schema.campanhas.criadoEm));
  return (
    <div className="max-w-5xl">
      <Link href="/criancas" className="text-sm text-tinta-2 hover:text-tinta">
        ← Crianças
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">Importar planilha</h1>
      <p className="mt-1 max-w-2xl text-tinta-2">
        Para trazer as crianças do sistema antigo. A planilha é lida aqui no navegador; só as linhas já organizadas vão para o servidor.
      </p>
      <div className="mt-6">
        <Importador campanhas={campanhas} importar={importarCriancas} />
      </div>
    </div>
  );
}
