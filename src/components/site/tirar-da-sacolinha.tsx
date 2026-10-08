"use client";

import { useRouter } from "next/navigation";
import { chaveCarrinho } from "./grade-criancas";

/**
 * "Tirar" na tela de finalizar. A lista vem do endereço (?c=), então tirar é ir para o mesmo
 * endereço sem a criança, e o carrinho guardado no navegador acompanha, para a volta à lista vir certa.
 */
export function TirarDaSacolinha({ slug, id, ids, nome }: { slug: string; id: number; ids: number[]; nome: string }) {
  const router = useRouter();
  function tirar() {
    const resto = ids.filter((x) => x !== id);
    try {
      localStorage.setItem(chaveCarrinho(slug), JSON.stringify(resto));
    } catch {}
    router.replace(resto.length ? `/${slug}/finalizar?c=${resto.join(",")}` : `/${slug}#criancas`, { scroll: false });
  }
  return (
    <button type="button" onClick={tirar} aria-label={`Tirar ${nome} da sacolinha`} className="ml-auto shrink-0 rounded-lg border border-linha px-3 py-1.5 text-sm font-bold text-tinta-2 hover:border-vermelho/50 hover:text-vermelho">
      Tirar
    </button>
  );
}
