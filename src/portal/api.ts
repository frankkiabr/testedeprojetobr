import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/frankkia/client";

/**
 * Portal público (fase 2): páginas que qualquer visitante — e o Google — abre sem login.
 * Lê só o que está publicado, pelas funções portal_* do banco (nenhuma tabela fica aberta).
 * Conexão própria, sem sessão: roda também no servidor, para a página já chegar pronta.
 */
const publico = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

export type Finalidade = "venda" | "locacao";

export type CartaoAnuncio = {
  slug: string;
  titulo: string;
  codigo: string;
  finalidade: Finalidade;
  valor: number;
  area: number;
  categoria: string;
  bairro: string;
  cidade: string;
  uf: string;
  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  capa: string | null;
};

export type CorretorResumo = {
  nome: string;
  slug: string | null;
  foto: string | null;
  creci: string | null;
  creci_uf: string | null;
};
export type ImobResumo = { nome: string; slug: string | null; logo: string | null; solo: boolean };

export type AnuncioPublico = {
  slug: string;
  titulo: string;
  descricao: string;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  condominio: number | null;
  iptu: number | null;
  caracteristicas: string[];
  publicado_em: string;
  atualizado_em: string;
  codigo: string;
  finalidade: Finalidade;
  valor: number;
  area: number;
  unidade: string | null;
  categoria: string;
  edificio: string | null;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string | null;
  lat: number | null;
  lng: number | null;
  fotos: { url: string; largura: number | null; altura: number | null }[];
  corretor: CorretorResumo & { telefone: string | null };
  imobiliaria: ImobResumo & { cidade: string | null; telefone: string | null };
};

export type CorretorPublico = CorretorResumo & {
  telefone: string | null;
  imobiliaria: ImobResumo;
  anuncios: CartaoAnuncio[];
};
export type ImobiliariaPublica = ImobResumo & {
  cidade: string | null;
  telefone: string | null;
  anuncios: CartaoAnuncio[];
  corretores: CorretorResumo[];
};

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await publico.rpc(fn as never, args as never);
  if (error) throw new Error(error.message);
  return (data as T | null) ?? null;
}

export const buscarAnuncio = (slug: string) =>
  rpc<AnuncioPublico>("portal_anuncio", { p_slug: slug });
export const buscarCorretor = (slug: string) =>
  rpc<CorretorPublico>("portal_corretor", { p_slug: slug });
export const buscarImobiliaria = (slug: string) =>
  rpc<ImobiliariaPublica>("portal_imobiliaria", { p_slug: slug });

/** Formulário do anúncio → vira lead do corretor responsável. Devolve o erro, ou null. */
export async function enviarContato(
  slug: string,
  d: { nome: string; telefone: string; email: string; mensagem: string },
): Promise<string | null> {
  const { error } = await publico.rpc(
    "portal_contato" as never,
    {
      p_slug: slug,
      p_nome: d.nome,
      p_telefone: d.telefone,
      p_email: d.email,
      p_mensagem: d.mensagem,
    } as never,
  );
  if (!error) return null;
  if (/MUITOS_ENVIOS/.test(error.message))
    return "Recebemos vários contatos seguidos. Aguarde um pouco e tente de novo.";
  if (/DADOS_INVALIDOS/.test(error.message))
    return "Confira seu nome, o WhatsApp com DDD e o e-mail.";
  if (/ANUNCIO_INDISPONIVEL/.test(error.message)) return "Este imóvel não está mais disponível.";
  return "Não foi possível enviar agora. Tente de novo ou chame no WhatsApp.";
}
