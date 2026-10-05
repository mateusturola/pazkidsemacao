/** 18 bytes aleatórios em base64url (24 caracteres): impossível de adivinhar, curto para caber num link. */
export function novoToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_");
}
