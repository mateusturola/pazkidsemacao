import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/pedido/", "/fotos/", "/api/", "/*/finalizar"] }], sitemap: `${SITE.url}/sitemap.xml` };
}
