import Image from "next/image";
import Link from "next/link";

export function Cabecalho({ campanha }: { campanha?: { slug: string; nome: string } | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-linha bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Paz Kids em Ação, página inicial" className="relative -mb-6 self-start pt-1.5">
          <Image src="/brand/pazkids-em-acao-200.webp" alt="Paz Kids em Ação" width={200} height={238} priority className="h-[68px] w-auto drop-shadow-[0_3px_0_rgba(27,22,51,0.15)]" />
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-[15px] font-semibold">
          <Link href="/#quem-somos" className="hidden rounded-lg px-3 py-2 text-tinta-2 hover:text-tinta sm:block">
            Quem somos
          </Link>
          <Link href="/#doe" className="hidden rounded-lg px-3 py-2 text-tinta-2 hover:text-tinta sm:block">
            Doe
          </Link>
          {campanha && (
            <Link href={`/${campanha.slug}`} className="btn btn-primario btn-sm ml-2">
              {campanha.nome}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
