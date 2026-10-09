import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
    <div className="min-h-dvh bg-[#f7f5f1] print:bg-white">
      <header className="sticky top-0 z-30 border-b border-linha bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/brand/pazkids-em-acao-horizontal-400.webp" alt="" width={400} height={163} className="h-9 w-auto" />
            <span className="hidden font-titulo font-semibold lg:inline">Painel</span>
          </Link>
          <PainelNav admin={usuario.papel === "admin"} />
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-tinta-2 md:inline" title={usuario.papel === "admin" ? "Administrador" : "Voluntário"}>
              {usuario.nome || usuario.email}
            </span>
            {/* Encerra a sessão do Cloudflare Access, que é quem guarda o login. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/cdn-cgi/access/logout" className="text-sm text-tinta-2 hover:text-tinta">
              Sair
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
