// Textos do Paz Kids em Ação. A base é a página atual do projeto (pazkids.com.br/paz-kids-em-acao)
// e o briefing da equipe; nada de número, depoimento ou parceiro que não tenha vindo deles.

export const SITE = {
  nome: "Paz Kids em Ação",
  lema: "Alcançando além das quatro paredes",
  url: "https://pazkidsemacao.com",
  descricao:
    "Projeto social e missionário do Paz Kids, da Paz Church, que leva o amor de Cristo, educação, apoio emocional e recursos básicos para crianças de Heliópolis, em São Paulo, e de comunidades em outros estados do Brasil.",
  // O projeto está em Heliópolis e em outros estados, mas a igreja é a Paz Church São Paulo (não há Paz Church em Heliópolis).
  igreja: "Paz Church São Paulo",
  // O e-mail heliopolis@paz.church é só a chave Pix; contato e voluntariado são por este WhatsApp.
  whatsapp: {
    numero: "(11) 95348-9329",
    link: "https://wa.me/5511953489329",
    voluntario: "https://wa.me/5511953489329?text=" + encodeURIComponent("Olá! Quero ser voluntário no Paz Kids em Ação."),
    internacional: "+55-11-95348-9329",
  },
  // Chave Pix do projeto em Heliópolis (confirmada pela equipe); não é a do CNPJ da igreja.
  // O favorecido é o nome que o aplicativo do banco mostra ao pagar: vai junto da chave para o
  // doador não estranhar. É o único lugar onde o nome jurídico da igreja aparece.
  pix: { tipo: "e-mail", chave: "heliopolis@paz.church", copiar: "heliopolis@paz.church", favorecido: "Igreja da Paz na Cidade de São Paulo" },
  instagram: "pazkidsemacao",
  redes: [
    { nome: "Instagram", url: "https://www.instagram.com/pazkidsemacao/", usuario: "@pazkidsemacao" },
    { nome: "Instagram do Paz Kids", url: "https://instagram.com/pazkidsoficial", usuario: "@pazkidsoficial" },
    { nome: "Facebook", url: "https://facebook.com/PazkidsNacionalBrasil", usuario: "PazkidsNacionalBrasil" },
    { nome: "YouTube", url: "https://youtube.com/@PazKidsOficialBrasil", usuario: "@PazKidsOficialBrasil" },
  ],
};

export const SOBRE = {
  oQueE: "O Paz Kids em Ação é o coração missionário do Paz Kids, levando o amor de Cristo além das quatro paredes da igreja.",
  missao:
    "Expandir o Reino, levando educação, apoio emocional e recursos básicos para crianças carentes da comunidade, promovendo a transformação positiva na vida das crianças e suas famílias.",
  visao: "Compartilhar amor, esperança e conhecimento, ajudando a salvar uma criança hoje e transformar comunidades inteiras no futuro.",
  valores: [
    "Expansão do Reino de Deus",
    "Amor como ferramenta de transformação",
    "Educação, conhecimento e dedicação para construir um futuro digno",
  ],
};

/**
 * A história, numa linha do tempo só: o legado do Pastor Lucas Huber, que dá a raiz do projeto, e o
 * Paz Kids em Ação, que é um dos frutos dele. Só fatos confirmados pela equipe e pelas fontes da
 * PAZ International: nada de data, número ou cena que não esteja nelas.
 */
export const LEGADO = {
  titulo: "Tudo começou às margens dos rios",
  // O resumo da página inicial; a história inteira, marco por marco, fica em /historia.
  resumo:
    "Em dezembro de 1976, o missionário Lucas Huber chegou a Santarém, no Pará, com a esposa, Christine. Ali nasceu a Paz Church, e de lá o Pastor Lucas levou o Evangelho de barco e de avião às comunidades ribeirinhas. Em 2026 ela completa 50 anos, e o mesmo amor pelas crianças está nas ruas e praças de comunidades de vários estados do Brasil.",
  // Os quatro primeiros são da família Huber, dos arquivos da Paz Church (a página inicial mostra só eles).
  marcos: [
    {
      quando: "O começo",
      titulo: "O chamado da família Huber",
      texto:
        "A história começa nos Estados Unidos, quando Melvin e Catherine Huber receberam o chamado de Deus para servir no Brasil. Foram mais de 25 anos plantando igrejas por aqui, e foi nessa família que cresceu Lucas Huber.",
      foto: { src: "/img/legado/melvin-catherine.webp", w: 840, h: 442, alt: "Melvin e Catherine Huber sentados, com os filhos adultos em pé atrás deles", legenda: "Melvin e Catherine Huber com os filhos." },
    },
    {
      quando: "Dezembro de 1976",
      titulo: "Nasce a Paz Church",
      texto: "O missionário Lucas Huber chegou a Santarém, no Pará, com a esposa, Christine, e as duas filhas pequenas. Ali nasceu a Paz Church.",
      foto: {
        src: "/img/legado/familia-rio.webp",
        w: 806,
        h: 530,
        alt: "Lucas, Christine e os três filhos numa moto à beira do rio, com um barco da missão ao fundo",
        legenda: "Lucas, Christine e os filhos à beira do rio, com um barco da missão ao fundo.",
      },
    },
    {
      quando: "Pelos rios",
      titulo: "De barco e de avião",
      texto:
        "O sonho dele era levar o Evangelho a cada vila da Amazônia. Primeiro de barco, pelos rios, até as comunidades ribeirinhas. Depois, num pequeno avião que aprendeu a pilotar para chegar mais longe.",
      foto: {
        src: "/img/legado/lucas-aviao-rio.webp",
        w: 1200,
        h: 924,
        alt: "O Pastor Lucas Huber sorrindo no pequeno avião branco e vermelho, pousado no rio, com a mata ao fundo",
        legenda: "O Pastor Lucas no avião, pousado no rio.",
      },
    },
    {
      quando: "Agosto de 1994",
      titulo: "O chamado continuou",
      texto: "Voltando de uma viagem missionária, o Pastor Lucas partiu para a eternidade num acidente com o avião. Mas o chamado continuou.",
      foto: {
        src: "/img/legado/familia-huber.webp",
        w: 1080,
        h: 783,
        alt: "O Pastor Lucas Huber e a Pastora Christine com os quatro filhos, numa foto antiga de família",
        legenda: "O Pastor Lucas e a Pastora Christine com os filhos.",
      },
    },
    {
      quando: "Julho de 2022",
      titulo: "Nasce o Paz Kids em Ação",
      texto: "O Paz Kids em Ação nasceu como um projeto de evangelismo do Paz Kids, o ministério infantil da Paz Church, inspirado pelo treinamento da Metro World Kids.",
      foto: { src: "/img/acao-atencao.webp", w: 1600, h: 1066, alt: "Crianças sentadas no chão prestando atenção numa ação do Paz Kids em Ação", legenda: "Uma ação do Paz Kids em Ação em Heliópolis." },
    },
    {
      quando: "Depois",
      titulo: "Cresceu para a comunidade",
      texto: "Passou a atender crianças em Heliópolis e em outras áreas da Grande São Paulo, nas quadras, praças, escolas e ruas.",
      foto: { src: "/img/acampa-cuidado.webp", w: 1200, h: 1200, alt: "Voluntária abraçando crianças pequenas no AcampaKids", legenda: "Voluntária com as crianças no AcampaKids, em outubro de 2025." },
    },
    {
      quando: "Hoje",
      titulo: "Um dos frutos dessa história",
      texto:
        "Em 2026, a Paz Church completa 50 anos. O Paz Kids em Ação segue em parceria com a Metro World Kids, levando o mesmo amor pelas crianças para as ruas e praças de comunidades de vários estados do Brasil.",
      foto: { src: "/img/acampa-equipe.webp", w: 1400, h: 933, alt: "Quatro voluntários do Paz Kids em Ação abraçados na quadra do AcampaKids", legenda: "Voluntários do Paz Kids em Ação no AcampaKids, em outubro de 2025." },
    },
  ],
  fecho: ["Hoje, cada voluntário carrega um pedacinho desse legado.", "Em cada comunidade.", "Em cada abraço.", "Em cada presente entregue."],
};

/** Perguntas frequentes: aparecem na página e vão para o Google e as IAs como FAQPage. */
export const PERGUNTAS = [
  {
    p: "O que é o Paz Kids em Ação?",
    r: "É o braço missionário e social do Paz Kids, o ministério infantil da Paz Church. O projeto leva o amor de Cristo, educação, apoio emocional e recursos básicos para crianças de comunidades, fora das quatro paredes da igreja.",
  },
  {
    p: "Como o projeto começou?",
    r: "O Paz Kids em Ação nasceu da Paz Church, fundada em 1976 em Santarém (PA) pelo missionário Lucas Huber, que levava o Evangelho às comunidades ribeirinhas. O projeto começou em julho de 2022, como evangelismo inspirado pelo treinamento da Metro World Kids. Depois cresceu para atender crianças em Heliópolis e em outras áreas da Grande São Paulo, e hoje segue em parceria com a Metro World Kids.",
  },
  {
    p: "Como posso ajudar o Paz Kids em Ação?",
    r: `Você pode apadrinhar uma criança nas campanhas, como a Sacolinha de Natal, doar qualquer valor pelo Pix (chave ${SITE.pix.chave}) ou servir como voluntário. Para ser voluntário, chame a gente no WhatsApp ${SITE.whatsapp.numero}.`,
  },
  {
    p: "Como funciona a Sacolinha de Natal?",
    r: "Você escolhe uma ou mais crianças no site e monta uma sacolinha com camiseta, calça, calçado e um presente, para entregar num ponto de coleta do Paz Kids até a data limite. Se não tiver tempo, dá para doar online, e a gente monta pra você.",
  },
  {
    p: "O Paz Kids em Ação é ligado a alguma igreja?",
    r: "Sim. É uma iniciativa do Paz Kids, o ministério infantil da Paz Church São Paulo. As ações acontecem em Heliópolis, em São Paulo, e em comunidades de outros estados do Brasil.",
  },
];

/**
 * As perguntas com a de "onde atua" montada a partir do alcance do painel (estados e crianças por
 * semana): assim o texto não fica para trás quando um estado entra ou sai.
 */
export function perguntas(alcance: { estados: string; quantos: number; criancasPorSemana: number | null }) {
  const onde = {
    p: "Onde o Paz Kids em Ação atua?",
    r:
      alcance.quantos > 1
        ? [
            `Em ${alcance.quantos} estados do Brasil: ${alcance.estados}.`,
            alcance.criancasPorSemana ? `Toda semana são ${alcance.criancasPorSemana.toLocaleString("pt-BR")} crianças alcançadas.` : "",
            "Em São Paulo, em Heliópolis e em outras comunidades da Grande São Paulo. As ações acontecem onde as crianças estão: quadras, praças, escolas e ruas da comunidade.",
          ]
            .filter(Boolean)
            .join(" ")
        : "Em Heliópolis, em São Paulo, e em outras comunidades da Grande São Paulo. As ações acontecem onde as crianças estão: quadras, praças, escolas e ruas da comunidade.",
  };
  return [PERGUNTAS[0], onde, ...PERGUNTAS.slice(1)];
}
