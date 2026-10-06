import { servir } from "@/lib/arquivos";

// Imagens dos posts do Instagram, copiadas para o R2 pelo cron (a URL do Instagram expira).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!/^\d+$/.test(id)) return new Response("Não encontrado.", { status: 404 });
  return servir(`instagram/${id}.jpg`, false);
}
