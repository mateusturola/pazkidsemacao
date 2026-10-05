import { Cabecalho } from "@/components/site/cabecalho";
import { Rodape } from "@/components/site/rodape";
import { campanhasAtivas } from "@/lib/campanhas";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [principal] = await campanhasAtivas();
  return (
    <>
      <Cabecalho campanha={principal ? { slug: principal.slug, nome: principal.nome } : null} />
      <main>{children}</main>
      <Rodape />
    </>
  );
}
