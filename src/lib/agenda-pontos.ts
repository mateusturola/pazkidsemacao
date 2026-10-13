// Uma cor por dia, tiradas dos balões do logo do Paz Kids em Ação. Fora do componente do mapa
// (que é de cliente) para o painel e o story usarem as mesmas cores.
const COR_DIA: Record<string, string> = {
  Segunda: "#1b1633",
  Terça: "#6b3fa0",
  Quarta: "#e3262f",
  Quinta: "#1f74c9",
  Sexta: "#e8830c",
  Sábado: "#2c9a47",
  Domingo: "#1b1633",
};

export const corDoDia = (dia: string) => COR_DIA[dia] ?? "#1b1633";

const TINTA = "#1b1633";

function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contraste = (a: string, b: string) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** Texto sobre o balão: branco quando dá para ler (4,5:1), senão a tinta. O laranja e o verde são claros demais para branco. */
export const textoSobre = (cor: string) => (contraste(cor, "#ffffff") >= 4.5 ? "#ffffff" : TINTA);

/**
 * A cor do balão escurecida até dar para ler texto pequeno sobre o branco. A borda e o mapa ficam
 * com a cor viva; só a letra fica mais funda.
 */
export function paraTexto(cor: string) {
  let [r, g, b] = [1, 3, 5].map((i) => parseInt(cor.slice(i, i + 2), 16));
  let hex = cor;
  while (contraste(hex, "#ffffff") < 4.5) {
    [r, g, b] = [r, g, b].map((v) => Math.round(v * 0.92));
    hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }
  return hex;
}
