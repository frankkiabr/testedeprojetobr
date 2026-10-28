/**
 * Cálculo do estudo de mercado, igual no app e na apresentação do proprietário.
 * Improvável = preço médio do m² das amostras × área privativa, ajustado pelas características do imóvel
 * (quando ligado) e decrescido do ajuste do próprio Improvável. Valor de mercado e Urgência saem da mesma base.
 */

export type Caracteristicas = {
  conservacao?: string | null;
  anoConstrucao?: number | null;
  emCondominio?: boolean | null;
  portaria?: string | null;
  infraestrutura?: string | null;
  orientacaoSolar?: string | null;
  mobilia?: string | null;
  finalidade?: string;
};

/** Quanto cada característica mexe no preço (em %). Referência inicial; o corretor decide se usa. */
export const PESOS = {
  conservacao: { reformar: -10, regular: -5, bom: 0, otimo: 3, novo: 5 } as Record<string, number>,
  portaria: { nao: -2, parcial: 0, "24h": 2 } as Record<string, number>,
  infraestrutura: { nao: -2, parcial: 0, completa: 3 } as Record<string, number>,
  orientacaoSolar: { nascente: 2, poente: -1, norte: 1, sul: 0, mista: 0 } as Record<string, number>,
  mobilia: { nao: 0, semi: 1, mobiliado: 3 } as Record<string, number>,
};

const ROTULOS: Record<string, Record<string, string>> = {
  conservacao: { reformar: "precisa de reforma", regular: "conservação regular", bom: "bem conservado", otimo: "ótimo estado", novo: "novo" },
  portaria: { nao: "sem portaria", parcial: "portaria parcial", "24h": "portaria 24 horas" },
  infraestrutura: { nao: "sem infraestrutura", parcial: "infraestrutura parcial", completa: "infraestrutura completa" },
  orientacaoSolar: { nascente: "sol da manhã (nascente)", poente: "sol da tarde (poente)", norte: "face norte", sul: "face sul", mista: "orientação mista" },
  mobilia: { nao: "sem mobília", semi: "semimobiliado", mobiliado: "mobiliado" },
};

/** Cada característica informada que mexe no preço, com o seu %. */
export function variaveis(c: Caracteristicas): { rotulo: string; pct: number }[] {
  const lista: { rotulo: string; pct: number }[] = [];
  const add = (grupo: keyof typeof PESOS, v?: string | null) => {
    if (!v) return;
    const pct = PESOS[grupo][v];
    if (pct) lista.push({ rotulo: ROTULOS[grupo][v] ?? v, pct });
  };
  add("conservacao", c.conservacao);
  if (c.anoConstrucao) {
    const idade = new Date().getFullYear() - c.anoConstrucao;
    if (idade > 30) lista.push({ rotulo: `construído há ${idade} anos`, pct: -5 });
    else if (idade > 15) lista.push({ rotulo: `construído há ${idade} anos`, pct: -2 });
    else if (idade <= 5) lista.push({ rotulo: idade <= 1 ? "construção recente" : `construído há ${idade} anos`, pct: 3 });
  }
  // Portaria e infraestrutura só contam para imóvel em condomínio
  if (c.emCondominio !== false) {
    add("portaria", c.portaria);
    add("infraestrutura", c.infraestrutura);
  }
  add("orientacaoSolar", c.orientacaoSolar);
  // Mobília pesa mais no aluguel
  if (c.mobilia) {
    const pct = (PESOS.mobilia[c.mobilia] ?? 0) * (c.finalidade === "locacao" ? 2 : 1);
    if (pct) lista.push({ rotulo: ROTULOS.mobilia[c.mobilia], pct });
  }
  return lista;
}

/** Soma dos ajustes por característica (limitada a ±25%). */
export const ajusteCaracteristicas = (c: Caracteristicas) =>
  Math.max(-25, Math.min(25, variaveis(c).reduce((t, v) => t + v.pct, 0)));

export function calcularValores(o: {
  amostras: { valor: number; area: number }[];
  area: number;
  ajusteImprovavel: number;
  ajusteMercado: number;
  ajusteUrgencia: number;
  usarVariaveis: boolean;
  caracteristicas: Caracteristicas;
}) {
  const m2s = o.amostras.filter((s) => s.valor > 0 && s.area > 0).map((s) => s.valor / s.area);
  if (!m2s.length) return null;
  const m2Medio = m2s.reduce((t, x) => t + x, 0) / m2s.length;
  const pctVariaveis = o.usarVariaveis ? ajusteCaracteristicas(o.caracteristicas) : 0;
  const base = m2Medio * o.area * (1 + pctVariaveis / 100);
  const valor = (pct: number) => base * (1 - pct / 100);
  return {
    m2Medio,
    m2Min: Math.min(...m2s),
    m2Max: Math.max(...m2s),
    pctVariaveis,
    improvavel: valor(o.ajusteImprovavel),
    mercado: valor(o.ajusteMercado),
    urgencia: valor(o.ajusteUrgencia),
  };
}
