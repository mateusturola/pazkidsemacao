import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // `next dev` e `next build` dividem a pasta .next, e buildar com o dev no ar corrompe o cache.
  // Para testar o build sem derrubar o dev: NEXT_DIST_DIR=.next-build npx next build
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // O Worker não tem o otimizador do Next: as fotos de public/img têm cópias menores prontas
  // (npm run imagens) e o carregador escolhe a cópia pela largura que o navegador pede.
  images: { loader: "custom", loaderFile: "./src/lib/imagem.ts", deviceSizes: [640, 828, 1080, 1440, 1920] },
  experimental: {
    // Foto de criança sobe por server action; o padrão de 1 MB barra foto de celular.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;

// Faz o `next dev` enxergar os bindings do wrangler.jsonc (o D1 e o R2 locais, em .wrangler/).
initOpenNextCloudflareForDev();
