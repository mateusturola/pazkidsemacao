"use server";

import { revalidatePath } from "next/cache";
import { saveWebhook } from "@/lib/asaas";
import { auditar } from "@/lib/auditoria";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";

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
