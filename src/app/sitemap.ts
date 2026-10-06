import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";
import { campanhaAberta } from "@/lib/campanhas";
import { getDb, schema } from "@/lib/db";
import { ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const campanhas = await getDb().select().from(schema.campanhas).where(ne(schema.campanhas.status, "rascunho"));
  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1, lastModified: new Date() },
    ...campanhas.map((c) => ({
      url: `${SITE.url}/${c.slug}`,
      changeFrequency: (campanhaAberta(c) ? "daily" : "yearly") as "daily" | "yearly",
      priority: campanhaAberta(c) ? 0.9 : 0.4,
      lastModified: new Date(),
    })),
    { url: `${SITE.url}/llms.txt`, changeFrequency: "weekly", priority: 0.3 },
  ];
}
