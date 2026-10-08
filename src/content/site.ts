// Textos do Paz Kids em Ação. A base é a página atual do projeto (pazkids.com.br/paz-kids-em-acao)
// e o briefing da equipe; nada de número, depoimento ou parceiro que não tenha vindo deles.

export const SITE = {
  nome: "Paz Kids em Ação",
  lema: "Alcançando além das quatro paredes",
  url: "https://pazkidsemacao.com",
  descricao:
    "Projeto social e missionário do Paz Kids, da Paz Church, que leva o amor de Cristo, educação, apoio emocional e recursos básicos para crianças de Heliópolis e de outras comunidades da Grande São Paulo.",
  // O projeto atua em Heliópolis, mas a igreja não fica lá: é a Paz Church São Paulo.
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
  historia: [
    {
      quando: "Julho de 2022",
      titulo: "Começou como evangelismo",
      texto: "O Paz Kids em Ação nasceu como um projeto de evangelismo, inspirado pelo treinamento da Metro World Kids.",
    },
    {
      quando: "Depois",
      titulo: "Cresceu para a comunidade",
      texto: "Passou a atender crianças em Heliópolis e em outras áreas da Grande São Paulo.",
    },
    {
      quando: "Hoje",
      titulo: "Junto com parceiros",
      texto: "Segue em parceria com a Metro World Kids, levando a igreja para onde as crianças estão.",
    },
  ],
};

/**
 * O legado do Pastor Lucas Huber, que dá a raiz do projeto. Só fatos confirmados pela equipe e pelas
 * fontes da PAZ International: nada de data, número ou cena que não esteja nelas.
 */
export const LEGADO = {
  titulo: "Tudo começou às margens dos rios",
  paragrafos: [
    "A história começa nos Estados Unidos, quando Melvin e Catherine Huber receberam o chamado de Deus para servir no Brasil. Foram mais de 25 anos plantando igrejas por aqui, e foi nessa família que cresceu Lucas Huber.",
    "Em dezembro de 1976, o missionário Lucas Huber chegou a Santarém, no Pará, com a esposa, Christine, e as duas filhas pequenas. Ali nasceu a Paz Church.",
    "O sonho dele era levar o Evangelho a cada vila da Amazônia. Primeiro de barco, pelos rios, até as comunidades ribeirinhas. Depois, num pequeno avião que aprendeu a pilotar para chegar mais longe.",
    "O Pastor Lucas partiu para a eternidade em 1994. O chamado continuou. Em 2026, a Paz Church completa 50 anos, e o Paz Kids em Ação é um dos frutos dessa história: o mesmo amor pelas crianças, agora nas ruas e praças de Heliópolis.",
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
    p: "Onde o Paz Kids em Ação atua?",
    r: "Em Heliópolis, em São Paulo, e em outras comunidades da Grande São Paulo. As ações acontecem onde as crianças estão: quadras, praças, escolas e ruas da comunidade.",
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
    r: "Sim. É uma iniciativa do Paz Kids, o ministério infantil da Paz Church São Paulo. As ações acontecem em Heliópolis e em outras comunidades da Grande São Paulo.",
  },
];
