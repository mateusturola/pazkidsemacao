import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "@/lib/env";

// Login do painel = Cloudflare Access. O Access fica na frente de painel.pazkidsemacao.com, manda
// um código para o e-mail e só deixa passar quem provar ser dono dele; cada requisição chega com um
// JWT assinado por ele. Conferimos esse JWT aqui também porque o Access protege o domínio, não o
// Worker: qualquer caminho que chegue ao Worker sem passar pelo Access seria uma porta aberta.
// Este arquivo só responde "qual e-mail o Access confirmou"; quem decide se esse e-mail entra é a
// tabela usuarios_painel (src/lib/auth.ts).

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwks(teamDomain: string) {
  let set = jwksCache.get(teamDomain);
  if (!set) {
    set = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    jwksCache.set(teamDomain, set);
  }
  return set;
}

export async function verifyAccess(token: string | null | undefined): Promise<string | null> {
  // Só o `next dev` na própria máquina dispensa o Access. O build de produção sempre roda com
  // NODE_ENV=production, então essa porta não existe no Worker.
  if (process.env.NODE_ENV === "development") return (env("ADMIN_EMAIL") || "dev@local").toLowerCase();

  const teamDomain = env("ACCESS_TEAM_DOMAIN").replace(/\/$/, "");
  const aud = env("ACCESS_AUD");
  if (!token || !teamDomain || !aud) return null;

  try {
    const { payload } = await jwtVerify(token, jwks(teamDomain), { issuer: teamDomain, audience: aud });
    return typeof payload.email === "string" && payload.email ? payload.email.toLowerCase() : null;
  } catch {
    return null;
  }
}
