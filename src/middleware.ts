import { NextResponse, type NextRequest } from "next/server";
import { verifyAccess } from "@/lib/access";

// Um Worker, dois endereços. pazkidsemacao.com é o site; painel.pazkidsemacao.com é o painel, e o
// Cloudflare Access fica na frente dele inteiro. Internamente o painel vive em /painel; no
// subdomínio, "/criancas" vira "/painel/criancas". No `next dev`, abra http://painel.localhost:3000.

function painelOrigin(req: NextRequest) {
  if (process.env.NODE_ENV === "development") return `${req.nextUrl.protocol}//painel.${req.headers.get("host")}`;
  return "https://painel.pazkidsemacao.com";
}

async function painelHost(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/_next/") || path.startsWith("/__nextjs")) return NextResponse.next();

  // O Access já barrou quem não confirmou o e-mail; conferir aqui fecha qualquer outro caminho até o Worker.
  // Quem tem o e-mail confirmado mas não está em usuarios_painel é barrado pelo layout do painel.
  const token = req.headers.get("cf-access-jwt-assertion") ?? req.cookies.get("CF_Authorization")?.value;
  if (!(await verifyAccess(token))) {
    return new NextResponse("Acesso restrito.", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const url = req.nextUrl.clone();
  url.pathname = path === "/" ? "/painel" : path.startsWith("/painel") ? path : `/painel${path}`;
  return NextResponse.rewrite(url);
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("painel.")) return painelHost(req);

  // Um endereço só: o www redireciona para o domínio raiz.
  if (host.startsWith("www.")) {
    const url = req.nextUrl.clone();
    url.host = host.slice(4);
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // O painel só existe no subdomínio, que é o que o Access protege.
  const path = req.nextUrl.pathname;
  if (path === "/painel" || path.startsWith("/painel/")) {
    const target = new URL(path.replace(/^\/painel/, "") || "/", painelOrigin(req));
    target.search = req.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }
  return NextResponse.next();
}

// Arquivos estáticos não passam pelo middleware.
export const config = { matcher: ["/((?!_next/static|_next/image|brand/|modelos/|icon.png|apple-icon.png).*)"] };
