"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Ícones de traço, no mesmo desenho dos do site. Um por item: ajuda a achar sem ler.
const d = {
  inicio: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  campanhas: "M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6L12 16.3 6.6 19.3l1.3-6L3.3 9.2l6.1-.6z",
  criancas: "M12 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 22v-6a7 7 0 0 1 14 0v6M9 22v-4M15 22v-4",
  pedidos: "M6 7h12l-1 13H7zM9 7V5a3 3 0 0 1 6 0v2",
  pontos: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  emails: "M3 6h18v12H3zM3 7l9 6 9-6",
  convites: "M4 12l16-8-6 16-3-6zM11 14l9-10",
  agenda: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  equipe: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6.5 6.5 0 0 1 3.5 6",
  parceiros: "M3 12l4-4 5 3 5-3 4 4-9 8zM12 11v9",
  usuarios: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  configuracoes: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  auditoria: "M9 4h6M8 4H6v17h12V4h-2M9 11h6M9 15h4",
};

function Icone({ nome }: { nome: keyof typeof d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0" aria-hidden>
      <path d={d[nome]} />
    </svg>
  );
}

type Item = { href: string; label: string; icone: keyof typeof d };
type Grupo = { titulo?: string; admin?: boolean; itens: Item[] };

// Agrupado pelo que a pessoa vai fazer, não pela ordem em que as telas foram criadas.
// No subdomínio do painel o endereço do navegador não tem o /painel (o middleware reescreve).
const GRUPOS: Grupo[] = [
  { itens: [{ href: "/", label: "Início", icone: "inicio" }] },
  {
    titulo: "Campanha",
    itens: [
      { href: "/campanhas", label: "Campanhas", icone: "campanhas" },
      { href: "/criancas", label: "Crianças", icone: "criancas" },
      { href: "/pedidos", label: "Pedidos", icone: "pedidos" },
      { href: "/pontos", label: "Pontos de entrega", icone: "pontos" },
    ],
  },
  {
    titulo: "Comunicação",
    itens: [
      { href: "/emails", label: "E-mails", icone: "emails" },
      { href: "/convites", label: "Convites", icone: "convites" },
    ],
  },
  {
    titulo: "Site",
    itens: [
      { href: "/agenda", label: "Agenda", icone: "agenda" },
      { href: "/equipe", label: "Equipe", icone: "equipe" },
      { href: "/parceiros", label: "Parceiros", icone: "parceiros" },
    ],
  },
  {
    titulo: "Administração",
    admin: true,
    itens: [
      { href: "/usuarios", label: "Usuários", icone: "usuarios" },
      { href: "/configuracoes", label: "Configurações", icone: "configuracoes" },
      { href: "/auditoria", label: "Auditoria", icone: "auditoria" },
    ],
  },
];

// Telas que só administrador abre: o voluntário não vê o item, em vez de clicar e dar erro.
const SO_ADMIN = new Set(["/convites", "/equipe", "/parceiros"]);

const ativo = (path: string, href: string) => (href === "/" ? path === "/" || path === "/painel" : path.includes(href));

function Lista({ admin, path, aoNavegar }: { admin: boolean; path: string; aoNavegar?: () => void }) {
  return (
    <div className="space-y-5">
      {GRUPOS.filter((g) => admin || !g.admin).map((g, i) => {
        const itens = g.itens.filter((it) => admin || !SO_ADMIN.has(it.href));
        if (!itens.length) return null;
        return (
          <div key={g.titulo ?? i}>
            {g.titulo && <p className="mb-1.5 px-3 text-[11px] font-bold tracking-wider text-tinta-2/70 uppercase">{g.titulo}</p>}
            <ul className="space-y-0.5">
              {itens.map((it) => {
                const a = ativo(path, it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      onClick={aoNavegar}
                      aria-current={a ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors ${
                        a ? "bg-verde font-semibold text-white" : "text-tinta-2 hover:bg-tinta/[0.05] hover:text-tinta"
                      }`}
                    >
                      <Icone nome={it.icone} />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Rodape({ nome, admin }: { nome: string; admin: boolean }) {
  return (
    <div className="border-t border-linha px-3 pt-4 text-sm">
      <p className="truncate font-semibold text-tinta">{nome}</p>
      <p className="text-tinta-2">{admin ? "Administrador" : "Voluntário"}</p>
      <div className="mt-3 flex gap-4">
        <a href="https://pazkidsemacao.com" target="_blank" rel="noopener" className="text-tinta-2 hover:text-tinta">
          Ver o site
        </a>
        {/* Encerra a sessão do Cloudflare Access, que é quem guarda o login. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/cdn-cgi/access/logout" className="text-tinta-2 hover:text-vermelho">
          Sair
        </a>
      </div>
    </div>
  );
}

/** Menu lateral fixo no computador; no celular, uma barra com "Menu" que abre o mesmo menu por cima. */
export function PainelNav({ admin, nome }: { admin: boolean; nome: string }) {
  const path = usePathname();
  const [aberto, setAberto] = useState(false);

  // Fecha ao trocar de página (inclusive pelo voltar do navegador).
  useEffect(() => setAberto(false), [path]);
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  const marca = (
    <Link href="/" className="flex items-center gap-2.5">
      <Image src="/brand/pazkids-em-acao-horizontal-400.webp" alt="Paz Kids em Ação" width={400} height={163} priority className="h-9 w-auto" />
      <span className="font-titulo text-sm font-semibold text-tinta-2">Painel</span>
    </Link>
  );

  return (
    <>
      {/* A coluna branca vai até o fim da página; o menu dentro dela fica parado enquanto a página rola. */}
      <div className="hidden border-r border-linha bg-white lg:block print:hidden">
        <aside className="sticky top-0 flex h-dvh flex-col gap-6 overflow-y-auto px-3 py-5">
          <div className="px-2">{marca}</div>
          <nav className="flex-1" aria-label="Menu do painel">
            <Lista admin={admin} path={path} />
          </nav>
          <Rodape nome={nome} admin={admin} />
        </aside>
      </div>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-linha bg-white/95 px-4 backdrop-blur lg:hidden print:hidden">
        {marca}
        <button type="button" onClick={() => setAberto(true)} className="btn btn-claro btn-sm" aria-expanded={aberto} aria-controls="menu-painel">
          Menu
        </button>
      </header>

      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel">
          <button type="button" aria-label="Fechar o menu" onClick={() => setAberto(false)} className="absolute inset-0 bg-tinta/40" />
          <div id="menu-painel" className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col gap-6 overflow-y-auto bg-white px-3 py-5 shadow-xl">
            <div className="flex items-center justify-between px-2">
              {marca}
              <button type="button" onClick={() => setAberto(false)} className="text-sm text-tinta-2">
                Fechar
              </button>
            </div>
            <nav className="flex-1">
              <Lista admin={admin} path={path} aoNavegar={() => setAberto(false)} />
            </nav>
            <Rodape nome={nome} admin={admin} />
          </div>
        </div>
      )}
    </>
  );
}
