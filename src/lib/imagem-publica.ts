/** Endereço público da imagem da criança. A versão muda junto com a foto ou o avatar. */
export function imagemPublica(id: number, versao: string | null | undefined) {
  const v = (versao ?? "").split("/").pop();
  return `/fotos/${id}${v ? `?v=${encodeURIComponent(v)}` : ""}`;
}
