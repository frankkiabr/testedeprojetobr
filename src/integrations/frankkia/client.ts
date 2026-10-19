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

/** Abre a página de pagamento da Stripe. Devolve o endereço, ou o motivo de não ter conseguido. */
export async function abrirPagamentoStripe(pedidoId: string): Promise<{ url?: string; erro?: string }> {
  const { data, error } = await supabase.functions.invoke("criar-checkout", { body: { pedidoId, origem: window.location.origin } });
  const d = data as { url?: string; erro?: string } | null;
  if (d?.url) return { url: d.url };
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
    [/APENAS_ADMIN/, "Só o administrador pode fazer isso."],
    [/Failed to fetch|NetworkError/i, "Sem conexão com o servidor. Verifique sua internet."],
  ];
  return mapa.find(([re]) => re.test(msg))?.[1] ?? "Algo deu errado. Tente novamente.";
}
