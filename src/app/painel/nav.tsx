"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// No subdomínio do painel o endereço do navegador não tem o /painel (o middleware reescreve).
const ITENS = [
  { href: "/", label: "Início", ativo: (p: string) => p === "/" || p === "/painel" },
  { href: "/criancas", label: "Crianças", ativo: (p: string) => p.includes("/criancas") },
  { href: "/campanhas", label: "Campanhas", ativo: (p: string) => p.includes("/campanhas") },
  { href: "/pedidos", label: "Pedidos", ativo: (p: string) => p.includes("/pedidos") },
  { href: "/pontos", label: "Pontos de coleta", ativo: (p: string) => p.includes("/pontos") },
  { href: "/agenda", label: "Agenda", ativo: (p: string) => p.includes("/agenda") },
  { href: "/emails", label: "E-mails", ativo: (p: string) => p.includes("/emails") },
];
const ADMIN = [
  { href: "/usuarios", label: "Usuários", ativo: (p: string) => p.includes("/usuarios") },
  { href: "/auditoria", label: "Auditoria", ativo: (p: string) => p.includes("/auditoria") },
  { href: "/configuracoes", label: "Configurações", ativo: (p: string) => p.includes("/configuracoes") },
];

export function PainelNav({ admin }: { admin: boolean }) {
  const path = usePathname();
  return (
    <nav className="-mx-1 flex min-w-0 gap-0.5 overflow-x-auto text-sm">
      {[...ITENS, ...(admin ? ADMIN : [])].map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`shrink-0 rounded-lg px-3 py-1.5 transition-colors ${i.ativo(path) ? "bg-tinta/[0.07] font-semibold text-tinta" : "text-tinta-2 hover:text-tinta"}`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
