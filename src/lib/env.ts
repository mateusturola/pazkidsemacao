import { getCloudflareContext } from "@opennextjs/cloudflare";

type Vars =
  | "SITE_URL"
  | "PAINEL_URL"
  | "ADMIN_EMAIL"
  | "ACCESS_TEAM_DOMAIN"
  | "ACCESS_AUD"
  | "ASAAS_API_KEY"
  | "ASAAS_ENV"
  | "ASAAS_WEBHOOK_TOKEN";

// No Worker em produção as variáveis chegam em process.env; no `next dev` os secrets do
// .dev.vars só existem no contexto do Cloudflare. Ler dos dois cobre os dois ambientes.
export function env(name: Vars): string {
  try {
    const value = (getCloudflareContext().env as unknown as Record<string, unknown>)[name];
    if (typeof value === "string" && value) return value;
  } catch {
    // Fora de uma requisição (build, por exemplo) não há contexto: cai no process.env.
  }
  return process.env[name] ?? "";
}
