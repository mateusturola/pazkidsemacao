import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/content/site";

/** Rodapé em verde escuro: o logo da campanha vai na versão negativa e o da agência na branca. */
export function Rodape({ variante }: { variante: "institucional" | "campanha" }) {
  return (
    <footer className="relative overflow-hidden bg-verde-escuro text-creme/80">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          {variante === "campanha" ? (
            <Image src="/natal/logo/paz-kids-vertical-negativa-colorida-sem-fundo.svg" alt="Paz Kids em Ação · Campanha de Natal" width={150} height={186} className="h-32 w-auto" />
          ) : (
            <Image src="/brand/pazkids-em-acao-200.webp" alt="Paz Kids em Ação" width={200} height={238} className="h-28 w-auto" />
          )}
          <p className="mt-5 max-w-sm">{SITE.descricao}</p>
          <p className="mt-3 font-mao text-2xl text-amarelo">Juntos fazemos a diferença.</p>
        </div>
        <div>
          <p className="chamada text-amarelo">Acompanhe</p>
          <ul className="mt-4 space-y-2.5">
            {SITE.redes.map((r) => (
              <li key={r.nome}>
                <a href={r.url} target="_blank" rel="noopener" className="hover:text-white">
                  {r.nome} <span className="text-creme/50">{r.usuario}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-white">
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="chamada text-amarelo">Doe por Pix</p>
          <p className="mt-4">{SITE.pix.tipo}</p>
          <p className="font-titulo text-xl font-semibold text-white">{SITE.pix.chave}</p>
          <p className="mt-6">
            <Link href="/" className="hover:text-white">
              Paz Kids em Ação
            </Link>{" "}
            · {SITE.igreja}
          </p>
        </div>
      </div>
      <div className="border-t border-creme/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-creme/55 sm:px-8">
          <p>
            © {new Date().getFullYear()} {SITE.nome} · Paz Kids · Paz Church
          </p>
          <a href="https://thekingdomdigital.online" target="_blank" rel="noopener" className="flex items-center gap-3 opacity-80 transition-opacity hover:opacity-100">
            <span>Desenvolvido por</span>
            <Image src="/brand/thekingdomdigital-branco.webp" alt="The Kingdom Digital" width={440} height={160} className="h-8 w-auto" />
          </a>
        </div>
      </div>
    </footer>
  );
}
