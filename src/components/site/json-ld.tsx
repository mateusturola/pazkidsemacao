/** Dados estruturados. O "<" escapado impede que um texto vindo do banco feche a tag <script>. */
export function JsonLd({ dados }: { dados: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, "\\u003c") }} />;
}
