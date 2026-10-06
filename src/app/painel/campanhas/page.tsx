import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { StatusBadge } from "@/components/painel/status-badge";
import { usuarioAtual } from "@/lib/auth";
import { progressoCampanhas, STATUS_CAMPANHA_LABEL } from "@/lib/campanhas";
import { formatIsoDate } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";

export const metadata: Metadata = { title: "Campanhas" };

export default async function CampanhasPage() {
  const usuario = await usuarioAtual();
  const lista = await getDb().select().from(schema.campanhas).orderBy(desc(schema.campanhas.criadoEm));
  const progresso = await progressoCampanhas(lista.map((c) => c.id));
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Campanhas</h1>
          <p className="mt-1 text-tinta-2">Cada campanha reaproveita as crianças já cadastradas.</p>
        </div>
        {usuario?.papel === "admin" && (
          <Link href="/campanhas/nova" className="btn btn-primario">
            Nova campanha
          </Link>
        )}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {lista.map((c) => {
          const p = progresso.get(c.id) ?? { total: 0, comPadrinho: 0 };
          return (
            <Link key={c.id} href={`/campanhas/${c.id}`} className="cartao block p-5 transition-colors hover:border-tinta/25">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{c.nome}</h2>
                  <p className="text-sm text-tinta-2">pazkidsemacao.com/{c.slug}</p>
                </div>
                <StatusBadge status={c.status} label={STATUS_CAMPANHA_LABEL[c.status]} />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-creme">
                <div className="h-full rounded-full bg-verde" style={{ width: `${p.total ? (p.comPadrinho / p.total) * 100 : 0}%` }} />
              </div>
              <p className="mt-2 text-sm text-tinta-2">
                {p.comPadrinho} de {p.total} crianças com padrinho
                {c.prazoEntrega && ` · entrega até ${formatIsoDate(c.prazoEntrega)}`}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
