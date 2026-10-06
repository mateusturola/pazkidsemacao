"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Link_ = { href: string; label: string };

/**
 * Cabeçalho do site. "institucional" usa o logo do Paz Kids em Ação; "campanha" usa a marca da
 * campanha (o logo colorido só sobre fundo claro, como pede o manual). Sobre a foto do topo ele
 * começa transparente e fica creme quando a página rola.
 */
export function Topo({
  variante,
  links,
  cta,
  sobreFoto = false,
  fundoClaro = false,
}: {
  variante: "institucional" | "campanha";
  links: Link_[];
  cta?: Link_ | null;
  /** Começa transparente, com texto branco, sobre uma foto escura. */
  sobreFoto?: boolean;
  /** Começa transparente, com texto escuro, sobre um fundo claro (o amarelo do topo). */
  fundoClaro?: boolean;
}) {
  const transparente = sobreFoto || fundoClaro;
  const [rolou, setRolou] = useState(!transparente);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!transparente) return;
    const marcar = () => setRolou(window.scrollY > 40);
    marcar();
    window.addEventListener("scroll", marcar, { passive: true });
    return () => window.removeEventListener("scroll", marcar);
  }, [transparente]);

  const claro = rolou || aberto;
  // Texto escuro quando o fundo é claro: barra já sólida, ou transparente sobre o amarelo.
  const textoEscuro = claro || fundoClaro;
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${claro ? "bg-creme/95 shadow-[0_1px_0_var(--color-linha)] backdrop-blur" : "bg-transparent"}`}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-6 px-4 sm:px-8">
        <Link href={variante === "campanha" ? "#topo" : "/"} className="shrink-0" aria-label="Início">
          {variante === "campanha" ? (
            <Image src="/natal/logo/paz-kids-horizontal-colorida.svg" alt="Paz Kids em Ação · Campanha de Natal" width={180} height={60} priority className="h-12 w-auto" />
          ) : (
            <Image src="/brand/pazkids-em-acao-200.webp" alt="Paz Kids em Ação" width={200} height={238} priority className="h-14 w-auto" />
          )}
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`rounded-lg px-3 py-2 text-[15px] font-bold transition-colors ${textoEscuro ? "text-tinta-2 hover:text-verde" : "text-white/85 hover:text-white"}`}>
              {l.label}
            </Link>
          ))}
          {cta && (
            <Link href={cta.href} className="btn btn-acao ml-3 h-11 px-5 text-base">
              {cta.label}
            </Link>
          )}
        </nav>
        <button
          type="button"
          className={`ml-auto rounded-lg px-3 py-2 font-titulo font-semibold md:hidden ${textoEscuro ? "text-verde" : "text-white"}`}
          aria-expanded={aberto}
          onClick={() => setAberto((a) => !a)}
        >
          {aberto ? "Fechar" : "Menu"}
        </button>
      </div>
      {aberto && (
        <nav className="border-t border-linha bg-creme px-4 pb-5 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setAberto(false)} className="block border-b border-linha py-3.5 font-titulo text-lg font-semibold text-verde">
              {l.label}
            </Link>
          ))}
          {cta && (
            <Link href={cta.href} onClick={() => setAberto(false)} className="btn btn-acao mt-4 w-full">
              {cta.label}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
