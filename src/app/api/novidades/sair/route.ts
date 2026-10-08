import { auditar } from "@/lib/auditoria";
import { descadastrar } from "@/lib/novidades";

/**
 * Descadastro em um clique (RFC 8058): o Gmail e o Yahoo mandam um POST para o endereço do cabeçalho
 * List-Unsubscribe quando a pessoa toca em "cancelar inscrição". Sem tela, sem confirmação.
 */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (token && (await descadastrar(token))) await auditar("email", "saiu da lista de novidades", "inscricao", null);
  return new Response(null, { status: 200 });
}
