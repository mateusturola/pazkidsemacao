import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { AvatarGerador } from "@/components/painel/avatar-gerador";
import { CriancaForm } from "@/components/painel/crianca-form";
import { FotoCrianca } from "@/components/painel/foto-crianca";
import { FotoUpload } from "@/components/painel/foto-upload";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { usuarioAtual } from "@/lib/auth";
import { CANAL_LABEL, STATUS_LABEL } from "@/lib/campanhas";
import { idadeTexto } from "@/lib/criancas";
import { formatIsoDate } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { alternarAtivo, excluirCrianca, removerFoto, salvarAvatar, salvarCrianca } from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const [c] = await getDb()
    .select({ nome: schema.criancas.nome })
    .from(schema.criancas)
    .where(eq(schema.criancas.id, Number((await params).id)))
    .limit(1);
  return { title: c?.nome ?? "Criança" };
}

export default async function CriancaPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = getDb();
  const [c] = await db.select().from(schema.criancas).where(eq(schema.criancas.id, id)).limit(1);
  if (!c) notFound();
  const usuario = await usuarioAtual();
  const historico = await db
    .select({ p: schema.participacoes, campanha: schema.campanhas.nome, campanhaId: schema.campanhas.id })
    .from(schema.participacoes)
    .innerJoin(schema.campanhas, eq(schema.campanhas.id, schema.participacoes.campanhaId))
    .where(eq(schema.participacoes.criancaId, id))
    .orderBy(desc(schema.campanhas.criadoEm));
  const [emPedido] = await db.select().from(schema.pedidoItens).where(eq(schema.pedidoItens.criancaId, id)).limit(1);

  return (
    <div>
      <Link href="/criancas" className="text-sm text-tinta-2 hover:text-tinta">
        ← Crianças
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <FotoCrianca id={c.id} versao={c.fotoKey ?? c.avatarKey} className="size-16" />
        <div>
          <h1 className="text-3xl font-semibold">{c.nome}</h1>
          <p className="text-tinta-2">
            {[idadeTexto(c.dataNascimento), c.dataNascimento && `nasceu em ${formatIsoDate(c.dataNascimento)}`].filter(Boolean).join(" · ") || "Sem data de nascimento"}
            {!c.ativo && <span className="ml-2 rounded-md bg-tinta/10 px-2 py-0.5 text-xs font-semibold">Desativada</span>}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="cartao p-6">
          <CriancaForm action={salvarCrianca.bind(null, c.id)} crianca={c} botao="Salvar" />
        </div>

        <aside className="space-y-6">
          <section className="cartao p-5">
            <h2 className="text-lg font-semibold">Foto</h2>
            {c.fotoKey ? (
              <>
                <FotoCrianca id={c.id} versao={c.fotoKey} className="mt-3 aspect-square w-full" />
                <p className={`mt-2 text-sm ${c.autorizacaoImagem ? "text-verde" : "text-laranja"}`}>
                  {c.autorizacaoImagem ? "Autorizada: aparece no site." : "Sem autorização: o site mostra o avatar."}
                </p>
                <form action={removerFoto.bind(null, c.id)} className="mt-2">
                  <ConfirmButton message="Remover a foto?" className="text-sm text-vermelho hover:underline">
                    Remover foto
                  </ConfirmButton>
                </form>
              </>
            ) : (
              <p className="mt-1 text-sm text-tinta-2">Nenhuma foto.</p>
            )}
            <FotoUpload criancaId={c.id} temFoto={Boolean(c.fotoKey)} />
          </section>

          <section className="cartao p-5">
            <h2 className="text-lg font-semibold">Avatar</h2>
            <p className="mt-1 text-sm text-tinta-2">Ilustração que o site usa quando não há foto autorizada.</p>
            {c.avatarKey && <FotoCrianca id={c.id} versao={c.avatarKey} tipo="avatar" className="mt-3 size-24" />}
            <div className="mt-3">
              <AvatarGerador seedAtual={c.avatarSeed} salvar={salvarAvatar.bind(null, c.id)} />
            </div>
          </section>

          <section className="cartao p-5">
            <h2 className="text-lg font-semibold">Campanhas</h2>
            {historico.length === 0 ? (
              <p className="mt-1 text-sm text-tinta-2">Ainda não participou de nenhuma. Adicione pela página da campanha.</p>
            ) : (
              <ul className="mt-3 divide-y divide-linha text-sm">
                {historico.map(({ p, campanha, campanhaId }) => (
                  <li key={p.id} className="py-2">
                    <Link href={`/campanhas/${campanhaId}`} className="font-semibold hover:text-roxo">
                      {campanha}
                    </Link>
                    <span className="block text-tinta-2">
                      {STATUS_LABEL[p.status]}
                      {p.padrinhoNome && ` · ${p.padrinhoNome}`}
                      {p.canal && ` · ${CANAL_LABEL[p.canal]}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2 text-sm">
            <form action={alternarAtivo.bind(null, c.id)}>
              <button className="text-tinta-2 hover:text-tinta hover:underline">{c.ativo ? "Desativar criança" : "Reativar criança"}</button>
            </form>
            {usuario?.papel === "admin" && !emPedido && (
              <form action={excluirCrianca.bind(null, c.id)}>
                <ConfirmButton
                  message="Excluir de vez esta criança, com foto e avatar? Não tem como desfazer."
                  className="text-vermelho hover:underline"
                >
                  Excluir definitivamente
                </ConfirmButton>
              </form>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
