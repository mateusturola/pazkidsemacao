"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPayment, upsertCustomer } from "@/lib/asaas";
import { auditar } from "@/lib/auditoria";
import { campanhaAberta, campanhaPorSlug } from "@/lib/campanhas";
import { enviarDepois } from "@/lib/email";
import { nomePublico } from "@/lib/criancas";
import { todayIso } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { cancelarPedido, liberarExpiradas, reservar } from "@/lib/reservas";
import { modoPagamento, pagamentoOnlineDisponivel } from "@/lib/pagamento";
import { MAX_POR_PEDIDO } from "@/lib/regras";
import { novoToken } from "@/lib/token";

const { padrinhos, pedidos, pedidoItens, criancas, pontosColeta } = schema;

/** Reserva do pagamento online. Tempo de abrir o Pix ou digitar o cartão, sem prender a criança à toa. */
const RESERVA_MINUTOS = 30;

function cpfValido(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const dv = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(cpf[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(cpf[9]) && dv(10) === Number(cpf[10]);
}

/** Mensagem e oração para uma criança. Texto puro, sem caractere de controle: vai impresso e para o e-mail. */
function recado(form: FormData, criancaId: number) {
  const mensagem = String(form.get(`mensagem_${criancaId}`) ?? "")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 500);
  return { mensagem: mensagem || null, vaiOrar: form.get(`orar_${criancaId}`) === "1" };
}

export type Estado = { erro: string; indisponiveis?: number[] } | null;

export async function finalizarPedido(slug: string, ids: number[], _: Estado, form: FormData): Promise<Estado> {
  const t = (k: string) => String(form.get(k) ?? "").trim();
  const nome = t("nome").replace(/\s+/g, " ");
  const email = t("email").toLowerCase();
  const telefone = t("telefone").replace(/[^\d+]/g, "");
  const modalidade = t("modalidade") === "pagamento_online" ? "pagamento_online" : "entrega_balcao";

  if (nome.length < 3) return { erro: "Informe seu nome completo." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "Informe um e-mail válido." };
  if (telefone.replace(/\D/g, "").length < 10) return { erro: "Informe um telefone com DDD." };
  if (form.get("aceite") !== "1") return { erro: "Confirme que podemos usar seus dados para esta campanha." };

  const criancaIds = [...new Set(ids)].filter((n) => Number.isInteger(n) && n > 0);
  if (!criancaIds.length) return { erro: "Nenhuma criança escolhida." };
  if (criancaIds.length > MAX_POR_PEDIDO) return { erro: `Escolha até ${MAX_POR_PEDIDO} crianças por vez.` };

  await liberarExpiradas();
  const campanha = await campanhaPorSlug(slug);
  if (!campanha || !campanhaAberta(campanha)) return { erro: "Esta campanha não está recebendo padrinhos." };

  const db = getDb();
  let cpf: string | null = null;
  let forma: "pix" | "cartao" | null = null;
  let parcelas = 1;
  let pontoColetaId: number | null = null;

  if (modalidade === "pagamento_online") {
    if (!campanha.valorSacolinha || !pagamentoOnlineDisponivel()) return { erro: "O pagamento online não está disponível nesta campanha." };
    cpf = t("cpf").replace(/\D/g, "");
    if (!cpfValido(cpf)) return { erro: "CPF inválido. Ele é exigido para gerar a cobrança." };
    forma = t("forma") === "cartao" ? "cartao" : "pix";
    parcelas = forma === "cartao" ? Math.min(campanha.maxParcelas, Math.max(1, Number(t("parcelas")) || 1)) : 1;
  } else {
    if (!campanha.prazoEntrega) return { erro: "A entrega no balcão não está disponível nesta campanha." };
    if (campanha.prazoEntrega < todayIso()) return { erro: "O prazo de entrega no balcão já passou." };
    pontoColetaId = Number(t("ponto")) || null;
    const [ponto] = pontoColetaId ? await db.select().from(pontosColeta).where(eq(pontosColeta.id, pontoColetaId)).limit(1) : [];
    if (!ponto?.ativo) return { erro: "Escolha onde vai entregar a sacolinha." };
  }

  // Padrinho que volta (mesmo CPF, ou mesmo e-mail) reaproveita o cadastro e o cliente no Asaas.
  const [existente] = await db
    .select()
    .from(padrinhos)
    .where(cpf ? eq(padrinhos.cpf, cpf) : eq(padrinhos.email, email))
    .limit(1);
  let padrinhoId: number;
  if (existente) {
    padrinhoId = existente.id;
    await db
      .update(padrinhos)
      .set({ nome, email, telefone, ...(cpf ? { cpf } : {}) })
      .where(eq(padrinhos.id, padrinhoId));
  } else {
    const [novo] = await db.insert(padrinhos).values({ nome, email, telefone, cpf }).returning({ id: padrinhos.id });
    padrinhoId = novo.id;
  }

  const token = novoToken();
  const valor = modalidade === "pagamento_online" ? campanha.valorSacolinha! * criancaIds.length : null;
  const [pedido] = await db
    .insert(pedidos)
    .values({
      token,
      padrinhoId,
      campanhaId: campanha.id,
      modalidade,
      pontoColetaId,
      valor,
      parcelas,
      forma,
      status: modalidade === "pagamento_online" ? "pendente" : "aguardando_entrega",
      reservadoAte: modalidade === "pagamento_online" ? new Date(Date.now() + RESERVA_MINUTOS * 60_000) : null,
      prazoEntrega: modalidade === "entrega_balcao" ? campanha.prazoEntrega : null,
    })
    .returning({ id: pedidos.id });
  await db.insert(pedidoItens).values(criancaIds.map((criancaId) => ({ pedidoId: pedido.id, criancaId, ...recado(form, criancaId) })));

  const r = await reservar({ campanhaId: campanha.id, criancaIds, pedidoId: pedido.id, padrinhoNome: nome, padrinhoContato: `${email} · ${telefone}` });
  if (!r.ok) {
    // Ninguém chegou a ser reservado: o pedido some sem deixar rastro de criança presa.
    await db.batch([db.delete(pedidoItens).where(eq(pedidoItens.pedidoId, pedido.id)), db.delete(pedidos).where(eq(pedidos.id, pedido.id))]);
    const nomes = (
      await db.select({ nome: criancas.nome, apelidoPublico: criancas.apelidoPublico }).from(criancas).where(inArray(criancas.id, r.indisponiveis))
    ).map(nomePublico);
    revalidatePath(`/${slug}`);
    return {
      erro: `${nomes.join(", ") || "Uma das crianças"} ${r.indisponiveis.length > 1 ? "acabaram de ser escolhidas" : "acabou de ser escolhida"} por outra pessoa. Tire da sua lista e escolha outra, se quiser.`,
      indisponiveis: r.indisponiveis,
    };
  }

  // Para onde o doador vai depois de confirmar: no online, direto para a tela de pagamento.
  let destino = `/pedido/${token}`;
  if (modalidade === "pagamento_online") {
    destino = `/pedido/${token}/pagar`;
    if (modoPagamento() === "demo") {
      // Mesmo caminho do Asaas, com a tela de pagamento simulada do próprio site no lugar da fatura.
      await db
        .update(pedidos)
        .set({ asaasPaymentId: `demo_${pedido.id}`, asaasInvoiceUrl: `/pedido/${token}/pagar` })
        .where(eq(pedidos.id, pedido.id));
    } else {
      try {
        const customer = await upsertCustomer(existente?.asaasCustomerId ?? null, {
          name: nome,
          cpfCnpj: cpf!,
          email,
          phone: telefone,
          externalReference: `padrinho:${padrinhoId}`,
        });
        if (customer !== existente?.asaasCustomerId) await db.update(padrinhos).set({ asaasCustomerId: customer }).where(eq(padrinhos.id, padrinhoId));
        const pagamento = await createPayment({
          customer,
          valueCents: valor!,
          dueDate: todayIso(),
          description: `${campanha.nome}: ${criancaIds.length} sacolinha(s) · Paz Kids em Ação`,
          billingType: forma === "cartao" ? "CREDIT_CARD" : "PIX",
          installments: parcelas,
          externalReference: `pedido:${pedido.id}`,
        });
        await db
          .update(pedidos)
          .set({ asaasPaymentId: pagamento.id, asaasInvoiceUrl: pagamento.invoiceUrl ?? null })
          .where(eq(pedidos.id, pedido.id));
        if (pagamento.invoiceUrl) destino = pagamento.invoiceUrl;
      } catch (err) {
        console.error("asaas", err);
        await cancelarPedido(pedido.id, "site");
        revalidatePath(`/${slug}`);
        return { erro: "Não conseguimos gerar a cobrança agora. Tente de novo em alguns minutos ou escolha montar e entregar a sacolinha." };
      }
    }
  }

  await auditar("site", "pedido criado", "pedido", pedido.id, { modalidade, criancas: criancaIds.length });
  // No pagamento online, o agradecimento sai quando o pagamento confirma (confirmarPagamento).
  if (modalidade === "entrega_balcao") enviarDepois(pedido.id, "agradecimento");
  revalidatePath(`/${slug}`);
  revalidatePath("/");
  redirect(destino);
}
