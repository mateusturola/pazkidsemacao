import type { Metadata } from "next";
import Link from "next/link";
import { CampanhaForm } from "@/components/painel/campanha-form";
import { requireAdmin } from "@/lib/auth";
import { criarCampanha } from "../actions";

export const metadata: Metadata = { title: "Nova campanha" };

export default async function NovaCampanhaPage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <Link href="/campanhas" className="text-sm text-tinta-2 hover:text-tinta">
        ← Campanhas
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">Nova campanha</h1>
      <div className="cartao mt-6 p-6">
        <CampanhaForm action={criarCampanha} botao="Criar campanha" />
      </div>
    </div>
  );
}
