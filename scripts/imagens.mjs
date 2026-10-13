// Gera as cópias menores das fotos de public/img (640, 828 e 1080 px de largura) em public/img/<largura>/
// e a lista em src/content/imagens.ts. O Worker não tem o otimizador de imagens do Next: o carregador
// (src/lib/imagem.ts) escolhe a cópia pela largura que o navegador pede, e o celular não baixa a foto
// de 1.800 px. Rode depois de pôr uma foto nova em public/img: npm run imagens
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PASTA = "public/img";
const LARGURAS = [640, 828, 1080];

const fotos = (await readdir(PASTA)).filter((f) => f.endsWith(".webp")).sort();
const lista = {};

for (const f of fotos) {
  const { width } = await sharp(path.join(PASTA, f)).metadata();
  // Só as larguras menores que a original: pedir mais que isso já cai na própria foto.
  const menores = LARGURAS.filter((l) => l < width);
  for (const l of menores) {
    await mkdir(path.join(PASTA, String(l)), { recursive: true });
    await sharp(path.join(PASTA, f)).resize({ width: l }).webp({ quality: 72 }).toFile(path.join(PASTA, String(l), f));
  }
  if (menores.length) lista[f] = menores;
}

await writeFile(
  "src/content/imagens.ts",
  `// Gerado por scripts/imagens.mjs (npm run imagens). Não edite à mão.\nexport const VARIANTES: Record<string, number[]> = ${JSON.stringify(lista, null, 2)};\n`,
);
console.log(`${Object.keys(lista).length} foto(s) com cópias menores.`);
