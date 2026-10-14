"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import "react-day-picker/style.css";

// Calendário próprio em vez de <input type="date">: o nativo vem no idioma e no visual do
// sistema operacional ("Clear", "Today") e destoa do painel.
// Trabalha com "YYYY-MM-DD" e monta o Date em horário local só para exibir — assim o fuso
// não empurra o dia escolhido para trás.
// Dá para digitar (dd/mm/aaaa) ou escolher no calendário, que tem lista de mês e de ano: para uma data
// de nascimento, ir de mês em mês até 2015 era o que a equipe fazia antes.

function toDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const pad = (n: number) => String(n).padStart(2, "0");

function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const isoParaTexto = (iso: string) =>
  iso ? iso.split("-").reverse().join("/") : "";

/** Só os números, com as barras no lugar: "12032015" vira "12/03/2015". */
function mascara(texto: string) {
  const n = texto.replace(/\D/g, "").slice(0, 8);
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4)].filter(Boolean).join("/");
}

/** "dd/mm/aaaa" válido (31/02 não passa) vira "YYYY-MM-DD"; o resto, null. */
function textoParaIso(texto: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(a, mes - 1, d);
  if (
    a < 1900 ||
    data.getFullYear() !== a ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== d
  )
    return null;
  return toIso(data);
}

type Props = {
  id?: string;
  /** Com `name`, o valor vai no formulário por um campo oculto. */
  name?: string;
  defaultValue?: string;
  /** Controlado: quem usa guarda o valor (o briefing, que salva rascunho e valida antes de enviar). */
  value?: string;
  onChange?: (value: string) => void;
  /** Data de nascimento: o calendário abre nos anos de criança e não aceita data futura. */
  nascimento?: boolean;
};

export function DatePicker({
  id,
  name,
  defaultValue = "",
  value: controlled,
  onChange,
  nascimento = false,
}: Props) {
  const [own, setOwn] = useState(defaultValue);
  const value = controlled ?? own;
  const [texto, setTexto] = useState(isoParaTexto(value));
  const [erro, setErro] = useState<string | null>(null);
  const setValue = (v: string) => {
    setOwn(v);
    onChange?.(v);
  };
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Valor que muda por fora (controlado) aparece no campo.
  useEffect(() => {
    if (controlled !== undefined)
      setTexto((t) =>
        textoParaIso(t) === controlled ? t : isoParaTexto(controlled),
      );
  }, [controlled]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !ref.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  // O reset do formulário não alcança o estado do React; escutar o evento mantém os dois alinhados.
  useEffect(() => {
    const form = ref.current?.closest("form");
    const onReset = () => {
      setOwn(defaultValue);
      setTexto(isoParaTexto(defaultValue));
      setErro(null);
    };
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, [defaultValue]);

  const hoje = toIso(new Date());
  const validar = (t: string) => {
    if (!t) return null;
    const iso = textoParaIso(t);
    if (!iso) return "Data inválida. Use dd/mm/aaaa.";
    if (nascimento && iso > hoje)
      return "A data de nascimento não pode ser no futuro.";
    return null;
  };

  const digitar = (bruto: string) => {
    const t = mascara(bruto);
    setTexto(t);
    const iso = textoParaIso(t);
    // Só grava a data inteira e válida; enquanto a pessoa digita, o campo fica vazio para não salvar meia data.
    if (!t) setValue("");
    else if (iso && !validar(t)) setValue(iso);
    else setValue("");
    if (erro) setErro(validar(t));
  };

  const selected = value ? toDate(value) : undefined;
  const ano = new Date().getFullYear();

  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          value={texto}
          onChange={(e) => digitar(e.target.value)}
          onBlur={() => setErro(validar(texto))}
          aria-invalid={erro ? true : undefined}
          className={`campo pr-12 tabular-nums ${erro ? "border-vermelho/60" : ""}`}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Escolher no calendário"
          aria-expanded={open}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-tinta-2 hover:text-verde"
        >
          <svg
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <rect x="2" y="3" width="12" height="11" rx="1.5" />
            <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
          </svg>
        </button>
      </div>
      {erro && (
        <span className="mt-1 block text-xs text-vermelho-escuro">{erro}</span>
      )}
      {open && (
        <div className="tkd-calendar absolute top-full left-0 z-30 mt-2 rounded-lg border border-linha bg-white p-3 shadow-xl">
          <DayPicker
            mode="single"
            locale={ptBR}
            captionLayout="dropdown"
            // Nascimento: dos 20 anos para cá. Campanha e entrega: um pouco antes e um pouco depois de hoje.
            startMonth={new Date(nascimento ? ano - 20 : ano - 2, 0)}
            endMonth={nascimento ? new Date() : new Date(ano + 2, 11)}
            disabled={nascimento ? { after: new Date() } : undefined}
            selected={selected}
            defaultMonth={
              selected ?? (nascimento ? new Date(ano - 8, 0) : undefined)
            }
            onSelect={(d) => {
              if (d) {
                setValue(toIso(d));
                setTexto(isoParaTexto(toIso(d)));
                setErro(null);
              }
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
