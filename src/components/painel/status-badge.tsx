const CORES: Record<string, string> = {
  disponivel: "bg-creme text-tinta-2",
  reservada: "bg-vermelho/10 text-vermelho",
  apadrinhada: "bg-amarelo/25 text-verde",
  entregue: "bg-verde text-creme",
  rascunho: "bg-tinta/[0.07] text-tinta-2",
  ativa: "bg-verde/12 text-verde",
  encerrada: "bg-tinta/[0.07] text-tinta-2",
  pendente: "bg-amarelo/25 text-[#8a6100]",
  pago: "bg-amarelo/25 text-verde",
  aguardando_entrega: "bg-amarelo/25 text-[#8a6100]",
  cancelado: "bg-tinta/[0.07] text-tinta-2",
  expirado: "bg-tinta/[0.07] text-tinta-2",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${CORES[status] ?? "bg-tinta/[0.07]"}`}>{label}</span>;
}
