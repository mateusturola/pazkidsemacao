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
