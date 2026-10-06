import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";

// Avatar ilustrado para criança sem foto (ou sem autorização de imagem). DiceBear roda igual no
// navegador e no Worker: o painel mostra a prévia e o servidor gera de novo a partir da mesma
// semente na hora de salvar, então o que vai para o R2 nunca é um SVG vindo do navegador.
// Estilo "lorelei": licença CC0, sem exigência de crédito.

// Tons claros da paleta do manual, para o traço escuro do desenho continuar legível.
const FUNDOS = ["f4efe3", "fbe3a8", "f3c9bc", "cfe0d5", "f7d77e"];

export function avatarSvg(seed: string) {
  return createAvatar(lorelei, { seed, backgroundColor: FUNDOS, backgroundType: ["solid"] }).toString();
}

export function novaSemente() {
  return Math.random().toString(36).slice(2, 10);
}
