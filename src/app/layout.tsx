import type { Metadata } from "next";
import { Caveat_Brush, Fredoka, Nunito } from "next/font/google";
import { SITE } from "@/content/site";
import { TERMOS } from "@/lib/seo";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });
const caveatBrush = Caveat_Brush({ subsets: ["latin"], weight: "400", variable: "--font-caveat-brush", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.nome} · Projeto social com crianças em Heliópolis, São Paulo`, template: `%s · ${SITE.nome}` },
  description: SITE.descricao,
  keywords: TERMOS,
  applicationName: SITE.nome,
  category: "Projeto social",
  alternates: { canonical: "/" },
  openGraph: {
    siteName: SITE.nome,
    locale: "pt_BR",
    type: "website",
    title: `${SITE.nome} · ${SITE.lema}`,
    description: SITE.descricao,
    images: [{ url: "/og-home.jpg", width: 1200, height: 630, alt: "Crianças numa ação do Paz Kids em Ação em Heliópolis" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-home.jpg"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable} ${caveatBrush.variable}`}>
      <body>{children}</body>
    </html>
  );
}
