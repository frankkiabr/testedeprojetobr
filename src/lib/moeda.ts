/** Valores em R$ nos campos: a pessoa digita só números e aparece 1.000.000,00 (os dois últimos dígitos são os centavos). */

const fmt2 = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function mascaraMoeda(s: string) {
  const d = s.replace(/\D/g, "").replace(/^0+/, "").slice(0, 15);
  return d ? fmt2(Number(d) / 100) : "";
}

/** Número → texto do campo de R$ (vazio quando não há valor). */
export const moeda = (n?: number | null) => (n ? fmt2(n) : "");

/** Texto do campo ("1.234,56") → número (0 quando vazio). */
export const lerMoeda = (s: string) => Number(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;

/** Texto de percentual ("6,5") → número. */
export const lerPct = (s: string) => Number(s.replace(",", ".").replace(/[^\d.]/g, "")) || 0;

export const reaisInteiros = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const reaisCentavos = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
