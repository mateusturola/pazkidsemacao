"use client";

import { useActionState } from "react";
import { enviarFoto } from "@/app/painel/criancas/actions";

export function FotoUpload({ criancaId, temFoto }: { criancaId: number; temFoto: boolean }) {
  const [erro, action, pending] = useActionState(enviarFoto.bind(null, criancaId), null);
  return (
    <form action={action} className="mt-3 space-y-2">
      <input
        type="file"
        name="foto"
        accept="image/jpeg,image/png,image/webp"
        required
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-linha file:bg-white file:px-3 file:py-1.5 file:text-sm"
      />
      <button className="btn btn-claro btn-sm" disabled={pending}>
        {pending ? "Enviando…" : temFoto ? "Trocar foto" : "Enviar foto"}
      </button>
      {erro && <p className="text-sm text-vermelho">{erro}</p>}
    </form>
  );
}
