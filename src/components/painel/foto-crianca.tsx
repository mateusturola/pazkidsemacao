/** Miniatura da criança no painel. A versão no endereço muda quando a foto ou o avatar mudam. */
export function FotoCrianca({ id, versao, className = "size-10", tipo }: { id: number; versao?: string | null; className?: string; tipo?: "avatar" }) {
  const v = (versao ?? "").split("/").pop() ?? "";
  const q = new URLSearchParams({ ...(tipo ? { tipo } : {}), ...(v ? { v } : {}) }).toString();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/criancas/${id}/imagem${q ? `?${q}` : ""}`} alt="" loading="lazy" className={`${className} shrink-0 rounded-xl bg-creme object-cover`} />
  );
}
