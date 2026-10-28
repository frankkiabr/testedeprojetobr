// Lê um anúncio do VivaReal, do Zap ou da OLX a partir do link colado pelo corretor (Estudo de mercado → Avaliações).
// Só abre a página que o próprio corretor escolheu, uma por vez, e devolve preço, área, quartos, banheiros, vagas,
// bairro, cidade e foto para ele conferir antes de salvar. Se o portal bloquear a leitura, aproveita o que o
// próprio link traz (ex.: "...-73m2-venda-RS930000-id-...").
import { cors, json, usuarioDoPedido } from "../_shared/comum.ts";

const PORTAIS = ["vivareal.com.br", "zapimoveis.com.br", "olx.com.br"];
const NAVEGADOR =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

type Anuncio = {
  portal: string;
  url: string;
  titulo?: string;
  finalidade?: "venda" | "locacao";
  valor?: number;
  area?: number;
  quartos?: number;
  banheiros?: number;
  vagas?: number;
  bairro?: string;
  cidade?: string;
  uf?: string;
  foto?: string;
  completo: boolean;
  /** Como foi a leitura da página (código HTTP do portal ou "erro"), para diagnóstico. */
  leitura?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const user = await usuarioDoPedido(req);
    if (!user) return json({ erro: "NAO_AUTENTICADO" }, 401);
    const { url } = await req.json();
    let u: URL;
    try {
      u = new URL(String(url).trim());
    } catch {
      return json({ erro: "LINK_INVALIDO" }, 400);
    }
    const portal = PORTAIS.find((p) => u.hostname === p || u.hostname.endsWith(`.${p}`));
    if (u.protocol !== "https:" || !portal) return json({ erro: "PORTAL_NAO_SUPORTADO" }, 400);
    u.hash = "";

    const a: Anuncio = { portal, url: u.toString(), completo: false, ...doLink(u) };
    try {
      const r = await fetch(u, {
        headers: { "User-Agent": NAVEGADOR, "Accept-Language": "pt-BR,pt;q=0.9", Accept: "text/html" },
        signal: AbortSignal.timeout(10_000),
      });
      a.leitura = String(r.status);
      if (r.ok) {
        const html = (await r.text()).slice(0, 3_000_000);
        Object.assign(a, Object.fromEntries(Object.entries(daPagina(html)).filter(([, v]) => v !== undefined && v !== "")));
        a.completo = !!(a.valor && a.area);
      }
    } catch (e) {
      a.leitura = "erro";
      console.error("Leitura do anúncio", portal, e);
    }
    if (!a.valor && !a.area) return json({ erro: "NAO_LIDO" }, 422);
    return json(a);
  } catch (e) {
    console.error(e);
    return json({ erro: "FALHA" }, 500);
  }
});

const numero = (s?: string | null) => {
  if (!s) return undefined;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** O que o próprio endereço do anúncio informa (VivaReal e Zap usam o mesmo padrão). */
function doLink(u: URL): Partial<Anuncio> {
  const p = decodeURIComponent(u.pathname).toLowerCase();
  return {
    finalidade: /(^|[-/])(aluguel|locacao)([-/]|$)/.test(p) ? "locacao" : /(^|[-/])venda([-/]|$)/.test(p) ? "venda" : undefined,
    area: numero(p.match(/-(\d+(?:[.,]\d+)?)m2(?:-|\/|$)/)?.[1]),
    quartos: numero(p.match(/-(\d+)-quartos?-/)?.[1]),
    vagas: numero(p.match(/-(\d+)-vagas?-/)?.[1]),
    valor: numero(p.match(/-rs(\d+)(?:-|\/|$)/)?.[1]),
    // VivaReal: "...-batista-campos-bairros-belem-com-garagem-73m2-..." → bairro e cidade
    ...doLocal(p),
  };
}

const nome = (s: string) =>
  s
    .split("-")
    .map((w) => (["de", "da", "do", "das", "dos", "e"].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

function doLocal(p: string): Partial<Anuncio> {
  const m = p.match(/quartos?-(.+?)-bairros-(.+?)-(?:com-|\d+m2)/) ?? p.match(/-(?:residencial|comercial)-(.+?)-bairros-(.+?)-(?:com-|\d+m2)/);
  return m ? { bairro: nome(m[1]), cidade: nome(m[2]) } : {};
}

/** Dados organizados da página (schema.org e rótulos de acessibilidade usados pelos portais). */
function daPagina(html: string): Partial<Anuncio> {
  const out: Partial<Anuncio> = {};
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      for (const o of Array.isArray(j) ? j : [j]) {
        const oferta = Array.isArray(o.offers) ? o.offers[0] : o.offers;
        if (oferta?.price && !out.valor) out.valor = Number(oferta.price) || undefined;
        if (o.floorSize?.value && !out.area) out.area = Number(o.floorSize.value) || undefined;
        if (o.numberOfRooms && !out.quartos) out.quartos = Number(o.numberOfRooms) || undefined;
        if (o.numberOfBathroomsTotal && !out.banheiros) out.banheiros = Number(o.numberOfBathroomsTotal) || undefined;
        const foto = Array.isArray(o.image) ? o.image[0] : typeof o.image === "string" ? o.image : undefined;
        if (foto && !out.foto) out.foto = foto;
        // "Imóvel em Batista Campos, Belém - PA"
        const lugar = typeof o.name === "string" ? o.name.match(/em\s+(.+?),\s*(.+?)\s*-\s*([A-Z]{2})\s*$/) : null;
        if (lugar && !out.bairro) Object.assign(out, { bairro: lugar[1], cidade: lugar[2], uf: lugar[3] });
        if (o.address?.addressLocality && !out.cidade) out.cidade = o.address.addressLocality;
      }
    } catch {
      /* bloco inválido */
    }
  }
  const rotulo = (nome: string) => {
    const i = html.indexOf(`aria-label="${nome}"`);
    if (i < 0) return undefined;
    const texto = html.slice(i, i + 1200).replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ");
    return numero(texto.match(/(\d+(?:[.,]\d+)?)/)?.[1]);
  };
  out.area ??= rotulo("floorSize");
  out.quartos ??= rotulo("numberOfRooms");
  out.banheiros ??= rotulo("numberOfBathroomsTotal");
  out.vagas ??= rotulo("numberOfParkingSpaces");
  const titulo = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (titulo) out.titulo = titulo.replace(/\s*[-|]\s*(Viva Real|ZAP Imóveis|OLX)\s*$/i, "").trim().slice(0, 160);
  return out;
}
