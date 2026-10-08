"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auditar } from "@/lib/auditoria";
import { requireAdmin } from "@/lib/auth";
import { campanhaAberta } from "@/lib/campanhas";
import { getDb, schema } from "@/lib/db";
import { enviarConvites } from "@/lib/novidades";

export async function enviarConvitesAction(_: string | null, form: FormData): Promise<string | null> {
  const u = await requireAdmin();
  const origemId = Number(form.get("origem"));
  const destinoId = Number(form.get("destino"));
  const assunto = String(form.get("assunto") ?? "").trim().slice(0, 150);
  const mensagem = String(form.get("mensagem") ?? "").trim().slice(0, 3000);
  if (!assunto || !mensagem) return "Preencha o assunto e a mensagem.";
  if (form.get("conferi") !== "1") return "Marque que conferiu a prévia.";
  if (!origemId || !destinoId || origemId === destinoId) return "Escolha duas campanhas diferentes.";

  const db = getDb();
  const [[origem], [destino]] = await Promise.all([
    db.select().from(schema.campanhas).where(eq(schema.campanhas.id, origemId)).limit(1),
    db.select().from(schema.campanhas).where(eq(schema.campanhas.id, destinoId)).limit(1),
  ]);
  if (!origem || !destino) return "Campanha não encontrada.";
  // O botão do e-mail leva para a página da campanha: fechada, a pessoa chegaria num "encerrada".
  if (!campanhaAberta(destino)) return `A ${destino.nome} não está aberta. Ative a campanha antes de convidar.`;

  const r = await enviarConvites(origem, destino, assunto, mensagem, u.email);
  await auditar(u.email, "enviou convites", "campanha", destino.id, { origem: origem.id, ...r });
  revalidatePath("/painel/convites");
  if (!r.enviados && !r.demo && !r.erros) return "Ninguém para convidar: todo mundo da lista já recebeu este convite.";
  const partes = [
    r.enviados ? `${r.enviados} convite(s) enviado(s)` : "",
    r.demo ? `${r.demo} convite(s) gerado(s) sem envio, porque o envio de e-mail não está configurado` : "",
    r.erros ? `${r.erros} com erro do provedor de e-mail` : "",
    r.restantes ? `faltam ${r.restantes}: clique em enviar de novo` : "",
  ].filter(Boolean);
  return `${r.enviados || r.demo ? "Pronto: " : ""}${partes.join(". ")}.`;
}
