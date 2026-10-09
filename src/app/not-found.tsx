import Image from "next/image";
import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="grid min-h-dvh place-items-center bg-creme px-4 text-center">
      <div>
        <Image src="/brand/pazkids-em-acao-horizontal-400.webp" alt="Paz Kids em Ação" width={400} height={163} className="mx-auto h-20 w-auto" />
        <h1 className="mt-6 text-3xl font-semibold">Página não encontrada</h1>
        <Link href="/" className="btn btn-primario mt-6">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
