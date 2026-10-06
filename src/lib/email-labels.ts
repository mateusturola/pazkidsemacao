// Rótulos dos e-mails no painel.

export const TIPO_EMAIL: Record<string, string> = {
  agradecimento: "Agradecimento",
  lembrete: "Lembrete (3 dias)",
  lembrete_final: "Lembrete (véspera)",
  entregue: "Sacolinha recebida",
};
export const STATUS_EMAIL: Record<string, { label: string; cor: string }> = {
  enviado: { label: "Enviado", cor: "text-verde" },
  demo: { label: "Demonstração (não enviado)", cor: "text-laranja" },
  erro: { label: "Erro no envio", cor: "text-vermelho" },
};
