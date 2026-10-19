import type { Captacao, Imovel, Transacao } from "./types";

export type LinhaMercado = { t: Transacao; c: Captacao; im: Imovel };
export type OfertaMercado = { c: Captacao; im: Imovel };
export type LinhaRanking = { corretorId: string; vgv: number; alugados: number; captados: number; atendidos: number; vgc: number };

/**
 * De onde vêm os dados agora: demonstração (listas de exemplo) ou login real (banco).
 * No login real do corretor, ranking e estudo de mercado vêm de funções do banco, que somam
 * os números da equipe sem revelar leads, captações ou comissões dos colegas.
 */
export const ctx = {
  modo: "demo" as "demo" | "real",
  imobId: "",
  userId: "",
  papel: null as null | "admin" | "corretor" | "frankkia",
  mercado: null as null | { fechados: LinhaMercado[]; ofertas: OfertaMercado[] },
  ranking: null as null | Record<string, LinhaRanking[]>,
};

/** Participante "resto da divisão" (outros corretores/parceiros), para o corretor ver só a própria parte. */
export const OUTROS_PARTICIPANTES = "__outros";
