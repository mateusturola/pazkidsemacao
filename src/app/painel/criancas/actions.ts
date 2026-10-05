"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apagar, bucket, extensaoFoto, FOTO_MAX_BYTES } from "@/lib/arquivos";
import { auditar } from "@/lib/auditoria";
import { requireAdmin, requireUsuario } from "@/lib/auth";
import { avatarSvg } from "@/lib/avatar";
import { getDb, schema } from "@/lib/db";
import { novoToken } from "@/lib/token";

const { criancas, participacoes, pedidoItens } = schema;

function texto(form: FormData, nome: string) {
  const v = form.get(nome);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function dataIso(v: string | null) {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

function dadosDoFormulario(form: FormData) {
  const sexo = texto(form, "sexo");
  const autorizacao = form.get("autorizacaoImagem") === "sim";
  return {
    nome: texto(form, "nome") ?? "",
    apelidoPublico: texto(form, "apelidoPublico"),
    dataNascimento: dataIso(texto(form, "dataNascimento")),
    sexo: sexo === "F" || sexo === "M" ? (sexo as "F" | "M") : null,
    tamanhoCamiseta: texto(form, "tamanhoCamiseta"),
    tamanhoCalca: texto(form, "tamanhoCalca"),
    tamanhoCalcado: texto(form, "tamanhoCalcado"),
    sugestaoPresente: texto(form, "sugestaoPresente"),
    gostos: texto(form, "gostos"),
    responsavelNome: texto(form, "responsavelNome"),
    responsavelContato: texto(form, "responsavelContato"),
    autorizacaoImagem: autorizacao,
    autorizacaoImagemData: autorizacao ? dataIso(texto(form, "autorizacaoImagemData")) : null,
    observacoes: texto(form, "observacoes"),
    idExterno: texto(form, "idExterno"),
  };
}

function revalidar(id?: number) {
  revalidatePath("/painel/criancas");
  if (id) revalidatePath(`/painel/criancas/${id}`);
  // O site público mostra tamanhos, apelido e imagem: qualquer mudança aparece lá também.
  revalidatePath("/", "layout");
}

export async function criarCrianca(_: string | null, form: FormData) {
  const u = await requireUsuario();
  const dados = dadosDoFormulario(form);
  if (!dados.nome) return "Informe o nome.";
  const [nova] = await getDb().insert(criancas).values(dados).returning({ id: criancas.id });
  await auditar(u.email, "criou", "crianca", nova.id, { nome: dados.nome });
  revalidar(nova.id);
  redirect(`/criancas/${nova.id}`);
}

export async function salvarCrianca(id: number, _: string | null, form: FormData) {
  const u = await requireUsuario();
  const dados = dadosDoFormulario(form);
  if (!dados.nome) return "Informe o nome.";
  const db = getDb();
  const [antes] = await db.select().from(criancas).where(eq(criancas.id, id)).limit(1);
  if (!antes) return "Criança não encontrada.";
  await db
    .update(criancas)
    .set({ ...dados, atualizadoEm: new Date() })
    .where(eq(criancas.id, id));
  const mudou = Object.fromEntries(Object.entries(dados).filter(([k, v]) => (antes as Record<string, unknown>)[k] !== v).map(([k, v]) => [k, v]));
  // Contato e observações não vão inteiros para o log: o log é lido por mais gente que a ficha.
  for (const k of ["responsavelContato", "observacoes"]) if (k in mudou) mudou[k] = "(alterado)";
  if (Object.keys(mudou).length) await auditar(u.email, "editou", "crianca", id, mudou);
  revalidar(id);
  return "Salvo.";
}

export async function alternarAtivo(id: number) {
  const u = await requireUsuario();
  const db = getDb();
  const [c] = await db.select({ ativo: criancas.ativo }).from(criancas).where(eq(criancas.id, id)).limit(1);
  if (!c) return;
  await db.update(criancas).set({ ativo: !c.ativo, atualizadoEm: new Date() }).where(eq(criancas.id, id));
  await auditar(u.email, c.ativo ? "desativou" : "reativou", "crianca", id);
  revalidar(id);
}

/** Exclusão definitiva (pedido do responsável, por exemplo). Só para quem nunca entrou num pedido. */
export async function excluirCrianca(id: number) {
  const u = await requireAdmin();
  const db = getDb();
  const [emPedido] = await db.select().from(pedidoItens).where(eq(pedidoItens.criancaId, id)).limit(1);
  if (emPedido) throw new Error("Esta criança já fez parte de um pedido. Desative em vez de excluir.");
  const [c] = await db.select().from(criancas).where(eq(criancas.id, id)).limit(1);
  if (!c) return;
  await db.batch([db.delete(participacoes).where(eq(participacoes.criancaId, id)), db.delete(criancas).where(eq(criancas.id, id))]);
  await Promise.all([apagar(c.fotoKey), apagar(c.avatarKey)]);
  await auditar(u.email, "excluiu", "crianca", id, { nome: c.nome });
  revalidar();
  redirect("/criancas");
}

export async function enviarFoto(id: number, _: string | null, form: FormData) {
  const u = await requireUsuario();
  const arquivo = form.get("foto");
  if (!(arquivo instanceof File) || !arquivo.size) return "Escolha uma foto.";
  const ext = extensaoFoto(arquivo.type);
  if (!ext) return "Use uma foto JPG, PNG ou WebP.";
  if (arquivo.size > FOTO_MAX_BYTES) return "A foto passa de 8 MB.";
  const db = getDb();
  const [c] = await db.select({ fotoKey: criancas.fotoKey }).from(criancas).where(eq(criancas.id, id)).limit(1);
  if (!c) return "Criança não encontrada.";
  // Nome aleatório: a chave entra no endereço da imagem, e trocar a foto troca o endereço (sem cache velho).
  const key = `criancas/${id}/foto-${novoToken()}.${ext}`;
  await bucket().put(key, await arquivo.arrayBuffer(), { httpMetadata: { contentType: arquivo.type } });
  await db.update(criancas).set({ fotoKey: key, atualizadoEm: new Date() }).where(eq(criancas.id, id));
  await apagar(c.fotoKey);
  await auditar(u.email, "trocou a foto", "crianca", id);
  revalidar(id);
  return null;
}

export async function removerFoto(id: number) {
  const u = await requireUsuario();
  const db = getDb();
  const [c] = await db.select({ fotoKey: criancas.fotoKey }).from(criancas).where(eq(criancas.id, id)).limit(1);
  if (!c?.fotoKey) return;
  await db.update(criancas).set({ fotoKey: null, atualizadoEm: new Date() }).where(eq(criancas.id, id));
  await apagar(c.fotoKey);
  await auditar(u.email, "removeu a foto", "crianca", id);
  revalidar(id);
}

/** Guarda o avatar da semente escolhida. O SVG é gerado aqui, nunca recebido do navegador. */
export async function salvarAvatar(id: number, seed: string) {
  const u = await requireUsuario();
  if (!/^[\w-]{1,40}$/.test(seed)) throw new Error("Semente inválida.");
  const db = getDb();
  const [c] = await db.select({ avatarKey: criancas.avatarKey }).from(criancas).where(eq(criancas.id, id)).limit(1);
  if (!c) throw new Error("Criança não encontrada.");
  const key = `criancas/${id}/avatar-${seed}.svg`;
  await bucket().put(key, avatarSvg(seed), { httpMetadata: { contentType: "image/svg+xml" } });
  await db.update(criancas).set({ avatarKey: key, avatarSeed: seed, atualizadoEm: new Date() }).where(eq(criancas.id, id));
  if (c.avatarKey !== key) await apagar(c.avatarKey);
  await auditar(u.email, "gerou avatar", "crianca", id);
  revalidar(id);
}

// ---------- importação ----------

export type LinhaImportacao = {
  idExterno?: string;
  nome?: string;
  apelidoPublico?: string;
  dataNascimento?: string;
  sexo?: string;
  tamanhoCamiseta?: string;
  tamanhoCalca?: string;
  tamanhoCalcado?: string;
  sugestaoPresente?: string;
  gostos?: string;
  responsavelNome?: string;
  responsavelContato?: string;
  autorizacaoImagem?: string;
  observacoes?: string;
};

export type ResultadoImportacao = { criadas: number; atualizadas: number; naCampanha: number; erros: string[] };

function sexoDe(v?: string) {
  const s = (v ?? "").trim().toLowerCase();
  if (["f", "fem", "feminino", "menina", "mulher"].includes(s)) return "F" as const;
  if (["m", "masc", "masculino", "menino", "homem"].includes(s)) return "M" as const;
  return null;
}

function simDe(v?: string) {
  return ["sim", "s", "yes", "y", "true", "1", "x", "autorizado", "autorizada"].includes((v ?? "").trim().toLowerCase());
}

/**
 * Recebe as linhas já lidas da planilha no navegador (CSV ou Excel) e com as colunas casadas.
 * Atualiza quem já existe (pelo código do sistema antigo, ou nome + nascimento) em vez de duplicar.
 */
export async function importarCriancas(linhas: LinhaImportacao[], campanhaId: number | null): Promise<ResultadoImportacao> {
  const u = await requireAdmin();
  const r: ResultadoImportacao = { criadas: 0, atualizadas: 0, naCampanha: 0, erros: [] };
  // Erro lançado numa server action chega ao navegador sem a mensagem; por isso o aviso vai no resultado.
  if (linhas.length > 1000) return { ...r, erros: ["Importe no máximo 1.000 linhas por vez. Divida a planilha."] };
  const db = getDb();
  const ids: number[] = [];

  const existentes = await db
    .select({ id: criancas.id, nome: criancas.nome, dataNascimento: criancas.dataNascimento, idExterno: criancas.idExterno })
    .from(criancas);
  const porExterno = new Map(existentes.filter((c) => c.idExterno).map((c) => [c.idExterno!, c.id]));
  const chave = (nome: string, nasc: string | null) => `${nome.trim().toLowerCase()}|${nasc ?? ""}`;
  const porNome = new Map(existentes.map((c) => [chave(c.nome, c.dataNascimento), c.id]));

  // Tudo vai em lotes (db.batch): o D1 limita quantas consultas uma requisição faz, e uma planilha
  // de 300 crianças viraria 300 consultas soltas.
  type Op = { tipo: "criar" | "atualizar"; id?: number; dados: typeof criancas.$inferInsert };
  const ops: Op[] = [];
  const vistos = new Set<string>();

  for (const [i, l] of linhas.entries()) {
    const nome = l.nome?.trim();
    if (!nome) {
      r.erros.push(`Linha ${i + 2}: sem nome.`);
      continue;
    }
    const nasc = dataIso(l.dataNascimento?.trim() ?? null);
    if (l.dataNascimento?.trim() && !nasc) r.erros.push(`Linha ${i + 2} (${nome}): data de nascimento "${l.dataNascimento}" não reconhecida; ficou em branco.`);
    const dados = {
      nome,
      apelidoPublico: l.apelidoPublico?.trim() || null,
      dataNascimento: nasc,
      sexo: sexoDe(l.sexo),
      tamanhoCamiseta: l.tamanhoCamiseta?.trim() || null,
      tamanhoCalca: l.tamanhoCalca?.trim() || null,
      tamanhoCalcado: l.tamanhoCalcado?.trim() || null,
      sugestaoPresente: l.sugestaoPresente?.trim() || null,
      gostos: l.gostos?.trim() || null,
      responsavelNome: l.responsavelNome?.trim() || null,
      responsavelContato: l.responsavelContato?.trim() || null,
      // Célula vazia não decide nada; "não" escrito na planilha revoga, mesmo que o painel diga sim.
      autorizacaoImagem: l.autorizacaoImagem?.trim() ? simDe(l.autorizacaoImagem) : undefined,
      observacoes: l.observacoes?.trim() || null,
      idExterno: l.idExterno?.trim() || null,
    };
    const k = dados.idExterno ? `ext:${dados.idExterno}` : chave(nome, nasc);
    if (vistos.has(k)) {
      r.erros.push(`Linha ${i + 2} (${nome}): repetida na planilha; ficou só a primeira.`);
      continue;
    }
    vistos.add(k);
    const existente = (dados.idExterno && porExterno.get(dados.idExterno)) || porNome.get(chave(nome, nasc));
    if (existente) {
      // Campo vazio na planilha não apaga o que a equipe já preencheu no painel.
      const preenchidos = Object.fromEntries(Object.entries(dados).filter(([, v]) => v !== null && v !== "" && v !== undefined));
      ops.push({ tipo: "atualizar", id: existente, dados: { ...preenchidos, nome, atualizadoEm: new Date() } });
    } else {
      ops.push({ tipo: "criar", dados: { ...dados, autorizacaoImagem: dados.autorizacaoImagem ?? false } });
    }
  }

  for (let i = 0; i < ops.length; i += 50) {
    const lote = ops.slice(i, i + 50);
    const stmts = lote.map((op) =>
      op.tipo === "criar"
        ? db.insert(criancas).values(op.dados).returning({ id: criancas.id })
        : db.update(criancas).set(op.dados).where(eq(criancas.id, op.id!)).returning({ id: criancas.id }),
    );
    const res = await db.batch(stmts as [(typeof stmts)[number], ...(typeof stmts)[number][]]);
    for (const [j, rows] of res.entries()) {
      const id = (rows as { id: number }[])[0]?.id;
      if (id) ids.push(id);
      if (lote[j].tipo === "criar") r.criadas++;
      else r.atualizadas++;
    }
  }

  if (campanhaId && ids.length) {
    for (let i = 0; i < ids.length; i += 50) {
      const lote = ids.slice(i, i + 50);
      const novas = await db
        .insert(participacoes)
        .values(lote.map((criancaId) => ({ criancaId, campanhaId })))
        .onConflictDoNothing()
        .returning({ id: participacoes.id });
      r.naCampanha += novas.length;
    }
  }

  await auditar(u.email, "importou planilha", "crianca", null, { criadas: r.criadas, atualizadas: r.atualizadas, campanhaId });
  revalidar();
  if (campanhaId) revalidatePath(`/painel/campanhas/${campanhaId}`);
  return r;
}
