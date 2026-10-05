import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";

// Avatar ilustrado para criança sem foto (ou sem autorização de imagem). DiceBear roda igual no
// navegador e no Worker: o painel mostra a prévia e o servidor gera de novo a partir da mesma
// semente na hora de salvar, então o que vai para o R2 nunca é um SVG vindo do navegador.
// Estilo "lorelei": licença CC0, sem exigência de crédito.

// Tons claros das cores do logo, para o traço preto do desenho continuar legível.
const FUNDOS = ["ffe08a", "bfe9ff", "f8c6e6", "c9f0cc", "e3cdf0", "ffd1b3"];

export function avatarSvg(seed: string) {
  return createAvatar(lorelei, { seed, backgroundColor: FUNDOS, backgroundType: ["solid"] }).toString();
}

export function novaSemente() {
  return Math.random().toString(36).slice(2, 10);
}
