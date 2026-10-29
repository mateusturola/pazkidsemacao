import { SITE } from "@/content/site";
import { formatBRL } from "@/lib/money";

// Pix "copia e cola" (BR Code estático do Banco Central) com a chave do projeto, o valor e o número do
// pedido. O app do banco abre com tudo preenchido: o doador só confere e confirma, sem digitar valor.
// Formato EMV: cada campo é id (2 dígitos) + tamanho (2 dígitos) + valor, e o fim é um CRC16.

const campo = (id: string, valor: string) => `${id}${String(valor.length).padStart(2, "0")}${valor}`;

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), o que o Banco Central pede no campo 63. */
export function crc16(texto: string) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Só letra, número e espaço, sem acento e em maiúscula: o que todo app de banco lê. */
const simples = (s: string, max: number) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .slice(0, max);

export function pixCopiaECola({ chave, valorCentavos, nome, cidade, identificador }: { chave: string; valorCentavos: number; nome: string; cidade: string; identificador: string }) {
  const corpo =
    campo("00", "01") +
    campo("26", campo("00", "br.gov.bcb.pix") + campo("01", chave)) +
    campo("52", "0000") +
    campo("53", "986") +
    campo("54", (valorCentavos / 100).toFixed(2)) +
    campo("58", "BR") +
    campo("59", simples(nome, 25)) +
    campo("60", simples(cidade, 15)) +
    // O identificador aparece no extrato: é por ele que a equipe acha o pedido do comprovante.
    campo("62", campo("05", simples(identificador, 25).replace(/ /g, ""))) +
    "6304";
  return corpo + crc16(corpo);
}

/** O Pix de um pedido: a chave do projeto, o valor exato e o número do pedido no identificador. */
export function pixDoPedido(p: { id: number; valor: number | null }) {
  return pixCopiaECola({ chave: SITE.pix.chave, valorCentavos: p.valor ?? 0, nome: "Igreja da Paz Sao Paulo", cidade: "Sao Paulo", identificador: `PKA${p.id}` });
}

/** WhatsApp do projeto com a mensagem do comprovante pronta: a equipe já sabe de qual pedido é. */
export function whatsComprovante(p: { id: number; valor: number | null }, campanha: string, nome: string) {
  const texto = `Olá! Sou ${nome.split(" ")[0]} e fiz o Pix de ${formatBRL(p.valor)} da ${campanha}, pedido nº ${p.id}. Segue o comprovante:`;
  return `${SITE.whatsapp.link}?text=${encodeURIComponent(texto)}`;
}
