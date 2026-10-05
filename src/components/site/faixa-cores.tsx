// As sete cores das letras do logo, na ordem em que aparecem. Usada como fio divisor, nunca como fundo.
const CORES = ["#23a332", "#c8102e", "#0a84c2", "#7b2fa0", "#d81b8f", "#e8620c", "#ffc614"];

export function FaixaCores({ className = "h-1.5" }: { className?: string }) {
  return (
    <div className={`flex ${className}`} aria-hidden>
      {CORES.map((c) => (
        <span key={c} className="flex-1" style={{ background: c }} />
      ))}
    </div>
  );
}
