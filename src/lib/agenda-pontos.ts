import type { PontoAgenda } from "@/lib/agenda";

// Uma cor por dia, tiradas dos balões do logo do Paz Kids em Ação. Fora do componente do mapa
// (que é de cliente) para o resumo da agenda na página inicial usar as mesmas cores e números.
const COR_DIA: Record<string, string> = {
  Segunda: "#1b1633",
  Terça: "#6b3fa0",
  Quarta: "#e3262f",
  Quinta: "#1f74c9",
  Sexta: "#e8830c",
  Sábado: "#2c9a47",
  Domingo: "#1b1633",
};

export const corDoDia = (dia: string) => COR_DIA[dia] ?? "#1b1633";

export type Lugar = { n: number; lat: number; lng: number; pontos: PontoAgenda[] };

/** Encontros no mesmo endereço viram um pino só (Predinhos Redondos 1 e 2, por exemplo), numerados na ordem da agenda. */
export function lugaresDaAgenda(agenda: PontoAgenda[]): Lugar[] {
  const porChave = new Map<string, Lugar>();
  for (const p of agenda) {
    if (p.lat == null || p.lng == null) continue;
    const k = `${p.lat},${p.lng}`;
    const l = porChave.get(k) ?? { n: porChave.size + 1, lat: p.lat, lng: p.lng, pontos: [] };
    l.pontos.push(p);
    porChave.set(k, l);
  }
  return [...porChave.values()];
}
