import { defineConfig } from "drizzle-kit";

// Só gera o SQL das migrations; quem aplica é o wrangler (`npm run db:migrate:*`).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});
