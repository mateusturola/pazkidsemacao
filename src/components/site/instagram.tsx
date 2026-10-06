import { SITE } from "@/content/site";
import { instagramConfigurado, postsInstagram } from "@/lib/instagram";

// Antes de existir o token, a seção mostra fotos das próprias ações do projeto no lugar dos posts,
// para a equipe ver a ideia funcionando. Com o token, entram os posts de verdade e isto some.
const DEMONSTRACAO = ["acao-sorrisos", "acao-oracao", "acao-dupla", "acao-pula-pula", "acao-maos", "acao-colete", "acao-roda", "acao-quadra"];

export async function Instagram() {
  const posts = await postsInstagram().catch(() => []);
  const demo = posts.length === 0 && !(await instagramConfigurado().catch(() => false));
  if (!posts.length && !demo) return null;

  const itens = posts.length
    ? posts.map((p) => ({ chave: p.id, href: p.permalink, img: `/instagram/${p.id}`, alt: p.legenda?.slice(0, 120) ?? "Post do Instagram" }))
    : DEMONSTRACAO.map((f) => ({ chave: f, href: SITE.redes[0].url, img: `/img/${f}.webp`, alt: "Ação do Paz Kids em Ação" }));

  return (
    <section id="instagram" className="bg-papel py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6" data-revelar>
          <div>
            <p className="chamada text-vermelho">No Instagram</p>
            <h2 className="mt-3 text-4xl font-bold text-verde sm:text-5xl">
              Acompanhe cada <span className="pincelada">ação</span>
            </h2>
          </div>
          <a href={SITE.redes[0].url} target="_blank" rel="noopener" className="btn btn-primario">
            Seguir @{SITE.instagram}
          </a>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {itens.map((i, n) => (
            <li key={i.chave} data-revelar style={{ "--atraso": `${(n % 4) * 70}ms` } as React.CSSProperties}>
              <a href={i.href} target="_blank" rel="noopener" className="group relative block aspect-square overflow-hidden rounded-xl bg-creme">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.img} alt={i.alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-verde-escuro/70 via-transparent to-transparent p-3 text-sm font-bold text-creme opacity-0 transition-opacity group-hover:opacity-100">
                  Ver no Instagram
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
