// Peças comuns das funções do servidor (rodam no Supabase, nunca no navegador).
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

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
