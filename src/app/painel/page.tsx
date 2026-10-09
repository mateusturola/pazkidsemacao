import Link from "next/link";
import { and, desc, eq, inArray, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { StatusBadge } from "@/components/painel/status-badge";
import { usuarioAtual } from "@/lib/auth";
import { campanhaAberta, entregasAtrasadas, MODALIDADE_LABEL, progressoCampanhas, STATUS_CAMPANHA_LABEL, STATUS_PEDIDO_LABEL } from "@/lib/campanhas";
import { formatDateTime, formatIsoDate } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { contarDemonstracao } from "@/lib/demonstracao";
import { modoPagamento } from "@/lib/pagamento";

const { campanhas, pedidos, padrinhos, criancas, pontosColeta, participacoes } = schema;

type Aviso = { tom: "urgente" | "atencao" | "dica"; titulo: string; texto: string; href: string; acao: string };

const TOM = {
  urgente: "border-vermelho/30 bg-vermelho/[0.06]",
  atencao: "border-laranja/35 bg-laranja/[0.07]",
  dica: "border-linha bg-white",
};

/**
 * O que precisa de alguém hoje. Cada aviso só aparece quando há o que fazer e leva direto para onde
 * se resolve: a equipe abre o painel e já sabe por onde começar.
 */
export default async function PainelInicio() {
  const db = getDb();
  const usuario = await usuarioAtual();
  const admin = usuario?.papel === "admin";

  const [lista, pendencias, atrasados, [semHistoria], pontos, demo, recentes] = await Promise.all([
    db.select().from(campanhas).where(ne(campanhas.status, "encerrada")).orderBy(desc(campanhas.criadoEm)),
    db.select({ id: pedidos.id, pendencia: pedidos.pendencia }).from(pedidos).where(isNotNull(pedidos.pendencia)),
    entregasAtrasadas(),
    db
      .select({ n: sql<number>`count(*)` })
      .from(criancas)
      .where(and(eq(criancas.ativo, true), isNull(criancas.sonho), isNull(criancas.sobre), or(isNull(criancas.idExterno), sql`${criancas.idExterno} not like 'demo-%'`))),
    db.select().from(pontosColeta).where(eq(pontosColeta.ativo, true)),
    admin ? contarDemonstracao() : Promise.resolve({ criancas: 0, pedidos: 0 }),
    db
      .select({ p: pedidos, padrinho: padrinhos.nome })
      .from(pedidos)
      .innerJoin(padrinhos, eq(padrinhos.id, pedidos.padrinhoId))
      .where(inArray(pedidos.status, ["pendente", "pago", "aguardando_entrega", "entregue"]))
      .orderBy(desc(pedidos.criadoEm))
      .limit(6),
  ]);
  const progresso = await progressoCampanhas(lista.map((c) => c.id));
  const abertas = lista.filter(campanhaAberta);
  const principal = abertas[0] ?? lista[0];
  const [aEntregar] = principal
    ? await db
        .select({ n: sql<number>`count(*)` })
        .from(pedidos)
        .where(and(eq(pedidos.campanhaId, principal.id), eq(pedidos.status, "aguardando_entrega")))
    : [];
  const porStatus = principal
    ? Object.fromEntries(
        (
          await db
            .select({ status: participacoes.status, n: sql<number>`count(*)` })
            .from(participacoes)
            .where(eq(participacoes.campanhaId, principal.id))
            .groupBy(participacoes.status)
        ).map((r) => [r.status, Number(r.n)]),
      )
    : {};

  const avisos: Aviso[] = [];
  for (const p of pendencias) {
    avisos.push({ tom: "urgente", titulo: `Pedido #${p.id} precisa de alguém`, texto: p.pendencia ?? "", href: `/pedidos/${p.id}`, acao: "Abrir o pedido" });
  }
  if (atrasados.length) {
    avisos.push({
      tom: "urgente",
      titulo: `${atrasados.length} sacolinha(s) com a entrega atrasada`,
      texto: atrasados
        .slice(0, 3)
        .map((a) => `${a.nome} (até ${a.prazoEntrega ? formatIsoDate(a.prazoEntrega) : "—"})`)
        .join(", ")
        .concat(atrasados.length > 3 ? " e outros." : ". Fale com o padrinho ou libere as crianças."),
      href: atrasados.length === 1 ? `/pedidos/${atrasados[0].id}` : "/pedidos",
      acao: atrasados.length === 1 ? "Abrir o pedido" : "Ver os pedidos",
    });
  }
  if (demo.criancas > 0) {
    avisos.push({
      tom: "urgente",
      titulo: `${demo.criancas} crianças de demonstração no site`,
      texto: "São nomes fictícios. Depois de cadastrar as crianças reais, apague os dados de demonstração antes de divulgar a campanha.",
      href: "/configuracoes#demonstracao",
      acao: "Apagar dados de demonstração",
    });
  }
  const semEndereco = pontos.filter((p) => !p.endereco || /a confirmar/i.test(p.endereco) || !p.horarios || /a confirmar/i.test(p.horarios));
  if (!pontos.length || semEndereco.length) {
    avisos.push({
      tom: "atencao",
      titulo: pontos.length ? "Ponto de entrega sem endereço ou horário" : "Nenhum ponto de entrega",
      texto: pontos.length
        ? `${semEndereco.map((p) => p.nome).join(", ")}: o padrinho vê "a confirmar" no site e no e-mail.`
        : "Quem monta a sacolinha não tem onde entregar.",
      href: "/pontos",
      acao: admin ? "Preencher" : "Ver os pontos",
    });
  }
  for (const c of abertas) {
    if (!(progresso.get(c.id)?.total ?? 0)) {
      avisos.push({ tom: "atencao", titulo: `${c.nome} está aberta sem crianças`, texto: "A página da campanha mostra a lista vazia.", href: `/campanhas/${c.id}`, acao: "Abrir a campanha" });
    }
  }
  if (admin && abertas.length && modoPagamento() === "demo") {
    avisos.push({
      tom: "atencao",
      titulo: "Doação online em modo de teste",
      texto: "Quem escolhe doar online não é cobrado de verdade. Falta conectar a conta da igreja no Asaas.",
      href: "/configuracoes",
      acao: "Ver configurações",
    });
  }
  if (Number(semHistoria?.n)) {
    avisos.push({
      tom: "dica",
      titulo: `${Number(semHistoria.n)} criança(s) sem sonho nem "sobre"`,
      texto: "Quando o padrinho clica em Conhecer, o texto sai só com idade e gostos. Uma frase da família faz diferença.",
      href: "/criancas",
      acao: "Completar",
    });
  }

  const p = principal ? (progresso.get(principal.id) ?? { total: 0, comPadrinho: 0 }) : null;

  return (
    <div>
      <h1 className="text-3xl font-semibold">Olá{usuario?.nome ? `, ${usuario.nome.split(" ")[0]}` : ""}</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">O que precisa da sua atenção</h2>
        {avisos.length === 0 ? (
          <p className="cartao mt-3 p-6 text-tinta-2">Tudo em dia. Nada esperando por você agora.</p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {avisos.map((a, i) => (
              <li key={i}>
                <Link href={a.href} className={`flex h-full flex-col rounded-2xl border p-5 transition-colors hover:border-tinta/30 ${TOM[a.tom]}`}>
                  <span className="font-semibold">{a.titulo}</span>
                  <span className="mt-1 flex-1 text-sm text-tinta-2">{a.texto}</span>
                  <span className="mt-3 text-sm font-semibold text-verde">{a.acao} →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {principal && p && (
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{principal.nome}</h2>
            <StatusBadge status={principal.status} label={STATUS_CAMPANHA_LABEL[principal.status]} />
          </div>
          <div className="cartao mt-3 p-5">
            <div className="h-2.5 overflow-hidden rounded-full bg-creme">
              <div className="h-full rounded-full bg-verde" style={{ width: `${p.total ? (p.comPadrinho / p.total) * 100 : 0}%` }} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Com padrinho", p.comPadrinho],
                ["Esperando padrinho", Number(porStatus.disponivel ?? 0)],
                ["Sacolinhas a receber", Number(aEntregar?.n ?? 0)],
                ["Entregues", Number(porStatus.entregue ?? 0)],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-sm text-tinta-2">{k}</dt>
                  <dd className="font-titulo text-2xl font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-linha pt-4">
              <Link href={`/campanhas/${principal.id}`} className="btn btn-primario btn-sm">
                Abrir a campanha
              </Link>
              <Link href={`/campanhas/${principal.id}/mensagens`} className="btn btn-claro btn-sm">
                Mensagens para imprimir
              </Link>
              <a href={`https://pazkidsemacao.com/${principal.slug}`} target="_blank" rel="noopener" className="btn btn-claro btn-sm">
                Ver no site
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Atalhos</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/criancas/nova" className="btn btn-claro btn-sm">
            Nova criança
          </Link>
          {admin && (
            <Link href="/criancas/importar" className="btn btn-claro btn-sm">
              Importar planilha de crianças
            </Link>
          )}
          <Link href="/agenda" className="btn btn-claro btn-sm">
            Atualizar a agenda
          </Link>
          <Link href="/agenda/story" className="btn btn-claro btn-sm">
            Gerar story da agenda
          </Link>
          {admin && (
            <Link href="/campanhas/nova" className="btn btn-claro btn-sm">
              Nova campanha
            </Link>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimos pedidos</h2>
          <Link href="/pedidos" className="text-sm text-verde hover:underline">
            Ver todos
          </Link>
        </div>
        {recentes.length === 0 ? (
          <p className="cartao mt-3 p-6 text-tinta-2">Nenhum pedido ainda.</p>
        ) : (
          <ul className="cartao mt-3 divide-y divide-linha">
            {recentes.map(({ p, padrinho }) => (
              <li key={p.id}>
                <Link href={`/pedidos/${p.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm hover:bg-creme/40">
                  <span className="font-semibold">#{p.id}</span>
                  <span>{padrinho}</span>
                  <span className="text-tinta-2">{MODALIDADE_LABEL[p.modalidade]}</span>
                  <span className="ml-auto flex items-center gap-3">
                    <StatusBadge status={p.status} label={STATUS_PEDIDO_LABEL[p.status]} />
                    <span className="text-tinta-2">{formatDateTime(p.criadoEm)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
