import { asaasConfigured } from "@/lib/asaas";
import { env } from "@/lib/env";

/**
 * "demo": o pagamento online funciona de ponta a ponta (reserva, tela de pagamento, confirmação,
 * e-mail), mas a tela é simulada e ninguém é cobrado. Serve para a equipe ver o fluxo antes de
 * existir a conta do Asaas. Qualquer valor diferente de "asaas" cai no demo: esquecer a variável
 * não pode virar cobrança de verdade.
 */
export function modoPagamento(): "demo" | "asaas" {
  return env("PAGAMENTO_MODO") === "asaas" ? "asaas" : "demo";
}

export function pagamentoOnlineDisponivel() {
  return modoPagamento() === "demo" || asaasConfigured();
}
