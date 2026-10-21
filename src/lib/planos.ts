/** Plano anual: 12 meses pelo preço de 10 (cobrado uma vez por ano). */
export const MESES_PAGOS_NO_ANUAL = 10;
export const DESCONTO_ANUAL = Math.round((1 - MESES_PAGOS_NO_ANUAL / 12) * 100); // 17%

export type Ciclo = "mensal" | "anual";

/** "1.800" (texto do site) ou 1800 → número. */
export const valorPlano = (v: string | number) =>
  typeof v === "number" ? v : Number(v.replace(/\./g, "").replace(",", ".")) || 0;

/** Total cobrado por ano no plano anual. */
export const totalAnual = (mensal: number) => mensal * MESES_PAGOS_NO_ANUAL;

/** Quanto o plano anual sai por mês (para comparar com o mensal). */
export const mensalNoAnual = (mensal: number) => Math.round(totalAnual(mensal) / 12);

export const reais = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
