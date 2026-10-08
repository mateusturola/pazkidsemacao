"use server";

import { redirect } from "next/navigation";
import { auditar } from "@/lib/auditoria";
import { descadastrar } from "@/lib/novidades";

export async function confirmarSaida(token: string) {
  if (await descadastrar(token)) await auditar("site", "saiu da lista de novidades", "inscricao", null);
  redirect(`/novidades/sair?t=${encodeURIComponent(token)}&ok=1`);
}
