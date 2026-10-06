// Ícones de traço arredondado, como pede o manual (verde, traço, cantos redondos). A estrela é o
// único ícone preenchido, em amarelo, e vem do arquivo da marca (public/natal/simbolos/estrela.svg).

type P = { className?: string };

function Svg({ className = "size-6", children }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

export const IconeSacola = (p: P) => (
  <Svg {...p}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    <path d="M10 12.5c1.2 1 2.8 1 4 0" />
  </Svg>
);

export const IconeCrianca = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="5.5" r="2.3" />
    <path d="M5.5 9.5 9 12v8M18.5 9.5 15 12v8M9 12h6M12 16v4" />
  </Svg>
);

export const IconePresente = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="9" width="16" height="11" rx="1.5" />
    <path d="M3 9h18M12 9v11" />
    <path d="M12 9c-1.5-3-5-3.5-5-1.2C7 9 9.5 9 12 9Zm0 0c1.5-3 5-3.5 5-1.2C17 9 14.5 9 12 9Z" />
  </Svg>
);

export const IconeLocal = (p: P) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
);

export const IconeCalendario = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

export const IconeCartao = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10.5h18M7 15h3" />
  </Svg>
);

export const IconeCoracao = (p: P) => (
  <Svg {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
  </Svg>
);

export const IconeMaos = (p: P) => (
  <Svg {...p}>
    <path d="M4 13.5 8 10l3 2.5h3a1.5 1.5 0 0 1 0 3h-3" />
    <path d="M4 18.5h2.5l5 2 7.5-4a1.6 1.6 0 0 0-1.6-2.7L13.5 15.5" />
    <path d="M14.5 6.5c.6-1.4 3.2-1.4 3.2.7 0 1.9-3.2 3.6-3.2 3.6s-3.2-1.7-3.2-3.6c0-2.1 2.6-2.1 3.2-.7Z" />
  </Svg>
);

export const IconeCheck = (p: P) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const IconeSeta = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const IconeLivro = (p: P) => (
  <Svg {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5v-12ZM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 0 1.5-1.5v-12Z" />
  </Svg>
);

export const IconeEstrelaContorno = (p: P) => (
  <Svg {...p}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
  </Svg>
);

export const IconePix = (p: P) => (
  <Svg {...p}>
    <path d="m12 3 3.5 3.5-3.5 3.5-3.5-3.5L12 3ZM12 14l3.5 3.5L12 21l-3.5-3.5L12 14ZM3 12l3.5-3.5L10 12l-3.5 3.5L3 12ZM14 12l3.5-3.5L21 12l-3.5 3.5L14 12Z" />
  </Svg>
);
