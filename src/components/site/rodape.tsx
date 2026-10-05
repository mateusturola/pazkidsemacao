import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/content/site";
import { FaixaCores } from "./faixa-cores";

export function Rodape() {
  return (
    <footer className="bg-tinta text-white/80">
      <FaixaCores />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Image src="/brand/pazkids-em-acao-200.webp" alt="Paz Kids em Ação" width={200} height={238} className="h-24 w-auto" />
          <p className="mt-4 max-w-xs text-sm">{SITE.descricao}</p>
          <p className="mt-2 text-sm text-white/60">{SITE.igreja}</p>
        </div>
        <div>
          <p className="font-titulo text-lg font-semibold text-white">Acompanhe</p>
          <ul className="mt-3 space-y-2 text-sm">
            {SITE.redes.map((r) => (
              <li key={r.nome}>
                <a href={r.url} target="_blank" rel="noopener" className="hover:text-white">
                  {r.nome} <span className="text-white/50">{r.usuario}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-titulo text-lg font-semibold text-white">Doe por Pix</p>
          <p className="mt-3 text-sm">
            {SITE.pix.tipo}: <span className="font-semibold text-white">{SITE.pix.chave}</span>
          </p>
          <Link href="/#doe" className="mt-2 inline-block text-sm text-amarelo hover:underline">
            Copiar a chave
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-white/55 sm:px-6">
          <p>
            © {new Date().getFullYear()} {SITE.nome} · Paz Kids · Igreja da Paz
          </p>
          {/* Fundo escuro: o logo da agência vai na versão toda branca. */}
          <a href="https://thekingdomdigital.online" target="_blank" rel="noopener" className="flex items-center gap-2.5 opacity-80 transition-opacity hover:opacity-100">
            <span>Desenvolvido por</span>
            <Image src="/brand/thekingdomdigital-branco.webp" alt="The Kingdom Digital" width={440} height={160} className="h-7 w-auto" />
          </a>
        </div>
      </div>
    </footer>
  );
}
