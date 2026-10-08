"use server";

import { revalidatePath } from "next/cache";
import { saveWebhook } from "@/lib/asaas";
import { auditar } from "@/lib/auditoria";
import { requireAdmin } from "@/lib/auth";
import { apagarDemonstracao } from "@/lib/demonstracao";
import { env } from "@/lib/env";
import { atualizarInstagram } from "@/lib/instagram";

export async function configurarWebhook(): Promise<string | null> {
  const u = await requireAdmin();
  const token = env("ASAAS_WEBHOOK_TOKEN");
  if (!token) return "Cadastre o secret ASAAS_WEBHOOK_TOKEN antes (wrangler secret put ASAAS_WEBHOOK_TOKEN).";
  try {
    await saveWebhook(`${env("SITE_URL")}/api/asaas/webhook`, u.email, token);
  } catch (err) {
    return err instanceof Error ? err.message : "O Asaas recusou o webhook.";
  }
  await auditar(u.email, "configurou webhook do Asaas", "configuracao", null);
  revalidatePath("/painel/configuracoes");
  return "Salvo.";
}

export async function atualizarInstagramAgora(): Promise<string | null> {
  const u = await requireAdmin();
  const r = await atualizarInstagram();
  await auditar(u.email, "atualizou Instagram", "configuracao", null, r);
  revalidatePath("/painel/configuracoes");
  revalidatePath("/");
  return r.ok ? `${"posts" in r ? r.posts : 0} post(s) atualizados.` : `Não foi possível: ${"motivo" in r ? r.motivo : ""}`;
}

export async function apagarDadosDemonstracao(_: string | null, form: FormData): Promise<string | null> {
  const u = await requireAdmin();
  // Apaga de uma vez centenas de linhas: a palavra digitada evita o clique sem querer.
  if (String(form.get("confirmar") ?? "").trim().toUpperCase() !== "APAGAR") return "Digite APAGAR para confirmar.";
  let r;
  try {
    r = await apagarDemonstracao();
  } catch (err) {
    return err instanceof Error ? err.message : "Não foi possível apagar.";
  }
  await auditar(u.email, "apagou dados de demonstração", "configuracao", null, r);
  revalidatePath("/painel", "layout");
  revalidatePath("/", "layout");
  return "Salvo.";
}
