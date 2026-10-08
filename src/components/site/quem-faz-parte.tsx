import { IconeSeta } from "@/components/site/icones";
import { padrinhosNoMural, parceirosAtivos } from "@/lib/parceiros";

/**
 * "Quem faz parte": as empresas parceiras, com logo e link, e o mural com o nome de quem apadrinhou
 * e pediu para aparecer. Cada parte só aparece com alguém nela.
 */
export async function QuemFazParte() {
  const [empresas, nomes] = await Promise.all([parceirosAtivos().catch(() => []), padrinhosNoMural().catch(() => [])]);
  if (!empresas.length && !nomes.length) return null;
  return (
    <section id="quem-faz-parte" className="scroll-mt-16 bg-amarelo py-24 sm:py-28" style={{ "--cor-pincelada": "#ffffff" } as React.CSSProperties}>
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="max-w-2xl" data-revelar>
          <p className="chamada text-verde">Quem faz parte</p>
          <h2 className="mt-3 text-4xl leading-tight font-bold text-verde sm:text-5xl">
            Quem torna tudo isso <span className="pincelada">possível</span>
          </h2>
        </div>

        {empresas.length > 0 && (
          <div className="mt-12">
            <h3 className="font-titulo text-2xl font-semibold text-verde">Empresas parceiras</h3>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {empresas.map((e, i) => (
                <li key={e.id} className="flex flex-col rounded-[24px] bg-white p-6" data-revelar style={{ "--atraso": `${(i % 3) * 80}ms` } as React.CSSProperties}>
                  <div className="flex h-16 items-center">
                    {e.logoKey ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/parceiros/${e.id}/logo?v=${encodeURIComponent(e.logoKey)}`} alt={e.nome} loading="lazy" className="max-h-16 max-w-[220px] object-contain" />
                    ) : (
                      <span className="font-titulo text-2xl font-semibold text-verde">{e.nome}</span>
                    )}
                  </div>
                  {e.descricao && <p className="mt-4 flex-1 text-tinta-2">{e.descricao}</p>}
                  {e.link && (
                    <a href={e.link} target="_blank" rel="noopener" className="mt-5 inline-flex items-center gap-1.5 self-start font-bold text-verde underline decoration-amarelo decoration-2 underline-offset-4">
                      Conhecer {e.nome} <IconeSeta className="size-4" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {nomes.length > 0 && (
          <div className="mt-14" data-revelar>
            <h3 className="font-titulo text-2xl font-semibold text-verde">Quem já apadrinhou</h3>
            <p className="mt-1 text-verde/80">Obrigado a cada pessoa que escolheu uma criança.</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {nomes.map((n) => (
                <li key={n} className="rounded-full bg-white/80 px-4 py-1.5 font-semibold text-verde">
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
