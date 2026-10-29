import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Desde o Next 16 o eslint-config-next já vem no formato novo (flat config): não precisa do FlatCompat.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Regra nova do Next 16 (React Compiler). Aviso, não erro: parte dos usos é de propósito, como sortear
      // a ordem das crianças e ler o carrinho do localStorage só depois de montar, para não divergir do HTML
      // do servidor. Reescrever esses efeitos é outra tarefa, não a troca de versão.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "cloudflare-env.d.ts",
    ".open-next/**",
    ".wrangler/**",
    // Entrada do Worker: importa o build gerado, que não existe antes do build.
    "worker.ts",
  ]),
]);

export default eslintConfig;
