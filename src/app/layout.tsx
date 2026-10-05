import type { Metadata } from "next";
import { Caveat_Brush, Fredoka, Nunito } from "next/font/google";
import { SITE } from "@/content/site";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });
const caveatBrush = Caveat_Brush({ subsets: ["latin"], weight: "400", variable: "--font-caveat-brush", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.nome} — ${SITE.lema}`, template: `%s · ${SITE.nome}` },
  description: SITE.descricao,
  openGraph: { siteName: SITE.nome, locale: "pt_BR", type: "website", images: ["/brand/pazkids-em-acao-480.webp"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable} ${caveatBrush.variable}`}>
      <body>{children}</body>
    </html>
  );
}
