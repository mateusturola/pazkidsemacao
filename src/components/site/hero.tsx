import Image from "next/image";
import Link from "next/link";
import { Contador } from "@/components/site/contador";

/**
 * Topo da página inicial: a foto da ação de ponta a ponta, com o título e uma linha só embaixo. Pouca
 * coisa de propósito: título e número no mesmo peso brigavam, e a sombra cobria o rosto das crianças.
 */
export function Hero({ criancas, nEstados, cta }: { criancas: number | null; nEstados: number; cta: { href: string; label: string } }) {
  const onde = nEstados > 1 ? `em ${nEstados} estados do Brasil` : "em Heliópolis, São Paulo";
  return (
    <section className="relative isolate flex min-h-[88svh] items-end overflow-clip bg-tinta pt-[72px]">
      <Image
        src="/img/acao-alegria.webp"
        alt="Crianças sentadas na quadra, rindo e erguendo os braços durante uma ação do Paz Kids em Ação em Heliópolis"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-[65%_30%]"
      />
      {/* Sombra neutra só embaixo e à esquerda, onde fica o texto: o resto da foto fica com a cor dela. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent sm:bg-gradient-to-r sm:from-black/75 sm:via-black/25" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-8 sm:pb-20">
        <div className="max-w-2xl">
          <h1 className="text-[clamp(2.6rem,6.4vw,5.2rem)] leading-[0.95] font-bold text-white">
            Alcançando além das <span className="pincelada">quatro paredes</span>
          </h1>
          {criancas && (
            // O número vem do painel e sobe de zero quando a página abre.
            <p className="mt-6 text-xl text-white/90 sm:text-2xl">
              <strong className="font-titulo font-bold text-amarelo">
                +<Contador valor={criancas} />
              </strong>{" "}
              crianças toda semana, {onde}.
            </p>
          )}
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={cta.href} className="btn h-14 bg-amarelo px-7 text-lg text-tinta hover:bg-white">
              {cta.label}
            </Link>
            <Link href="#quem-somos" className="btn btn-contorno-claro h-14 px-7 text-lg">
              Conheça o projeto
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
