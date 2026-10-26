import { contato } from "@/content";

/** Link do WhatsApp comercial com a mensagem já escrita. */
export const linkWhatsApp = (mensagem: string) => `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(mensagem)}`;

/** Nome legível da origem do anúncio (?utm_source=instagram), para o Luiz saber de onde veio o contato. */
export function origemDoAnuncio(search: string) {
  const fonte = (new URLSearchParams(search).get("utm_source") ?? "").toLowerCase();
  if (fonte.startsWith("ig") || fonte.includes("insta")) return "Instagram";
  if (fonte.startsWith("yt") || fonte.includes("youtube")) return "YouTube";
  if (fonte.startsWith("fb") || fonte.includes("facebook")) return "Facebook";
  return "";
}
