import Image from "next/image";
import { SITE } from "@/content/site";
import { equipeAtiva } from "@/lib/equipe";

// As cores dos balões do logo, uma por pessoa. Amarelo não entra: é a cor da camiseta do projeto.
const FUNDOS = ["#6b3fa0", "#1f74c9", "#e3262f", "#2c9a47", "#e8830c"];

function IconeInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** "Quem cuida do projeto": a liderança que a equipe cadastra no painel. Sem ninguém ativo, a seção sai. */
export async function Equipe() {
  const pessoas = await equipeAtiva().catch(() => []);
  if (!pessoas.length) return null;
  return (
    <section id="equipe" className="scroll-mt-16 bg-tinta py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="max-w-2xl" data-revelar>
          <p className="chamada text-amarelo">Liderança</p>
          <h2 className="mt-3 text-4xl leading-tight font-bold text-white sm:text-5xl">
            Quem <span className="pincelada">cuida</span> do projeto
          </h2>
        </div>
        <ul className={`mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 ${pessoas.length >= 4 ? "lg:grid-cols-4" : pessoas.length === 3 ? "lg:grid-cols-3" : ""}`}>
          {pessoas.map((p, i) => {
            const ig = p.instagram
              ? { href: `https://www.instagram.com/${p.instagram}/`, label: `Instagram de ${p.nome} (@${p.instagram})` }
              : { href: SITE.redes[0].url, label: `Instagram do ${SITE.nome}` };
            return (
              <li key={p.id} className="flex overflow-clip rounded-[24px] bg-white sm:flex-col sm:rounded-[28px]" data-revelar style={{ "--atraso": `${(i % 4) * 80}ms` } as React.CSSProperties}>
                {/* No celular o cartão fica deitado (foto ao lado do texto): quatro fotos altas em pé dariam páginas de rolagem. */}
                <div className="relative w-32 shrink-0 overflow-clip sm:aspect-[4/5] sm:w-auto" style={{ background: FUNDOS[i % FUNDOS.length] }}>
                  {p.fotoKey && (
                    // A foto recortada fica de pé no fundo colorido; uma foto comum cobre o quadro inteiro.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/equipe/${p.id}/foto?v=${encodeURIComponent(p.fotoKey)}`}
                      alt={`Foto de ${p.nome}`}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover object-top"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                  {p.funcao && <p className="text-sm font-bold text-vermelho">{p.funcao}</p>}
                  <h3 className="mt-1 font-titulo text-xl leading-tight font-semibold text-verde sm:text-2xl">{p.nome}</h3>
                  {p.texto && <p className="mt-2 flex-1 text-[15px] text-tinta-2 sm:mt-3 sm:text-base">{p.texto}</p>}
                  <a href={ig.href} target="_blank" rel="noopener" aria-label={ig.label} title={ig.label} className="mt-4 grid size-10 place-items-center sm:mt-5 sm:size-11 rounded-full border border-linha text-verde transition-colors hover:border-verde hover:bg-verde hover:text-white">
                    <IconeInstagram className="size-5" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>

        {/* A família dos pastores, que serve inteira no projeto. Foto enviada pela própria família. */}
        <figure className="mt-14 sm:mt-20" data-revelar>
          <Image
            src="/img/familia-vasconcelos.webp"
            alt="A família Vasconcelos de camiseta amarela do Paz Kids em Ação: os pastores Moisés e Mary com os filhos, familiares e as crianças da família"
            width={1179}
            height={710}
            className="w-full rounded-[28px] object-cover"
          />
          <figcaption className="mt-5 max-w-3xl">
            <p className="font-mao text-3xl text-amarelo">A família inteira serve junto.</p>
            <p className="mt-1 text-lg text-white/75">Os pastores Moisés e Mary, os filhos e familiares: a família Vasconcelos no Paz Kids em Ação.</p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
