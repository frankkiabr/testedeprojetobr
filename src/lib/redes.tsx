import type { ComponentType } from "react";
import { Facebook, Globe, Instagram, Linkedin, Youtube } from "lucide-react";

import type { RedeChave, Redes } from "@/data/types";

/** Redes sociais do corretor (Configurações → Meu perfil), mostradas na página pública dele. */
export type { RedeChave, Redes };

function TikTokIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
    </svg>
  );
}

export const REDES: {
  chave: RedeChave;
  nome: string;
  base: string;
  exemplo: string;
  Icone: ComponentType<{ className?: string }>;
}[] = [
  {
    chave: "instagram",
    nome: "Instagram",
    base: "https://instagram.com/",
    exemplo: "@seuperfil",
    Icone: Instagram,
  },
  {
    chave: "facebook",
    nome: "Facebook",
    base: "https://facebook.com/",
    exemplo: "seuperfil",
    Icone: Facebook,
  },
  {
    chave: "linkedin",
    nome: "LinkedIn",
    base: "https://linkedin.com/in/",
    exemplo: "seuperfil",
    Icone: Linkedin,
  },
  {
    chave: "tiktok",
    nome: "TikTok",
    base: "https://tiktok.com/@",
    exemplo: "@seuperfil",
    Icone: TikTokIcon,
  },
  {
    chave: "youtube",
    nome: "YouTube",
    base: "https://youtube.com/@",
    exemplo: "@seucanal",
    Icone: Youtube,
  },
  { chave: "site", nome: "Site", base: "https://", exemplo: "www.seusite.com.br", Icone: Globe },
];

/** "@fulano", "fulano", "instagram.com/fulano" ou o link completo → link completo (https). Vazio → "". */
export function linkDaRede(chave: RedeChave, valor: string) {
  const v = valor.trim().replace(/\s+/g, "");
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v.replace(/^http:\/\//i, "https://");
  // Site: qualquer endereço; redes: só quando vier com o caminho (ex.: instagram.com/fulano). "@fulano.imoveis" é usuário.
  if (chave === "site" || (!v.startsWith("@") && v.includes("/"))) return `https://${v.replace(/^\/+/, "")}`;
  const rede = REDES.find((r) => r.chave === chave)!;
  return rede.base + v.replace(/^@/, "");
}

/** Link completo → como o corretor costuma escrever (para mostrar no campo). */
export function textoDaRede(chave: RedeChave, link?: string) {
  if (!link) return "";
  const rede = REDES.find((r) => r.chave === chave)!;
  if (chave !== "site" && link.startsWith(rede.base)) {
    const nome = link.slice(rede.base.length).replace(/\/$/, "");
    return chave === "instagram" || chave === "tiktok" || chave === "youtube" ? `@${nome}` : nome;
  }
  return link.replace(/^https:\/\//, "");
}

/** Só as redes preenchidas, já como links. */
export function redesLimpas(entrada: Partial<Record<RedeChave, string>>): Redes {
  const r: Redes = {};
  for (const { chave } of REDES) {
    const l = linkDaRede(chave, entrada[chave] ?? "");
    if (l) r[chave] = l.slice(0, 300);
  }
  return r;
}
