import { sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Convenções: dinheiro em centavos (integer); data pura em texto "YYYY-MM-DD"; instante em timestamp_ms.

const agora = sql`(unixepoch() * 1000)`;

export const criancas = sqliteTable(
  "criancas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nome: text("nome").notNull(),
    // O que o site mostra. Vazio, o site usa só o primeiro nome.
    apelidoPublico: text("apelido_publico"),
    dataNascimento: text("data_nascimento"),
    sexo: text("sexo", { enum: ["F", "M"] }),
    tamanhoCamiseta: text("tamanho_camiseta"),
    tamanhoCalca: text("tamanho_calca"),
    tamanhoCalcado: text("tamanho_calcado"),
    sugestaoPresente: text("sugestao_presente"),
    gostos: text("gostos"),
    // O que faz o padrinho conhecer a criança: o sonho ("quer ser professora") e um jeitinho dela,
    // contado por ela ou pelos pais. Vão para o site: nada de escola, rua ou sobrenome.
    sonho: text("sonho"),
    sobre: text("sobre"),
    fotoKey: text("foto_key"),
    avatarKey: text("avatar_key"),
    avatarSeed: text("avatar_seed"),
    responsavelNome: text("responsavel_nome"),
    responsavelContato: text("responsavel_contato"),
    // Sem autorização, a foto nunca sai do painel; o site mostra o avatar.
    autorizacaoImagem: integer("autorizacao_imagem", { mode: "boolean" }).notNull().default(false),
    autorizacaoImagemData: text("autorizacao_imagem_data"),
    observacoes: text("observacoes"),
    // Código da criança no sistema antigo: a importação usa para atualizar em vez de duplicar.
    idExterno: text("id_externo"),
    ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
    criadoEm: integer("criado_em", { mode: "timestamp_ms" }).notNull().default(agora),
    atualizadoEm: integer("atualizado_em", { mode: "timestamp_ms" }).notNull().default(agora),
  },
  (t) => [index("criancas_nome_idx").on(t.nome), index("criancas_id_externo_idx").on(t.idExterno)],
);

export const campanhas = sqliteTable("campanhas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  // Endereço público: pazkidsemacao.com/<slug>.
  slug: text("slug").notNull().unique(),
  tipo: text("tipo").notNull().default("natal"),
  descricao: text("descricao"),
  dataInicio: text("data_inicio"),
  dataFim: text("data_fim"),
  status: text("status", { enum: ["rascunho", "ativa", "encerrada"] }).notNull().default("rascunho"),
  // Sem valor, o pagamento online não aparece: o doador só pode montar e entregar.
  valorSacolinha: integer("valor_sacolinha"),
  maxParcelas: integer("max_parcelas").notNull().default(1),
  // Data limite para entregar a sacolinha no balcão.
  prazoEntrega: text("prazo_entrega"),
  // Um item por linha ("1 camiseta", "1 calça"...).
  itensSacolinha: text("itens_sacolinha"),
  criadoEm: integer("criado_em", { mode: "timestamp_ms" }).notNull().default(agora),
});

export const padrinhos = sqliteTable(
  "padrinhos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nome: text("nome").notNull(),
    email: text("email"),
    telefone: text("telefone"),
    // Exigido pelo Asaas para cobrar; quem entrega no balcão não precisa informar.
    cpf: text("cpf"),
    asaasCustomerId: text("asaas_customer_id"),
    criadoEm: integer("criado_em", { mode: "timestamp_ms" }).notNull().default(agora),
  },
  (t) => [index("padrinhos_cpf_idx").on(t.cpf), index("padrinhos_email_idx").on(t.email)],
);

export const pontosColeta = sqliteTable("pontos_coleta", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  endereco: text("endereco"),
  horarios: text("horarios"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  criadoEm: integer("criado_em", { mode: "timestamp_ms" }).notNull().default(agora),
});

export const pedidos = sqliteTable(
  "pedidos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // Endereço da página do pedido para o doador. É a única proteção dela.
    token: text("token").notNull().unique(),
    padrinhoId: integer("padrinho_id")
      .notNull()
      .references(() => padrinhos.id),
    campanhaId: integer("campanha_id")
      .notNull()
      .references(() => campanhas.id),
    modalidade: text("modalidade", { enum: ["pagamento_online", "entrega_balcao"] }).notNull(),
    pontoColetaId: integer("ponto_coleta_id").references(() => pontosColeta.id),
    valor: integer("valor"),
    parcelas: integer("parcelas").notNull().default(1),
    forma: text("forma", { enum: ["pix", "cartao"] }),
    asaasPaymentId: text("asaas_payment_id"),
    asaasInvoiceUrl: text("asaas_invoice_url"),
    status: text("status", { enum: ["pendente", "pago", "aguardando_entrega", "entregue", "cancelado", "expirado"] }).notNull(),
    // Pagamento online: até quando as crianças ficam seguras esperando o pagamento.
    reservadoAte: integer("reservado_ate", { mode: "timestamp_ms" }),
    prazoEntrega: text("prazo_entrega"),
    pagoEm: integer("pago_em", { mode: "timestamp_ms" }),
    entregueEm: integer("entregue_em", { mode: "timestamp_ms" }),
    // Algo que a equipe precisa resolver (pagamento que chegou depois de a criança ir para outro padrinho, estorno).
    pendencia: text("pendencia"),
    observacoes: text("observacoes"),
    criadoEm: integer("criado_em", { mode: "timestamp_ms" }).notNull().default(agora),
  },
  (t) => [index("pedidos_status_idx").on(t.status), index("pedidos_campanha_idx").on(t.campanhaId), index("pedidos_asaas_idx").on(t.asaasPaymentId)],
);

export const pedidoItens = sqliteTable(
  "pedido_itens",
  {
    pedidoId: integer("pedido_id")
      .notNull()
      .references(() => pedidos.id),
    criancaId: integer("crianca_id")
      .notNull()
      .references(() => criancas.id),
    // Recado do padrinho para a criança: a equipe lê, imprime e põe na sacolinha.
    mensagem: text("mensagem"),
    vaiOrar: integer("vai_orar", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.pedidoId, t.criancaId] })],
);

export const STATUS_PARTICIPACAO = ["disponivel", "reservada", "apadrinhada", "entregue"] as const;
export const CANAIS = ["site", "whatsapp", "presencial", "igreja", "outro"] as const;

export const participacoes = sqliteTable(
  "participacoes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    criancaId: integer("crianca_id")
      .notNull()
      .references(() => criancas.id),
    campanhaId: integer("campanha_id")
      .notNull()
      .references(() => campanhas.id),
    pedidoId: integer("pedido_id").references(() => pedidos.id),
    status: text("status", { enum: STATUS_PARTICIPACAO }).notNull().default("disponivel"),
    padrinhoNome: text("padrinho_nome"),
    padrinhoContato: text("padrinho_contato"),
    canal: text("canal", { enum: CANAIS }),
    dataApadrinhamento: text("data_apadrinhamento"),
    dataEntrega: text("data_entrega"),
    observacoes: text("observacoes"),
    atualizadoEm: integer("atualizado_em", { mode: "timestamp_ms" }).notNull().default(agora),
  },
  (t) => [
    // Uma criança aparece uma vez por campanha: é essa linha que a reserva disputa.
    uniqueIndex("participacoes_crianca_campanha_uq").on(t.criancaId, t.campanhaId),
    index("participacoes_campanha_status_idx").on(t.campanhaId, t.status),
    index("participacoes_pedido_idx").on(t.pedidoId),
  ],
);

export const usuariosPainel = sqliteTable("usuarios_painel", {
  // Sempre em minúsculas: é o e-mail que o Cloudflare Access confirma.
  email: text("email").primaryKey(),
  nome: text("nome"),
  papel: text("papel", { enum: ["admin", "voluntario"] }).notNull().default("voluntario"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  criadoPor: text("criado_por"),
  criadoEm: integer("criado_em", { mode: "timestamp_ms" }).notNull().default(agora),
});

export const logAuditoria = sqliteTable(
  "log_auditoria",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // E-mail de quem fez, ou "site"/"asaas" quando foi o doador ou o webhook.
    autor: text("autor").notNull(),
    acao: text("acao").notNull(),
    entidade: text("entidade").notNull(),
    entidadeId: text("entidade_id"),
    detalhes: text("detalhes"),
    criadoEm: integer("criado_em", { mode: "timestamp_ms" }).notNull().default(agora),
  },
  (t) => [index("log_entidade_idx").on(t.entidade, t.entidadeId), index("log_criado_idx").on(t.criadoEm)],
);

export type Crianca = typeof criancas.$inferSelect;
export type Campanha = typeof campanhas.$inferSelect;
export type Pedido = typeof pedidos.$inferSelect;
export type Participacao = typeof participacoes.$inferSelect;
export type PontoColeta = typeof pontosColeta.$inferSelect;
export type UsuarioPainel = typeof usuariosPainel.$inferSelect;
export type StatusParticipacao = (typeof STATUS_PARTICIPACAO)[number];
export type Canal = (typeof CANAIS)[number];

export const TIPOS_EMAIL = ["agradecimento", "lembrete", "lembrete_final", "entregue"] as const;

export const emailsEnviados = sqliteTable(
  "emails_enviados",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pedidoId: integer("pedido_id")
      .notNull()
      .references(() => pedidos.id),
    tipo: text("tipo", { enum: TIPOS_EMAIL }).notNull(),
    para: text("para").notNull(),
    assunto: text("assunto").notNull(),
    // Guardado inteiro: a equipe vê no painel exatamente o que o padrinho recebeu.
    html: text("html").notNull(),
    // "demo": gerado mas não enviado (sem Resend configurado). "erro": o provedor recusou.
    status: text("status", { enum: ["enviado", "demo", "erro"] }).notNull(),
    erro: text("erro"),
    criadoEm: integer("criado_em", { mode: "timestamp_ms" }).notNull().default(agora),
  },
  // Um e-mail de cada tipo por pedido: o cron diário pode rodar de novo sem mandar lembrete repetido.
  (t) => [uniqueIndex("emails_pedido_tipo_uq").on(t.pedidoId, t.tipo)],
);

export type EmailEnviado = typeof emailsEnviados.$inferSelect;

/** Últimos posts do Instagram, copiados pelo cron: a imagem do Instagram expira, a do R2 não. */
export const instagramPosts = sqliteTable(
  "instagram_posts",
  {
    id: text("id").primaryKey(),
    permalink: text("permalink").notNull(),
    legenda: text("legenda"),
    tipo: text("tipo").notNull(),
    imagemKey: text("imagem_key").notNull(),
    publicadoEm: integer("publicado_em", { mode: "timestamp_ms" }).notNull(),
    atualizadoEm: integer("atualizado_em", { mode: "timestamp_ms" }).notNull().default(agora),
  },
  (t) => [index("instagram_publicado_idx").on(t.publicadoEm)],
);

/** Valores que o próprio sistema atualiza (o token do Instagram renovado, por exemplo). */
export const configuracoes = sqliteTable("configuracoes", {
  chave: text("chave").primaryKey(),
  valor: text("valor").notNull(),
  atualizadoEm: integer("atualizado_em", { mode: "timestamp_ms" }).notNull().default(agora),
});

/**
 * Agenda semanal dos encontros (a mesma da arte dos stories). Dia da semana 0 = domingo. A
 * coordenada vem do endereço ou de um link do Google Maps; sem ela, o encontro aparece só na lista.
 */
export const agenda = sqliteTable(
  "agenda",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    diaSemana: integer("dia_semana").notNull(),
    hora: text("hora").notNull(),
    nome: text("nome").notNull(),
    endereco: text("endereco").notNull(),
    complemento: text("complemento"),
    lat: real("lat"),
    lng: real("lng"),
    ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
    criadoEm: integer("criado_em", { mode: "timestamp_ms" }).notNull().default(agora),
  },
  (t) => [index("agenda_dia_idx").on(t.diaSemana, t.hora)],
);

export type EncontroAgenda = typeof agenda.$inferSelect;

/**
 * Quem pediu, no finalizar, para receber as próximas campanhas por e-mail. É o consentimento da
 * LGPD para o convite: sem linha aqui (ou com descadastro), a pessoa só recebe e-mails do próprio pedido.
 * Por e-mail, e não por padrinho, porque a mesma pessoa pode ter mais de um cadastro de padrinho.
 */
export const inscricoesNovidades = sqliteTable("inscricoes_novidades", {
  email: text("email").primaryKey(),
  nome: text("nome").notNull(),
  // Vai no link "não quero mais receber" de cada convite.
  token: text("token").notNull().unique(),
  aceitouEm: integer("aceitou_em", { mode: "timestamp_ms" }).notNull().default(agora),
  descadastradoEm: integer("descadastrado_em", { mode: "timestamp_ms" }),
});

/** Convites para uma campanha nova, mandados a quem apadrinhou numa anterior. Um por e-mail por campanha. */
export const convitesEnviados = sqliteTable(
  "convites_enviados",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    campanhaId: integer("campanha_id")
      .notNull()
      .references(() => campanhas.id),
    campanhaOrigemId: integer("campanha_origem_id")
      .notNull()
      .references(() => campanhas.id),
    para: text("para").notNull(),
    assunto: text("assunto").notNull(),
    html: text("html").notNull(),
    // "demo": gerado mas não enviado (sem Resend configurado). "erro": o provedor recusou.
    status: text("status", { enum: ["enviado", "demo", "erro"] }).notNull(),
    erro: text("erro"),
    enviadoPor: text("enviado_por").notNull(),
    criadoEm: integer("criado_em", { mode: "timestamp_ms" }).notNull().default(agora),
  },
  (t) => [uniqueIndex("convites_campanha_para_uq").on(t.campanhaId, t.para)],
);
