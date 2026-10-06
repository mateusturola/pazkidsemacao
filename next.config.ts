import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // `next dev` e `next build` dividem a pasta .next, e buildar com o dev no ar corrompe o cache.
  // Para testar o build sem derrubar o dev: NEXT_DIST_DIR=.next-build npx next build
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // As imagens já vão otimizadas (webp no tamanho certo) e o Worker não tem o otimizador do Next.
  images: { unoptimized: true },
  experimental: {
    // Foto de criança sobe por server action; o padrão de 1 MB barra foto de celular.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;

// Faz o `next dev` enxergar os bindings do wrangler.jsonc (o D1 e o R2 locais, em .wrangler/).
initOpenNextCloudflareForDev();
