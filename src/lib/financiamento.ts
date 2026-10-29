/**
 * Simulação de financiamento imobiliário: só matemática, sem dado externo.
 * A taxa de juros é informada pela pessoa (cada banco tem a sua); seguros (MIP/DFI), tarifas e TR ficam de fora.
 * - SAC: amortização igual todo mês; a parcela começa maior e cai.
 * - Price: parcela fixa do início ao fim; paga mais juros no total.
 */

/** Taxa de referência sugerida no campo (a pessoa ajusta conforme o banco). */
export const TAXA_REFERENCIA = 11.5;
/** Parte da renda que os bancos costumam aceitar comprometer com a parcela. */
export const COMPROMETIMENTO_RENDA = 0.3;

export type Simulacao = {
  financiado: number;
  meses: number;
  taxaMensal: number;
  sac: { primeira: number; ultima: number; juros: number; total: number };
  price: { parcela: number; juros: number; total: number };
  /** Renda mínima para a primeira parcela caber em 30% da renda. */
  rendaSac: number;
  rendaPrice: number;
  itbi: number;
  cartorio: number;
  /** Entrada + ITBI + cartório: o que a pessoa precisa ter em mãos. */
  desembolsoInicial: number;
};

export function simular(p: { valor: number; entrada: number; anos: number; taxaAnual: number; itbiPct: number; cartorioPct: number }): Simulacao | null {
  const financiado = p.valor - p.entrada;
  const meses = Math.round(p.anos * 12);
  if (!(p.valor > 0) || !(financiado > 0) || !(meses > 0)) return null;
  // Taxa efetiva ao ano → taxa ao mês
  const i = Math.pow(1 + Math.max(p.taxaAnual, 0) / 100, 1 / 12) - 1;

  const amort = financiado / meses;
  const jurosSac = i * amort * ((meses * (meses + 1)) / 2);
  const sac = { primeira: amort + financiado * i, ultima: amort * (1 + i), juros: jurosSac, total: financiado + jurosSac };

  const parcela = i === 0 ? financiado / meses : (financiado * i) / (1 - Math.pow(1 + i, -meses));
  const price = { parcela, juros: parcela * meses - financiado, total: parcela * meses };

  const itbi = (p.valor * p.itbiPct) / 100;
  const cartorio = (p.valor * p.cartorioPct) / 100;
  return {
    financiado,
    meses,
    taxaMensal: i * 100,
    sac,
    price,
    rendaSac: sac.primeira / COMPROMETIMENTO_RENDA,
    rendaPrice: parcela / COMPROMETIMENTO_RENDA,
    itbi,
    cartorio,
    desembolsoInicial: p.entrada + itbi + cartorio,
  };
}

/** Comissão de uma venda: total, divisão com parceiro e repasse à imobiliária (valores brutos, antes de impostos). */
export function comissao(p: { valor: number; pct: number; minhaParte: number; repassePct: number }) {
  const total = (p.valor * p.pct) / 100;
  const daVenda = (total * p.minhaParte) / 100;
  const repasse = (daVenda * p.repassePct) / 100;
  return { total, parceiro: total - daVenda, daVenda, repasse, voce: daVenda - repasse };
}
