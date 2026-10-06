import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { adicionarUsuario, mudarPapel, removerUsuario } from "./actions";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  const eu = await requireAdmin();
  const lista = await getDb().select().from(schema.usuariosPainel).orderBy(asc(schema.usuariosPainel.email));
  const admins = lista.filter((u) => u.papel === "admin" && u.ativo).length;
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold">Usuários do painel</h1>
      <p className="mt-1 text-tinta-2">
        Para liberar alguém, cadastre o e-mail aqui. A pessoa entra em painel.pazkidsemacao.com e recebe um código nesse e-mail.
        Voluntário cuida de crianças, apadrinhamentos e entregas; admin também cuida de campanhas, pontos de coleta, importação e usuários.
      </p>

      <div className="cartao mt-6 overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="border-b border-linha text-left text-xs text-tinta-2 uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Pessoa</th>
              <th className="px-4 py-3 font-semibold">Papel</th>
              <th className="px-4 py-3 font-semibold">Cadastrado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linha">
            {lista.map((u) => {
              const ultimoAdmin = u.papel === "admin" && admins <= 1;
              return (
                <tr key={u.email}>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold">{u.nome || u.email}</span>
                    {u.nome && <span className="block text-xs text-tinta-2">{u.email}</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {u.papel === "admin" ? "Admin" : "Voluntário"}
                    {!ultimoAdmin && u.email !== eu.email && (
                      <form action={mudarPapel.bind(null, u.email, u.papel === "admin" ? "voluntario" : "admin")} className="inline">
                        <button className="ml-2 text-xs text-verde hover:underline">{u.papel === "admin" ? "tornar voluntário" : "tornar admin"}</button>
                      </form>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-tinta-2">
                    {formatDateTime(u.criadoEm)}
                    {u.criadoPor && u.criadoPor !== "migration" && <span className="block text-xs">por {u.criadoPor}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {u.email !== eu.email && !ultimoAdmin && (
                      <form action={removerUsuario.bind(null, u.email)}>
                        <ConfirmButton message={`Remover o acesso de ${u.email}?`} className="text-tinta-2 hover:text-vermelho">
                          Remover
                        </ConfirmButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="cartao mt-8 p-5">
        <h2 className="text-lg font-semibold">Adicionar usuário</h2>
        <ActionForm action={adicionarUsuario} resetOnSuccess className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end">
          <label className="block">
            <span className="rotulo">E-mail</span>
            <input name="email" type="email" required className="campo" />
          </label>
          <label className="block">
            <span className="rotulo">Nome</span>
            <input name="nome" className="campo" />
          </label>
          <label className="block">
            <span className="rotulo">Papel</span>
            <select name="papel" className="campo" defaultValue="voluntario">
              <option value="voluntario">Voluntário</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <SubmitButton className="btn btn-primario">Adicionar</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
