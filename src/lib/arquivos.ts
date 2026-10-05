import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Bucket privado: foto de criança só sai pelo Worker, com a regra de autorização aplicada antes.

export function bucket() {
  return getCloudflareContext().env.FILES;
}

const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const FOTO_MAX_BYTES = 8 * 1024 * 1024;

export function extensaoFoto(tipo: string) {
  return TIPOS[tipo] ?? null;
}

export async function apagar(key: string | null | undefined) {
  if (!key) return;
  try {
    await bucket().delete(key);
  } catch (err) {
    console.error("r2 delete", key, err);
  }
}

/** Resposta com o arquivo do R2. `privado` impede cache em proxy e no navegador compartilhado. */
export async function servir(key: string, privado: boolean) {
  const obj = await bucket().get(key);
  if (!obj) return new Response("Não encontrado.", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      // A chave muda quando a foto muda, então o navegador pode guardar por um tempo.
      "cache-control": privado ? "private, max-age=3600" : "public, max-age=3600",
      // SVG de avatar é gerado pelo servidor, mas ainda assim não executa nada se aberto direto.
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
      "x-content-type-options": "nosniff",
    },
  });
}
