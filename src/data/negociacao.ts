/**
 * NEGOCIAÇÃO: propostas e contrapropostas (por lead), controle de chaves e histórico de preço (por captação).
 * Login real: tabelas propostas, chaves e captacao_precos (as regras de quem vê ficam no banco).
 * Demonstração: tudo fica na memória.
 */
import { supabase, mensagemErro } from "@/integrations/frankkia/client";
import { contexto, ehReal } from "./sync";

export type TipoProposta = "proposta" | "contraproposta" | "aceita" | "recusada";
export type Proposta = {
  id: string;
  leadId: string;
  captacaoId?: string;
  tipo: TipoProposta;
  valor?: number;
  condicoes?: string;
  criadoEm: string;
};
export type Chave = {
  id: string;
  captacaoId: string;
  comQuem: string;
  motivo?: string;
  retiradaEm: string;
  devolverAte?: string;
  devolvidaEm?: string;
};
export type MudancaPreco = { id: string; valorAntes: number; valorDepois: number; alteradoEm: string };

export const ROTULO_PROPOSTA: Record<TipoProposta, string> = {
  proposta: "Proposta do cliente",
  contraproposta: "Contraproposta do proprietário",
  aceita: "Proposta aceita",
  recusada: "Proposta recusada",
};

const memoria = { propostas: [] as Proposta[], chaves: [] as Chave[] };
const id = () => crypto.randomUUID();
const u = <T,>(v: T | null) => (v === null ? undefined : v);

// ---------- Propostas ----------

export async function listarPropostas(leadId: string): Promise<Proposta[]> {
  if (!ehReal()) return memoria.propostas.filter((p) => p.leadId === leadId);
  const { data, error } = await supabase.from("propostas").select("*").eq("lead_id", leadId).order("criado_em");
  if (error) throw new Error(mensagemErro(error));
  return (data ?? []).map((r) => ({
    id: r.id,
    leadId: r.lead_id,
    captacaoId: u(r.captacao_id),
    tipo: r.tipo as TipoProposta,
    valor: r.valor === null ? undefined : Number(r.valor),
    condicoes: u(r.condicoes),
    criadoEm: r.criado_em,
  }));
}

export async function registrarProposta(p: Omit<Proposta, "id" | "criadoEm">): Promise<Proposta> {
  const nova: Proposta = { ...p, id: id(), criadoEm: new Date().toISOString() };
  if (!ehReal()) {
    memoria.propostas.push(nova);
    return nova;
  }
  const { error } = await supabase.from("propostas").insert({
    id: nova.id,
    imobiliaria_id: contexto.imobId,
    lead_id: p.leadId,
    captacao_id: p.captacaoId ?? null,
    tipo: p.tipo,
    valor: p.valor ?? null,
    condicoes: p.condicoes ?? null,
  });
  if (error) throw new Error(mensagemErro(error));
  return nova;
}

export async function excluirProposta(propostaId: string) {
  if (!ehReal()) {
    memoria.propostas = memoria.propostas.filter((p) => p.id !== propostaId);
    return;
  }
  const { error } = await supabase.from("propostas").delete().eq("id", propostaId);
  if (error) throw new Error(mensagemErro(error));
}

// ---------- Chaves ----------

export async function listarChaves(captacaoId: string): Promise<Chave[]> {
  if (!ehReal()) return memoria.chaves.filter((c) => c.captacaoId === captacaoId).sort((a, b) => b.retiradaEm.localeCompare(a.retiradaEm));
  const { data, error } = await supabase.from("chaves").select("*").eq("captacao_id", captacaoId).order("retirada_em", { ascending: false });
  if (error) throw new Error(mensagemErro(error));
  return (data ?? []).map((r) => ({
    id: r.id,
    captacaoId: r.captacao_id,
    comQuem: r.com_quem,
    motivo: u(r.motivo),
    retiradaEm: r.retirada_em,
    devolverAte: u(r.devolver_ate),
    devolvidaEm: u(r.devolvida_em),
  }));
}

export async function retirarChave(c: Omit<Chave, "id" | "retiradaEm" | "devolvidaEm">): Promise<void> {
  const nova: Chave = { ...c, id: id(), retiradaEm: new Date().toISOString() };
  if (!ehReal()) {
    memoria.chaves.push(nova);
    return;
  }
  const { error } = await supabase.from("chaves").insert({
    id: nova.id,
    imobiliaria_id: contexto.imobId,
    captacao_id: c.captacaoId,
    com_quem: c.comQuem,
    motivo: c.motivo ?? null,
    devolver_ate: c.devolverAte ?? null,
  });
  if (error) throw new Error(mensagemErro(error));
}

export async function devolverChave(chaveId: string): Promise<void> {
  const agora = new Date().toISOString();
  if (!ehReal()) {
    const c = memoria.chaves.find((x) => x.id === chaveId);
    if (c) c.devolvidaEm = agora;
    return;
  }
  const { error } = await supabase.from("chaves").update({ devolvida_em: agora }).eq("id", chaveId);
  if (error) throw new Error(mensagemErro(error));
}

// ---------- Histórico de preço ----------

export async function historicoPreco(captacaoId: string): Promise<MudancaPreco[]> {
  if (!ehReal()) return [];
  const { data, error } = await supabase.from("captacao_precos").select("*").eq("captacao_id", captacaoId).order("alterado_em", { ascending: false });
  if (error) throw new Error(mensagemErro(error));
  return (data ?? []).map((r) => ({ id: r.id, valorAntes: Number(r.valor_antes), valorDepois: Number(r.valor_depois), alteradoEm: r.alterado_em }));
}
