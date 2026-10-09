import type { Metadata } from "next";
import Image from "next/image";
import { emailConfirmado, usuarioAtual } from "@/lib/auth";
import { liberarExpiradas } from "@/lib/reservas";
import { PainelNav } from "./nav";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  if (!usuario) {
    const email = await emailConfirmado();
    return (
      <main className="grid min-h-dvh place-items-center bg-creme px-4">
        <div className="cartao max-w-md p-8 text-center">
          <Image src="/brand/pazkids-em-acao-horizontal-400.webp" alt="Paz Kids em Ação" width={400} height={163} className="mx-auto h-20 w-auto" />
          <h1 className="mt-5 text-2xl font-semibold">Seu e-mail ainda não tem acesso</h1>
          <p className="mt-2 text-tinta-2">
            {email ? (
              <>
                Você entrou como <strong>{email}</strong>. Peça a um administrador para cadastrar este e-mail no painel.
              </>
            ) : (
              "Não foi possível confirmar o seu login."
            )}
          </p>
          {/* Rota do Cloudflare Access, fora do Next: precisa de navegação completa. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/cdn-cgi/access/logout" className="btn btn-claro mt-6">
            Entrar com outro e-mail
          </a>
        </div>
      </main>
    );
  }

  await liberarExpiradas();

  return (
    <div className="min-h-dvh bg-[#f7f5f1] lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] print:block print:bg-white">
      <PainelNav admin={usuario.papel === "admin"} nome={usuario.nome || usuario.email} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
    </div>
  );
}
