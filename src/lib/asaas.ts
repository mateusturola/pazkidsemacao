import "server-only";
import { env } from "@/lib/env";

// API do Asaas (https://docs.asaas.com). Sandbox e produção são contas separadas, com chaves e
// endereços próprios: um cus_/pay_ de uma não existe na outra. ASAAS_ENV escolhe qual; sem ele,
// fica no sandbox — esquecer a variável não pode virar cobrança de verdade.

export function asaasEnv(): "production" | "sandbox" {
  return env("ASAAS_ENV") === "production" ? "production" : "sandbox";
}

const BASE = { production: "https://api.asaas.com/v3", sandbox: "https://api-sandbox.asaas.com/v3" };

export const asaasConfigured = () => Boolean(env("ASAAS_API_KEY"));

export class AsaasError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const key = env("ASAAS_API_KEY");
  if (!key) throw new AsaasError(0, "Chave do Asaas não configurada.");
  const res = await fetch(`${BASE[asaasEnv()]}${path}`, {
    method: init.method ?? "GET",
    headers: {
      access_token: key,
      "content-type": "application/json",
      // Contas novas do Asaas recusam requisição sem User-Agent.
      "user-agent": "pazkidsemacao",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = (await res.json().catch(() => ({}))) as { errors?: { description?: string }[] } & T;
  if (!res.ok) {
    const msg = data.errors?.map((e) => e.description).filter(Boolean).join(" ") || `Asaas respondeu ${res.status}.`;
    throw new AsaasError(res.status, msg);
  }
  return data;
}

// ---------- clientes ----------

type CustomerInput = { name: string; cpfCnpj: string; email: string | null; phone: string | null; externalReference: string };

/**
 * Celular no formato que o Asaas valida (DDD + número). Um telefone fora do padrão faz o cadastro
 * inteiro falhar, então é melhor mandar sem telefone do que travar a cobrança por ele.
 */
function asaasPhone(phone: string | null) {
  let d = phone?.replace(/\D/g, "") ?? "";
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d.length === 10 || d.length === 11 ? d : undefined;
}

function customerBody(c: CustomerInput) {
  return {
    name: c.name,
    cpfCnpj: c.cpfCnpj,
    email: c.email?.includes("@") ? c.email : undefined,
    mobilePhone: asaasPhone(c.phone),
    externalReference: c.externalReference,
    // E-mail e SMS do Asaas cobram tarifa por envio; o doador acompanha pela página do pedido.
    notificationDisabled: true,
  };
}

/**
 * Devolve o id do cliente no Asaas, criando ou atualizando. Com id salvo, atualiza; sem id, procura
 * pelo CPF antes de criar, para não duplicar o padrinho que volta numa campanha seguinte.
 */
export async function upsertCustomer(existingId: string | null, c: CustomerInput) {
  const body = customerBody(c);
  if (existingId) {
    try {
      await call(`/customers/${existingId}`, { method: "POST", body });
      return existingId;
    } catch (err) {
      // 404: id de outro ambiente (sandbox x produção) ou cliente removido lá. Segue para buscar/criar.
      if (!(err instanceof AsaasError && err.status === 404)) throw err;
    }
  }
  const found = await call<{ data: { id: string; deleted?: boolean }[] }>(`/customers?cpfCnpj=${c.cpfCnpj}`);
  const alive = found.data.find((x) => !x.deleted);
  if (alive) {
    await call(`/customers/${alive.id}`, { method: "POST", body });
    return alive.id;
  }
  const created = await call<{ id: string }>("/customers", { method: "POST", body });
  return created.id;
}

// ---------- cobranças ----------

export type AsaasPayment = {
  id: string;
  customer: string;
  installment?: string | null;
  subscription?: string | null;
  value: number;
  netValue?: number;
  billingType: string;
  status: string;
  dueDate: string;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  confirmedDate?: string | null;
  invoiceUrl?: string | null;
  description?: string | null;
  externalReference?: string | null;
  deleted?: boolean;
};

/**
 * Cria a cobrança na forma que o doador escolheu no site. No cartão parcelado, o Asaas cria uma
 * cobrança por parcela e a resposta é a primeira; todas levam o mesmo externalReference.
 */
export async function createPayment(p: {
  customer: string;
  valueCents: number;
  dueDate: string;
  description: string | null;
  billingType: "PIX" | "CREDIT_CARD";
  installments: number;
  externalReference: string;
}) {
  const value = p.valueCents / 100;
  return call<AsaasPayment>("/payments", {
    method: "POST",
    body: {
      customer: p.customer,
      billingType: p.billingType,
      dueDate: p.dueDate,
      description: p.description ?? undefined,
      externalReference: p.externalReference,
      ...(p.billingType === "CREDIT_CARD" && p.installments > 1 ? { installmentCount: p.installments, totalValue: value } : { value }),
    },
  });
}

export async function deletePayment(id: string) {
  await call(`/payments/${id}`, { method: "DELETE" });
}

// ---------- conta e webhook ----------

export async function accountInfo() {
  const [account, balance] = await Promise.all([
    call<{ name?: string; email?: string; cpfCnpj?: string }>("/myAccount"),
    call<{ balance: number }>("/finance/balance"),
  ]);
  return { name: account.name ?? "", email: account.email ?? "", balanceCents: Math.round(balance.balance * 100) };
}

export const WEBHOOK_EVENTS = [
  "PAYMENT_CREATED",
  "PAYMENT_UPDATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_RESTORED",
  "PAYMENT_REFUNDED",
  "PAYMENT_RECEIVED_IN_CASH_UNDONE",
  "PAYMENT_CHARGEBACK_REQUESTED",
] as const;

type Webhook = { id: string; name: string; url: string; enabled: boolean; interrupted: boolean; events: string[] };

export async function findWebhook(url: string) {
  const res = await call<{ data: Webhook[] }>("/webhooks?limit=100");
  return res.data.find((w) => w.url === url) ?? null;
}

/** Cria ou reativa o webhook. Reativar também desfaz a pausa que o Asaas aplica depois de falhas seguidas. */
export async function saveWebhook(url: string, email: string, authToken: string) {
  const body = {
    name: "Paz Kids em Ação",
    url,
    email,
    enabled: true,
    interrupted: false,
    apiVersion: 3,
    authToken,
    sendType: "SEQUENTIALLY",
    events: WEBHOOK_EVENTS,
  };
  const existing = await findWebhook(url);
  if (existing) await call(`/webhooks/${existing.id}`, { method: "PUT", body });
  else await call("/webhooks", { method: "POST", body });
}

export const PAID_STATUSES = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];
