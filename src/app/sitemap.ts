import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";
import { campanhasAtivas } from "@/lib/campanhas";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ativas = await campanhasAtivas();
  return [{ url: SITE.url }, ...ativas.map((c) => ({ url: `${SITE.url}/${c.slug}` }))];
}
