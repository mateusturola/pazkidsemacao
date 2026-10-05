// Datas puras trafegam e ficam no banco como "YYYY-MM-DD". `new Date("2026-08-02")` é meia-noite UTC,
// que no Brasil ainda é dia 1º — por isso elas nunca viram Date no servidor.

export function formatIsoDate(value: string) {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

// O servidor costuma rodar em UTC: às 22h de Brasília ele já está no dia seguinte.
export function todayIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatDateTime(date: Date) {
  return dateTime.format(date);
}

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatShortDate(date: Date) {
  return shortDate.format(date);
}
