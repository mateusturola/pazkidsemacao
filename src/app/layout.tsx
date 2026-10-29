import type { Metadata } from "next";
import { Caveat_Brush, Fredoka, Nunito } from "next/font/google";
import { SITE } from "@/content/site";
import { TERMOS } from "@/lib/seo";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });
// A letra de mão só aparece em frase de destaque: não entra na frente da foto do topo e das fontes do texto.
const caveatBrush = Caveat_Brush({ subsets: ["latin"], weight: "400", variable: "--font-caveat-brush", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.nome} · Projeto social com crianças pelo Brasil`, template: `%s · ${SITE.nome}` },
  description: SITE.resumo,
  keywords: TERMOS,
  applicationName: SITE.nome,
  category: "Projeto social",
  alternates: { canonical: "/" },
  openGraph: {
    siteName: SITE.nome,
    locale: "pt_BR",
    type: "website",
    title: `${SITE.nome} · ${SITE.lema}`,
    description: SITE.resumo,
    images: [{ url: "/og-home.jpg", width: 1200, height: 630, alt: "Crianças numa ação do Paz Kids em Ação em Heliópolis" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-home.jpg"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // O globals.css rola suave (âncoras como "#criancas"). Desde o Next 16, sem este atributo a troca de
    // página também rolaria devagar até o topo; com ele, a navegação salta direto, como antes.
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${fredoka.variable} ${nunito.variable} ${caveatBrush.variable}`}>
      <body>{children}</body>
    </html>
  );
}
