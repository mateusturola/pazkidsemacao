import { asaasConfigured } from "@/lib/asaas";
import { env } from "@/lib/env";

/**
 * "pix": sem gateway. O doador faz o Pix na chave do projeto (com o QR Code e o copia e cola já com o
 * valor), manda o comprovante pelo WhatsApp e a equipe confirma no pedido, no painel. É o modo enquanto
 * a conta de recebimento da igreja não sai.
 * "asaas": cobrança e confirmação automáticas pelo Asaas.
 * "demo": o fluxo do Asaas de ponta a ponta com a tela de pagamento simulada; ninguém é cobrado.
 * Qualquer outro valor cai no demo: esquecer a variável não pode virar cobrança de verdade.
 */
export function modoPagamento(): "demo" | "asaas" | "pix" {
  const modo = env("PAGAMENTO_MODO");
  return modo === "asaas" || modo === "pix" ? modo : "demo";
}

export function pagamentoOnlineDisponivel() {
  return modoPagamento() !== "asaas" || asaasConfigured();
}

/** Pedido pago por Pix direto na chave (sem cobrança no gateway): quem confirma é a equipe. */
export const pixDireto = (p: { modalidade: string; asaasPaymentId: string | null }) => p.modalidade === "pagamento_online" && !p.asaasPaymentId;

/**
 * No Pix direto, a criança fica reservada até a equipe conferir o comprovante. Dois dias cobrem um fim de
 * semana sem prender a criança por muito tempo se a pessoa desistir; o Pix que chegar depois ainda é
 * confirmado (confirmarPagamento tenta reservar de novo ou deixa a pendência para a equipe).
 */
export const RESERVA_PIX_HORAS = 48;
