import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

// O binding do D1 só existe dentro da requisição (no Worker, ou no `next dev` via
// initOpenNextCloudflareForDev), então o cliente é criado a cada chamada — é barato.
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

export { schema };
