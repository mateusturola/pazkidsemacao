import "server-only";
import { getDb, schema } from "@/lib/db";

/**
 * Registra quem mudou o quê. Falha aqui não pode derrubar a ação que já aconteceu, então o erro
 * só vai para o log do Worker.
 */
export async function auditar(autor: string, acao: string, entidade: string, entidadeId: string | number | null, detalhes?: unknown) {
  try {
    await getDb()
      .insert(schema.logAuditoria)
      .values({
        autor,
        acao,
        entidade,
        entidadeId: entidadeId == null ? null : String(entidadeId),
        detalhes: detalhes === undefined ? null : typeof detalhes === "string" ? detalhes : JSON.stringify(detalhes),
      });
  } catch (err) {
    console.error("auditoria", err);
  }
}
