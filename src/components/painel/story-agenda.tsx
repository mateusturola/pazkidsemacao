"use client";

import { useEffect, useRef, useState } from "react";
import type { PontoAgenda } from "@/lib/agenda";

const L = 1080;
const A = 1920;
const TINTA = "#1b1633";
const TINTA_2 = "#4f4a66";
const AMARELO = "#ffc20e";
const PAPEL = "#fffbef";
// As mesmas cores por dia do site.
const COR_DIA: Record<string, string> = { Terça: "#6b3fa0", Quarta: "#e3262f", Quinta: "#1f74c9", Sexta: "#e8830c", Sábado: "#2c9a47" };
const corDia = (d: string) => COR_DIA[d] ?? TINTA;

function fonte(variavel: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(variavel).trim() || "sans-serif";
}

function carregarImagem(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

/** Quebra o texto em linhas que cabem na largura, para endereço comprido não sair da arte. */
function linhas(ctx: CanvasRenderingContext2D, texto: string, largura: number) {
  const palavras = texto.split(" ");
  const out: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > largura && atual) {
      out.push(atual);
      atual = p;
    } else atual = teste;
  }
  if (atual) out.push(atual);
  return out;
}

async function desenhar(canvas: HTMLCanvasElement, agenda: PontoAgenda[]) {
  const titulo = fonte("--font-fredoka");
  const texto = fonte("--font-nunito");
  // O canvas não espera a fonte da página: sem isso, a primeira arte sai na fonte do sistema.
  // Carrega só a principal: a reserva do next/font aponta para uma fonte local (Arial) que nem
  // todo aparelho tem, e a falha dela derrubaria o carregamento todo.
  const principal = (f: string) => f.split(",")[0];
  await Promise.allSettled([
    document.fonts.load(`700 80px ${principal(titulo)}`),
    document.fonts.load(`600 40px ${principal(titulo)}`),
    document.fonts.load(`600 30px ${principal(texto)}`),
  ]);
  const logo = await carregarImagem("/brand/pazkids-em-acao-480.webp");
  const ctx = canvas.getContext("2d")!;
  const dias = [...new Set(agenda.map((p) => p.dia))];
  const margem = 80;
  const largura = L - margem * 2;
  // Na arte, "São Paulo" no fim de cada endereço só ocupa espaço: quase tudo é em São Paulo.
  const endereco = (p: PontoAgenda) => [p.endereco.replace(/,\s*São Paulo$/i, ""), p.complemento].filter(Boolean).join(" · ");

  // A mesma rotina mede e desenha, para a medida nunca divergir do desenho.
  const lista = (s: number, y0: number, desenhar: boolean) => {
    let y = y0;
    for (const d of dias) {
      if (desenhar) {
        ctx.fillStyle = corDia(d);
        ctx.font = `700 ${56 * s}px ${titulo}`;
        ctx.fillText(d.toUpperCase(), margem, y + 52 * s);
      }
      y += 74 * s;
      for (const p of agenda.filter((x) => x.dia === d)) {
        // Uma coluna só para a hora: "20:00" é mais largo que "17:00" e desalinharia os nomes.
        ctx.font = `700 ${50 * s}px ${titulo}`;
        const wHora = Math.max(...agenda.map((x) => ctx.measureText(`${x.hora}  `).width));
        ctx.font = `600 ${50 * s}px ${titulo}`;
        // Nome comprido quebra a linha alinhado depois da hora, em vez de ser cortado.
        const nomes = linhas(ctx, p.nome, largura - wHora);
        nomes.forEach((n, k) => {
          y += (k ? 56 : 54) * s;
          if (!desenhar) return;
          if (k === 0) {
            ctx.font = `700 ${50 * s}px ${titulo}`;
            ctx.fillStyle = corDia(d);
            ctx.fillText(p.hora, margem, y);
          }
          ctx.font = `600 ${50 * s}px ${titulo}`;
          ctx.fillStyle = TINTA;
          ctx.fillText(n, margem + wHora, y);
        });
        y += 6 * s;
        ctx.font = `600 ${36 * s}px ${texto}`;
        for (const l of linhas(ctx, endereco(p), largura - wHora)) {
          y += 46 * s;
          if (desenhar) {
            ctx.fillStyle = TINTA_2;
            ctx.fillText(l, margem + wHora, y);
          }
        }
        y += 26 * s;
      }
      y += 22 * s;
    }
    return y - y0;
  };

  // Cabeçalho compacto: o espaço é da agenda.
  const fimTopo = 330;
  const rodape = 150;
  const espaco = A - rodape - 40 - (fimTopo + 30);
  // Maior escala que cabe: agenda curta fica grande, agenda longa diminui até caber.
  let escala = 1.4;
  while (escala > 0.5 && lista(escala, 0, false) > espaco) escala -= 0.02;

  ctx.fillStyle = PAPEL;
  ctx.fillRect(0, 0, L, A);

  // Faixa amarela atrás do título, como na arte que a equipe já usa.
  ctx.fillStyle = AMARELO;
  ctx.fillRect(0, 128, L, 128);
  const lh = 270;
  const lw = (logo.width / logo.height) * lh;
  ctx.drawImage(logo, margem - 24, 40, lw, lh);
  ctx.fillStyle = TINTA;
  ctx.textAlign = "right";
  ctx.font = `700 76px ${titulo}`;
  ctx.fillText("AGENDA", L - margem, 112);
  ctx.fillText("SEMANAL", L - margem, 220);
  ctx.textAlign = "left";

  // Sobrou espaço? A lista desce um pouco, em vez de deixar um buraco antes do rodapé.
  const h = lista(escala, 0, false);
  lista(escala, fimTopo + 30 + Math.min(80, (espaco - h) / 2), true);

  // Rodapé: o endereço da página com mapa e rota (o link vai no adesivo do story).
  ctx.fillStyle = TINTA;
  ctx.fillRect(0, A - 150, L, 150);
  ctx.textAlign = "center";
  ctx.fillStyle = AMARELO;
  ctx.font = `700 50px ${titulo}`;
  ctx.fillText("pazkidsemacao.com/agenda", L / 2, A - 80);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 30px ${texto}`;
  ctx.fillText("Endereço e rota de cada encontro", L / 2, A - 36);
  ctx.textAlign = "left";
}

export function StoryAgenda({ agenda }: { agenda: PontoAgenda[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pronto, setPronto] = useState(false);
  const [podeCompartilhar, setPodeCompartilhar] = useState(false);

  useEffect(() => {
    if (!canvas.current) return;
    desenhar(canvas.current, agenda).then(() => setPronto(true));
    setPodeCompartilhar(typeof navigator.canShare === "function");
  }, [agenda]);

  const arquivo = () =>
    new Promise<File>((ok) => canvas.current!.toBlob((b) => ok(new File([b!], "agenda-semanal-paz-kids-em-acao.png", { type: "image/png" })), "image/png"));

  async function baixar() {
    const f = await arquivo();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // No celular, compartilhar abre direto o Instagram (ou o WhatsApp) com a imagem.
  async function compartilhar() {
    const f = await arquivo();
    if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f] }).catch(() => {});
    else await baixar();
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <canvas ref={canvas} width={L} height={A} className="w-full max-w-[360px] rounded-xl border border-linha shadow-sm" />
      <div className="space-y-3">
        <button type="button" onClick={baixar} disabled={!pronto} className="btn btn-primario w-full sm:w-auto">
          Baixar imagem
        </button>
        {podeCompartilhar && (
          <button type="button" onClick={compartilhar} disabled={!pronto} className="btn btn-claro w-full sm:w-auto">
            Compartilhar
          </button>
        )}
        <p className="max-w-xs text-sm text-tinta-2">
          No Instagram, use o adesivo de link com <strong>pazkidsemacao.com/agenda</strong>: lá cada encontro tem mapa e rota.
        </p>
      </div>
    </div>
  );
}
