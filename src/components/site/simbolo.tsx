// Largura ÷ altura de cada desenho (o viewBox do SVG), para o fundo ocupar o tamanho certo.
const PROPORCAO = {
  "forma-amarela": 213.5 / 216,
  "forma-amarela-2": 216 / 214,
  "forma-vermelha": 216 / 179,
  estrela: 216 / 197.7,
  brilho: 1,
  coracao: 216 / 195.2,
  confete: 213 / 194.2,
} as const;

/**
 * Forma, estrela ou brilho da marca, só enfeite. Vai como fundo e não como <img alt="">: o buscador
 * conta imagem sem descrição como falha, e o leitor de tela não tem o que dizer de uma forma. Fundo
 * também não entra na fila de pré-carregamento, que fica para a foto do topo.
 */
export function Simbolo({ nome, className = "" }: { nome: keyof typeof PROPORCAO; className?: string }) {
  return (
    <span
      aria-hidden
      className={`block bg-contain bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: `url(/natal/simbolos/${nome}.svg)`, aspectRatio: PROPORCAO[nome] }}
    />
  );
}
