"use client";

import { useRef, useState, useTransition } from "react";
import { enviarFoto } from "@/app/painel/criancas/actions";

const LADO_MAX = 1600;

/**
 * Reduz a foto no próprio aparelho: a do celular tem 3 a 12 MB e subia devagar (ou não subia) no 4G.
 * Redesenhar no canvas também tira os metadados, inclusive a localização GPS da foto da criança.
 * Se o navegador não abrir o formato, devolve null e vai o arquivo original.
 */
async function reduzir(arquivo: File): Promise<File | null> {
  try {
    const imagem = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO_MAX / Math.max(imagem.width, imagem.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imagem.width * escala);
    canvas.height = Math.round(imagem.height * escala);
    canvas.getContext("2d")?.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    imagem.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  }
}

/** Escolheu, já envia: no celular, o segundo botão ("Enviar foto") passava despercebido. */
export function FotoUpload({ criancaId, temFoto }: { criancaId: number; temFoto: boolean }) {
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [previa, setPrevia] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const escolher = (arquivo: File | undefined) => {
    if (!arquivo) return;
    setErro(null);
    setOk(false);
    iniciar(async () => {
      const foto = (await reduzir(arquivo)) ?? arquivo;
      setPrevia(URL.createObjectURL(foto));
      const form = new FormData();
      form.set("foto", foto);
      try {
        const falha = await enviarFoto(criancaId, null, form);
        setErro(falha);
        setOk(!falha);
      } catch {
        setErro("A foto não chegou. Confira a internet e tente de novo.");
      }
      if (input.current) input.current.value = "";
    });
  };

  return (
    <div className="mt-3 space-y-2">
      {previa && enviando && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previa} alt="" className="aspect-square w-full rounded-xl object-cover opacity-60" />
      )}
      <label className={`btn btn-claro btn-sm w-full cursor-pointer ${enviando ? "pointer-events-none opacity-60" : ""}`}>
        {enviando ? "Enviando a foto…" : temFoto ? "Trocar foto" : "Tirar ou escolher foto"}
        <input ref={input} type="file" accept="image/*" className="sr-only" disabled={enviando} onChange={(e) => escolher(e.target.files?.[0])} />
      </label>
      {ok && !enviando && <p className="text-sm text-verde">Foto salva.</p>}
      {erro && <p className="text-sm text-vermelho-escuro">{erro}</p>}
    </div>
  );
}
