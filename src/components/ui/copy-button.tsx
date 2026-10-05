"use client";

import { useState } from "react";

export function CopyButton({ value, label, className = "btn btn-claro btn-sm" }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API exige contexto seguro; em http na rede local cai no método antigo.
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? "Copiado ✓" : label}
    </button>
  );
}
