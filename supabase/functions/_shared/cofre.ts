// Criptografia dos tokens guardados no banco (ex.: autorização do Google Agenda): AES-256-GCM.
// A chave fica só nos segredos das funções (TOKENS_CHAVE, 32 bytes em base64), nunca no banco nem no app.
// Formato guardado: "v1:" + base64(iv de 12 bytes + texto cifrado). Valor sem "v1:" = antigo, ainda sem criptografia.

const PREFIXO = "v1:";
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

let chave: Promise<CryptoKey | null> | null = null;
function chaveDoCofre() {
  chave ??= (async () => {
    const bruta = Deno.env.get("TOKENS_CHAVE");
    if (!bruta) {
      console.error("TOKENS_CHAVE não configurada: tokens ficam sem criptografia.");
      return null;
    }
    return await crypto.subtle.importKey("raw", deB64(bruta), "AES-GCM", false, ["encrypt", "decrypt"]);
  })();
  return chave;
}

export const cifrado = (v: string) => v.startsWith(PREFIXO);

export async function cifrar(texto: string): Promise<string> {
  const k = await chaveDoCofre();
  if (!k) return texto;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(texto)));
  const junto = new Uint8Array(iv.length + c.length);
  junto.set(iv);
  junto.set(c, iv.length);
  return PREFIXO + b64(junto);
}

export async function decifrar(valor: string): Promise<string> {
  if (!cifrado(valor)) return valor;
  const k = await chaveDoCofre();
  if (!k) throw new Error("TOKENS_CHAVE ausente para decifrar");
  const junto = deB64(valor.slice(PREFIXO.length));
  const texto = await crypto.subtle.decrypt({ name: "AES-GCM", iv: junto.slice(0, 12) }, k, junto.slice(12));
  return new TextDecoder().decode(texto);
}
