import { VARIANTES } from "@/content/imagens";

/**
 * Carregador do next/image. O Worker não tem o otimizador do Next, então "otimizar" é escolher a cópia
 * pronta de public/img/<largura>/ mais próxima do que o navegador pede (scripts/imagens.mjs gera as
 * cópias). O resto (SVG, logo, foto que vem do R2) vai como está.
 */
export default function carregarImagem({ src, width }: { src: string; width: number }) {
  const nome = src.startsWith("/img/") ? src.slice(5) : null;
  const largura = nome && VARIANTES[nome]?.find((l) => l >= width);
  return largura ? `/img/${largura}/${nome}` : src;
}
