/**
 * Endereço e mapa com serviços gratuitos:
 * - ViaCEP: preenche rua, bairro, cidade e estado a partir do CEP.
 * - Nominatim (OpenStreetMap): encontra a posição do endereço no mapa.
 *   Regra de uso deles: no máximo 1 busca por segundo e nada de busca a cada letra digitada,
 *   por isso só buscamos quando a pessoa clica em "Localizar no mapa".
 */
export type EnderecoBusca = { logradouro: string; numero?: string; bairro?: string; cidade: string; uf: string; cep?: string };
export type Ponto = { lat: number; lng: number };

export async function buscarCep(cep: string): Promise<Omit<EnderecoBusca, "numero" | "cep"> | null> {
  const n = cep.replace(/\D/g, "");
  if (n.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${n}/json/`);
    const d = (await r.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
    if (d.erro || !d.localidade) return null;
    return { logradouro: d.logradouro ?? "", bairro: d.bairro ?? "", cidade: d.localidade, uf: d.uf ?? "" };
  } catch {
    return null;
  }
}

let ultimaBusca = 0;
async function nominatim(params: Record<string, string>): Promise<Ponto | null> {
  // Respeita o limite de 1 busca por segundo
  const espera = ultimaBusca + 1100 - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaBusca = Date.now();
  const q = new URLSearchParams({ format: "json", limit: "1", countrycodes: "br", "accept-language": "pt-BR", ...params });
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${q}`);
    const d = (await r.json()) as { lat: string; lon: string }[];
    return d[0] ? { lat: Number(d[0].lat), lng: Number(d[0].lon) } : null;
  } catch {
    return null;
  }
}

/** Posição do endereço no mapa. Tenta o endereço completo; se não achar, a rua; por fim, o bairro. */
export async function localizar(e: EnderecoBusca | string): Promise<Ponto | null> {
  if (typeof e === "string") return e.trim() ? nominatim({ q: e.trim() }) : null;
  const rua = [e.logradouro, e.numero].filter(Boolean).join(", ");
  return (
    (await nominatim({ street: rua, city: e.cidade, state: e.uf, ...(e.cep ? { postalcode: e.cep } : {}) })) ??
    (await nominatim({ street: e.logradouro, city: e.cidade, state: e.uf })) ??
    (e.bairro ? await nominatim({ q: `${e.bairro}, ${e.cidade}, ${e.uf}` }) : null)
  );
}

/** Link para abrir o local no Google Maps (rotas, Street View). */
export const linkGoogleMaps = (p: Ponto | null, texto?: string) =>
  p ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto ?? "")}`;
