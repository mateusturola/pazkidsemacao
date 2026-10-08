import type { Parceiro } from "@/db/schema";
import { padrinhosNoMural, parceirosAtivos } from "@/lib/parceiros";

// Com menos empresas que isso, a faixa giraria repetindo o mesmo logo: os logos ficam parados, lado a lado.
const MIN_FAIXA = 4;

/** O cartão branco com o logo, que leva ao site da empresa. A cópia da faixa fica fora do teclado e do leitor de tela. */
function Logo({ e, oculto = false }: { e: Parceiro; oculto?: boolean }) {
  const conteudo = e.logoKey ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/parceiros/${e.id}/logo?v=${encodeURIComponent(e.logoKey)}`} alt={oculto ? "" : e.nome} className="max-h-14 max-w-[170px] object-contain" />
  ) : (
    <span className="font-titulo text-xl font-semibold text-verde">{e.nome}</span>
  );
  const classe = "grid h-24 w-56 place-items-center rounded-[20px] bg-white px-6 transition-transform hover:-translate-y-0.5";
  return e.link ? (
    <a href={e.link} target="_blank" rel="noopener" title={e.nome} tabIndex={oculto ? -1 : undefined} className={classe}>
      {conteudo}
    </a>
  ) : (
    <div title={e.nome} className={classe}>
      {conteudo}
    </div>
  );
}

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
            {empresas.length >= MIN_FAIXA ? (
              // A partir de algumas empresas, a faixa roda sozinha; com poucas, repetiria o mesmo logo.
              <div className="-mx-4 mt-5 overflow-hidden motion-reduce:overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] sm:-mx-8">
                <ul className="faixa-logos flex w-max gap-4 px-4 sm:px-8" style={{ "--duracao": `${empresas.length * 6}s` } as React.CSSProperties}>
                  {[...empresas, ...empresas].map((e, i) => (
                    <li key={`${e.id}-${i}`} aria-hidden={i >= empresas.length || undefined}>
                      <Logo e={e} oculto={i >= empresas.length} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="mt-5 flex flex-wrap gap-4">
                {empresas.map((e) => (
                  <li key={e.id} data-revelar>
                    <Logo e={e} />
                  </li>
                ))}
              </ul>
            )}
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
