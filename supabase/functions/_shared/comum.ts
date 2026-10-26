// Peças comuns das funções do servidor (rodam no Supabase, nunca no navegador).
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import type Stripe from "npm:stripe@17.7.0";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** Acesso total ao banco: só dentro do servidor, depois de conferir quem está pedindo. */
export const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

/** Quem está chamando (pelo login do navegador). */
export async function usuarioDoPedido(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await admin().auth.getUser(token);
  return data.user ?? null;
}

/** Endereço do site para os links (só https, ou localhost em testes). */
export function origemSegura(origem: unknown) {
  if (typeof origem !== "string") return null;
  try {
    const u = new URL(origem);
    if (u.protocol === "https:" || u.hostname === "localhost" || u.hostname === "127.0.0.1") return u.origin;
  } catch {
    /* inválido */
  }
  return null;
}

/** Situação da assinatura para a Frankkia (argumentos da função registrar_assinatura do banco). */
export function situacaoDaAssinatura(sub: Stripe.Subscription) {
  const data = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);
  const fimDoPeriodo = sub.current_period_end ?? (sub.items.data[0] as { current_period_end?: number } | undefined)?.current_period_end;
  const encerrada = ["canceled", "incomplete_expired", "unpaid"].includes(sub.status);
  const recusada = ["past_due", "incomplete"].includes(sub.status);
  const agendado = !encerrada && (sub.cancel_at_period_end || !!sub.cancel_at);
  return {
    p_situacao: encerrada ? "encerrada" : recusada ? "pagamento_recusado" : agendado ? "cancelamento_agendado" : "ativa",
    p_proxima: encerrada || agendado ? null : data(fimDoPeriodo),
    p_cancela: agendado ? data(sub.cancel_at ?? fimDoPeriodo) : null,
  };
}
