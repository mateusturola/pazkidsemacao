"use client";

import { useActionState, useEffect, useRef } from "react";

type Action = (prev: string | null, form: FormData) => Promise<string | null>;

/**
 * Formulário ligado a uma server action que devolve uma mensagem (erro ou "Salvo.").
 * `resetOnSuccess` limpa os campos quando a action devolve null — para formulários de "adicionar".
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [message, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && message === null && resetOnSuccess) ref.current?.reset();
    wasPending.current = pending;
  }, [pending, message, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {message && (
        <p className={`text-sm ${message === "Salvo." ? "text-emerald-700" : "text-vermelho"}`} role="status">
          {message}
        </p>
      )}
    </form>
  );
}
