"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Liga a animação de aparecer ao rolar. Sem JavaScript, nada fica escondido. */
export function Revelar() {
  // A cada navegação entram elementos novos: observa de novo.
  const path = usePathname();
  useEffect(() => {
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visivel");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll("[data-revelar]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);
  return null;
}
