"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import "react-day-picker/style.css";

// Calendário próprio em vez de <input type="date">: o nativo vem no idioma e no visual do
// sistema operacional ("Clear", "Today") e destoa do painel.
// Trabalha com "YYYY-MM-DD" e monta o Date em horário local só para exibir — assim o fuso
// não empurra o dia escolhido para trás.

function toDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

type Props = {
  id?: string;
  /** Com `name`, o valor vai no formulário por um campo oculto. */
  name?: string;
  defaultValue?: string;
  /** Controlado: quem usa guarda o valor (o briefing, que salva rascunho e valida antes de enviar). */
  value?: string;
  onChange?: (value: string) => void;
};

export function DatePicker({ id, name, defaultValue = "", value: controlled, onChange }: Props) {
  const [own, setOwn] = useState(defaultValue);
  const value = controlled ?? own;
  const setValue = (v: string) => {
    setOwn(v);
    onChange?.(v);
  };
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
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
    const onReset = () => setOwn(defaultValue);
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, [defaultValue]);

  const selected = value ? toDate(value) : undefined;

  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button id={id} type="button" onClick={() => setOpen((o) => !o)} className="campo flex items-center justify-between text-left">
        <span className={value ? "" : "text-tinta-2/50"}>
          {selected ? selected.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Escolher data"}
        </span>
        <svg viewBox="0 0 16 16" className="size-4 text-tinta-2" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="2" y="3" width="12" height="11" rx="1.5" />
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
        </svg>
      </button>
      {open && (
        <div className="tkd-calendar absolute top-full left-0 z-30 mt-2 rounded-lg border border-linha bg-white p-3 shadow-xl">
          <DayPicker
            mode="single"
            locale={ptBR}
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              if (d) setValue(toIso(d));
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
