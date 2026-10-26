import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * BANCO DA FRANKKIA: o seu Supabase (projeto yvbbktrufoyhtiotholf, São Paulo).
 * Fixo aqui de propósito, sem depender do .env: o Lovable reescreve o .env para o banco interno dele
 * (Lovable Cloud), que NÃO é o banco da Frankkia. A chave publicável é pública por natureza; quem protege
 * os dados são as regras de segurança (RLS) do banco. Nunca coloque aqui a chave secreta (service_role).
 */
export const SUPABASE_URL = "https://yvbbktrufoyhtiotholf.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XgOJ4nJI92ApQAxmLZ59XA_oXKtmoj4";
const url = SUPABASE_URL;
const key = SUPABASE_PUBLISHABLE_KEY;

/** "Lembrar de mim": desmarcado, a sessão fica só nesta aba (some ao fechar o navegador). */
const LEMBRAR = "frankkia-lembrar";
export function setLembrar(v: boolean) {
  try {
    localStorage.setItem(LEMBRAR, v ? "1" : "0");
  } catch {
    /* armazenamento indisponível */
  }
}
const store = () => {
  try {
    return localStorage.getItem(LEMBRAR) === "0" ? sessionStorage : localStorage;
  } catch {
    return undefined;
  }
};
const storage = {
  getItem: (k: string) => {
    try {
      return localStorage.getItem(k) ?? sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k: string, v: string) => {
    try {
      const s = store();
      (s === sessionStorage ? localStorage : sessionStorage).removeItem(k);
      s?.setItem(k, v);
    } catch {
      /* armazenamento indisponível */
    }
  },
  removeItem: (k: string) => {
    try {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    } catch {
      /* armazenamento indisponível */
    }
  },
};

/** Conexão do app com o banco (só a chave publicável; as regras de acesso ficam no banco). */
export const supabase = createClient<Database>(url, key, {
  auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type NovoInteressado = {
  nome: string;
  imobiliaria: string;
  email: string;
  telefone: string;
  equipe?: string;
  mensagem?: string;
  origem: "site" | "login" | "pagina";
};

/** Pedido de apresentação (qualquer visitante pode enviar; só a equipe Frankkia lê). Devolve o erro, ou null. */
export async function enviarInteressado(d: NovoInteressado): Promise<string | null> {
  const { error } = await supabase.from("interessados").insert({
    nome: d.nome.trim(),
    imobiliaria: d.imobiliaria.trim(),
    email: d.email.trim().toLowerCase(),
    telefone: d.telefone.replace(/\D/g, ""),
    equipe: d.equipe || null,
    mensagem: d.mensagem?.trim() || null,
    origem: d.origem,
  });
  if (!error) return null;
  if (/MUITOS_ENVIOS/.test(error.message)) return "Recebemos vários pedidos seguidos. Aguarde um pouco e tente de novo.";
  if (/check constraint/i.test(error.message)) return "Confira os dados: nome, imobiliária, e-mail e WhatsApp com DDD.";
  return mensagemErro(error);
}

/** Envia o convite por e-mail (Resend). Se o e-mail ainda não estiver configurado, devolve enviado: false. */
export async function enviarConvitePorEmail(token: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("enviar-convite", { body: { token, origem: window.location.origin } });
  return !error && !!(data as { enviado?: boolean } | null)?.enviado;
}

/**
 * Paga um pedido de plano. Primeira assinatura: devolve o endereço da página da Stripe.
 * Já assina: a troca é feita na mesma assinatura (cobra só a diferença) e devolve atualizado: true.
 */
export async function abrirPagamentoStripe(pedidoId: string): Promise<{ url?: string; atualizado?: boolean; erro?: string }> {
  const { data, error } = await supabase.functions.invoke("criar-checkout", { body: { pedidoId, origem: window.location.origin } });
  const d = data as { url?: string; atualizado?: boolean; erro?: string } | null;
  if (d?.url) return { url: d.url };
  if (d?.atualizado) return { atualizado: true };
  // Erro devolvido pela função (ex.: Stripe ainda não configurada)
  let motivo = d?.erro;
  if (!motivo && error && "context" in error) {
    try {
      motivo = ((await (error as { context: Response }).context.json()) as { erro?: string }).erro;
    } catch {
      /* sem detalhes */
    }
  }
  return { erro: motivo ?? "FALHA_STRIPE" };
}

/** Administrador: cancelar (no fim do período pago), manter (desfaz o cancelamento) ou abrir a página de cartão e faturas. */
export async function acaoAssinatura(
  imobiliariaId: string,
  acao: "cancelar" | "manter" | "portal",
): Promise<{ url?: string; ok?: boolean; erro?: string }> {
  const { data, error } = await supabase.functions.invoke("assinatura", { body: { imobiliariaId, acao, origem: window.location.origin } });
  const d = data as { url?: string; ok?: boolean; erro?: string } | null;
  if (d?.url || d?.ok) return d;
  let motivo = d?.erro;
  if (!motivo && error && "context" in error) {
    try {
      motivo = ((await (error as { context: Response }).context.json()) as { erro?: string }).erro;
    } catch {
      /* sem detalhes */
    }
  }
  return { erro: motivo ?? "FALHA_STRIPE" };
}

/** Frankkia: aplica a troca para um plano menor no banco e na assinatura da Stripe. */
export async function aplicarReducaoNaStripe(pedidoId: string): Promise<{ erro?: string; stripe?: "atualizada" | "sem_assinatura" | "falhou" }> {
  const { data, error } = await supabase.functions.invoke("aplicar-reducao", { body: { pedidoId } });
  const d = data as { ok?: boolean; stripe?: "atualizada" | "sem_assinatura" | "falhou"; erro?: string } | null;
  if (d?.ok) return { stripe: d.stripe };
  let motivo = d?.erro;
  if (!motivo && error && "context" in error) {
    try {
      motivo = ((await (error as { context: Response }).context.json()) as { erro?: string }).erro;
    } catch {
      /* sem detalhes */
    }
  }
  return { erro: motivo ?? "FALHA" };
}

/** Traduz os erros do banco e do login para mensagens em português. */
export function mensagemErro(e: unknown): string {
  const msg = typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
  const mapa: [RegExp, string][] = [
    [/Invalid login credentials/i, "E-mail ou senha incorretos."],
    [/Email not confirmed/i, "Confirme seu e-mail antes de entrar (veja a mensagem que enviamos)."],
    [/User already registered/i, "Este e-mail já tem uma conta. Entre com sua senha."],
    [/Password should be at least/i, "A senha precisa ter pelo menos 8 caracteres."],
    [/rate limit|too many/i, "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo."],
    [/LIMITE_DO_PLANO/, "Todas as vagas do plano estão em uso."],
    [/CONVITE_INVALIDO/, "Este convite já foi usado ou foi cancelado."],
    [/EMAIL_DIFERENTE_DO_CONVITE/, "Você entrou com um e-mail diferente do convite."],
    [/CRECI_OBRIGATORIO/, "Informe o CRECI ou marque que é estagiário(a)."],
    [/APENAS_FRANKKIA/, "Só a equipe Frankkia pode fazer isso."],
    [/SEM_ASSINATURA/, "Esta conta ainda não tem assinatura na Stripe."],
    [/STRIPE_NAO_CONFIGURADA|FALHA_STRIPE/, "Não foi possível falar com a Stripe agora. Tente de novo em alguns minutos."],
    [/APENAS_ADMIN/, "Só o administrador pode fazer isso."],
    [/REATIVACAO_PELA_FRANKKIA/, "A reativação de corretores é feita pela equipe Frankkia. Use \"Pedir reativação\"."],
    [/MEMBRO_DESATIVADO/, "Este corretor está desativado. Peça a reativação à equipe Frankkia em Equipe → Acessos desativados."],
    [/VAGAS_EM_USO/, "Há mais corretores ativos (ou convidados) do que o plano escolhido permite. Desative alguns em Equipe antes de trocar."],
    [/TESTE_JA_USADO/, "Este e-mail, WhatsApp ou CRECI já usou o teste grátis. Fale com a gente pelo WhatsApp para contratar."],
    [/JA_TEM_CONTA/, "Você já faz parte de uma conta na Frankkia. Entre pela tela de login."],
    [/EMAIL_NAO_CONFIRMADO/, "Confirme seu e-mail (veja a mensagem que enviamos) e entre de novo."],
    [/CADASTRO_FECHADO|CADASTRO_LIMITE_DIA/, "Os cadastros pelo site estão pausados no momento. Fale com a gente pelo WhatsApp."],
    [/TELEFONE_INVALIDO/, "Informe um WhatsApp válido, com DDD."],
    [/NOME_INVALIDO/, "Informe seu nome completo."],
    [/IMOBILIARIA_INVALIDA/, "Informe o nome da imobiliária."],
    [/PEDIDO_ABERTO/, "Já existe um pedido de plano em andamento."],
    [/Failed to fetch|NetworkError/i, "Sem conexão com o servidor. Verifique sua internet."],
  ];
  return mapa.find(([re]) => re.test(msg))?.[1] ?? "Algo deu errado. Tente novamente.";
}
