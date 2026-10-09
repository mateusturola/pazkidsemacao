import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";

export const metadata: Metadata = { title: "Auditoria" };

const ENTIDADE: Record<string, string> = {
  crianca: "Criança",
  campanha: "Campanha",
  participacao: "Apadrinhamento",
  pedido: "Pedido",
  ponto_coleta: "Ponto de entrega",
  usuario: "Usuário",
};
const LINK: Record<string, (id: string) => string> = {
  crianca: (id) => `/criancas/${id}`,
  campanha: (id) => `/campanhas/${id}`,
  pedido: (id) => `/pedidos/${id}`,
};

export default async function AuditoriaPage() {
  await requireAdmin();
  const log = await getDb().select().from(schema.logAuditoria).orderBy(desc(schema.logAuditoria.criadoEm)).limit(300);
  return (
    <div>
      <h1 className="text-3xl font-semibold">Auditoria</h1>
      <p className="mt-1 text-tinta-2">Quem alterou o quê e quando. As 300 alterações mais recentes.</p>
      <div className="cartao mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-linha text-left text-xs text-tinta-2 uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Quando</th>
              <th className="px-4 py-3 font-semibold">Quem</th>
              <th className="px-4 py-3 font-semibold">O quê</th>
              <th className="px-4 py-3 font-semibold">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linha align-top">
            {log.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2 whitespace-nowrap text-tinta-2">{formatDateTime(l.criadoEm)}</td>
                <td className="px-4 py-2">{l.autor}</td>
                <td className="px-4 py-2">
                  {l.acao} ·{" "}
                  {l.entidadeId && LINK[l.entidade] ? (
                    <a href={LINK[l.entidade](l.entidadeId)} className="text-verde hover:underline">
                      {ENTIDADE[l.entidade] ?? l.entidade} {l.entidadeId}
                    </a>
                  ) : (
                    `${ENTIDADE[l.entidade] ?? l.entidade} ${l.entidadeId ?? ""}`
                  )}
                </td>
                <td className="max-w-md px-4 py-2 font-mono text-xs break-all text-tinta-2">{l.detalhes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
