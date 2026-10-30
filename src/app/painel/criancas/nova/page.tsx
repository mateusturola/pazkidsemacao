import type { Metadata } from "next";
import Link from "next/link";
import { CriancaForm } from "@/components/painel/crianca-form";
import { campanhaAberta, campanhasAtivas } from "@/lib/campanhas";
import { criarCrianca } from "../actions";

export const metadata: Metadata = { title: "Nova criança" };

export default async function NovaCriancaPage() {
  const abertas = (await campanhasAtivas()).filter(campanhaAberta).map((c) => ({ id: c.id, nome: c.nome }));
  return (
    <div className="max-w-3xl">
      <Link href="/criancas" className="text-sm text-tinta-2 hover:text-tinta">
        ← Crianças
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">Nova criança</h1>
      <p className="mt-1 text-tinta-2">Foto e avatar se colocam depois de salvar.</p>
      <div className="cartao mt-6 p-6">
        <CriancaForm action={criarCrianca} botao="Cadastrar" campanhas={abertas} />
      </div>
    </div>
  );
}
