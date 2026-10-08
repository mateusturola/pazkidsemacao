import Image from "next/image";
import Link from "next/link";
import { Contador } from "@/components/site/contador";

type Props = { variante: "a" | "b" | "c"; criancas: number | null; nEstados: number; cta: { href: string; label: string } };

const FOTO = { src: "/img/acao-alegria.webp", alt: "Crianças sentadas na quadra, rindo e erguendo os braços durante uma ação do Paz Kids em Ação em Heliópolis" };

function Botoes({ cta, claro = true }: { cta: Props["cta"]; claro?: boolean }) {
  return (
    <div className="mt-9 flex flex-wrap gap-3">
      <Link href={cta.href} className={`btn h-14 px-7 text-lg ${claro ? "bg-amarelo text-tinta hover:bg-white" : "btn-acao"}`}>
        {cta.label}
      </Link>
      <Link href="#quem-somos" className={`btn h-14 px-7 text-lg ${claro ? "btn-contorno-claro" : "border-2 border-tinta/25 text-tinta hover:border-tinta"}`}>
        Conheça o projeto
      </Link>
    </div>
  );
}

export function Hero({ variante, criancas, nEstados, cta }: Props) {
  const onde = nEstados > 1 ? `em ${nEstados} estados do Brasil` : "em Heliópolis, São Paulo";

  if (variante === "c") {
    // Faixa amarela do projeto à esquerda, a foto inteira à direita, cortada pela borda.
    return (
      <section className="relative isolate overflow-clip bg-amarelo pt-[72px] lg:min-h-[86svh]" style={{ "--cor-pincelada": "#ffffff" } as React.CSSProperties}>
        <div className="relative h-[46svh] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[52%]">
          <Image src={FOTO.src} alt={FOTO.alt} fill priority sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover object-[center_35%]" />
        </div>
        <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-14 sm:px-8 lg:min-h-[calc(86svh-72px)] lg:py-20">
          <div className="max-w-xl lg:w-[46%]">
            <h1 className="text-[clamp(2.6rem,6vw,4.8rem)] leading-[0.95] font-bold text-tinta">
              Alcançando além das <span className="pincelada">quatro paredes</span>
            </h1>
            {criancas && (
              <p className="mt-6 text-xl text-tinta sm:text-2xl">
                <strong className="font-titulo text-3xl font-bold sm:text-4xl">
                  +<Contador valor={criancas} />
                </strong>{" "}
                crianças toda semana, {onde}.
              </p>
            )}
            <Botoes cta={cta} claro={false} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative isolate flex min-h-[88svh] items-end overflow-clip bg-tinta pt-[72px]">
      <Image src={FOTO.src} alt={FOTO.alt} fill priority sizes="100vw" className="-z-10 object-cover object-[65%_30%]" />
      {/* Sombra neutra só embaixo e à esquerda, onde fica o texto: o resto da foto fica com a cor dela. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent sm:bg-gradient-to-r sm:from-black/75 sm:via-black/25" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-8 sm:pb-20">
        {variante === "a" ? (
          <div className="max-w-2xl">
            <h1 className="text-[clamp(2.6rem,6.4vw,5.2rem)] leading-[0.95] font-bold text-white">
              Alcançando além das <span className="pincelada">quatro paredes</span>
            </h1>
            {criancas && (
              <p className="mt-6 text-xl text-white/90 sm:text-2xl">
                <strong className="font-titulo font-bold text-amarelo">
                  +<Contador valor={criancas} />
                </strong>{" "}
                crianças toda semana, {onde}.
              </p>
            )}
            <Botoes cta={cta} />
          </div>
        ) : (
          <div className="max-w-2xl">
            <p className="font-titulo text-lg font-semibold tracking-wide text-white/80 uppercase">Alcançando além das quatro paredes</p>
            {criancas ? (
              <h1 className="mt-3 font-titulo leading-[0.9] font-bold text-white">
                <span className="block text-[clamp(4.5rem,13vw,9.5rem)] text-amarelo">
                  +<Contador valor={criancas} />
                </span>
                <span className="mt-2 block text-[clamp(1.8rem,3.6vw,2.8rem)] leading-tight">crianças toda semana, {onde}</span>
              </h1>
            ) : (
              <h1 className="mt-3 text-[clamp(2.6rem,6.4vw,5.2rem)] leading-[0.95] font-bold text-white">O amor de Cristo onde as crianças estão</h1>
            )}
            <Botoes cta={cta} />
          </div>
        )}
      </div>
    </section>
  );
}
