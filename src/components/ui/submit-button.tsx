"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn btn-escuro", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? (pendingText ?? "Salvando…") : children}
    </button>
  );
}
