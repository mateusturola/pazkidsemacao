import { PERGUNTAS, SITE, SOBRE } from "@/content/site";
import type { Campanha } from "@/db/schema";

// Dados estruturados (schema.org). É o que o Google usa para o painel de conhecimento e as IAs
// usam para entender quem é o projeto, onde atua e como ajudar.

export const TERMOS = [
  "projeto social em Heliópolis",
  "projeto social para crianças em São Paulo",
  "ação social em comunidade",
  "trabalho social em comunidades de São Paulo",
  "evangelismo infantil",
  "ministério infantil",
  "igreja na comunidade",
  "igreja nas praças",
  "igreja nas escolas",
  "voluntariado com crianças",
  "doação para crianças carentes",
  "apadrinhamento de crianças no Natal",
  "sacolinha de Natal",
  "Paz Kids",
  "Igreja da Paz Heliópolis",
];

const organizacao = {
  "@type": ["NGO", "Organization"],
  "@id": `${SITE.url}/#organizacao`,
  name: SITE.nome,
  alternateName: ["Paz Kids em Acao", "Paz Kids em Ação Heliópolis"],
  url: SITE.url,
  logo: `${SITE.url}/brand/pazkids-em-acao-480.webp`,
  image: `${SITE.url}/og-home.jpg`,
  description: SITE.descricao,
  slogan: SITE.lema,
  email: SITE.email,
  foundingDate: "2022-07",
  address: { "@type": "PostalAddress", addressLocality: "São Paulo", addressRegion: "SP", addressCountry: "BR", streetAddress: "Heliópolis" },
  areaServed: [
    { "@type": "Place", name: "Heliópolis, São Paulo, SP" },
    { "@type": "AdministrativeArea", name: "Grande São Paulo" },
  ],
  parentOrganization: { "@type": "Church", name: "Igreja da Paz", alternateName: "Paz Church", address: { "@type": "PostalAddress", addressLocality: "São Paulo", addressRegion: "SP", addressCountry: "BR" } },
  knowsAbout: TERMOS,
  sameAs: SITE.redes.map((r) => r.url),
  potentialAction: { "@type": "DonateAction", name: "Doar pelo Pix", description: `Pix ${SITE.pix.tipo} ${SITE.pix.chave}`, recipient: { "@id": `${SITE.url}/#organizacao` } },
};

export function ldInicio() {
  return [
    { "@context": "https://schema.org", ...organizacao, mission: SOBRE.missao },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE.url}/#site`,
      url: SITE.url,
      name: SITE.nome,
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE.url}/#organizacao` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PERGUNTAS.map((q) => ({ "@type": "Question", name: q.p, acceptedAnswer: { "@type": "Answer", text: q.r } })),
    },
  ];
}

export function ldCampanha(c: Campanha, criancasAguardando: number) {
  const url = `${SITE.url}/${c.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: `${c.nome} · Paz Kids em Ação`,
      description: c.descricao ?? undefined,
      url,
      image: `${SITE.url}/natal/og-natal.jpg`,
      startDate: c.dataInicio ?? undefined,
      endDate: c.dataFim ?? c.prazoEntrega ?? undefined,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
      isAccessibleForFree: true,
      location: [
        { "@type": "Place", name: "Paz Kids · Igreja da Paz Heliópolis", address: { "@type": "PostalAddress", addressLocality: "São Paulo", addressRegion: "SP", addressCountry: "BR" } },
        { "@type": "VirtualLocation", url },
      ],
      organizer: { "@id": `${SITE.url}/#organizacao`, "@type": "NGO", name: SITE.nome, url: SITE.url },
      potentialAction: { "@type": "DonateAction", name: "Adotar uma sacolinha", target: url, recipient: { "@type": "NGO", name: SITE.nome } },
      ...(criancasAguardando ? { remainingAttendeeCapacity: criancasAguardando } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.nome, item: SITE.url },
        { "@type": "ListItem", position: 2, name: c.nome, item: url },
      ],
    },
  ];
}
