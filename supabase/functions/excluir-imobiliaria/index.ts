// Exclusão de uma imobiliária pela equipe Frankkia (Painel → Imobiliárias → Excluir).
// 1) O banco confere o nome digitado e apaga tudo (função excluir_imobiliaria, com o login de quem clicou).
// 2) Apaga os arquivos da imobiliária (documentos de clientes, Academy e logo), que ficam fora do banco.
// 3) Se havia assinatura na Stripe, ela é cancelada na hora (nada de nova cobrança).
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { admin, cors, json, usuarioDoPedido } from "../_shared/comum.ts";

/** Apaga tudo o que está dentro de uma pasta do armazenamento (inclusive subpastas). */
async function apagarPasta(db: ReturnType<typeof admin>, bucket: string, pasta: string): Promise<void> {
  for (;;) {
    const { data } = await db.storage.from(bucket).list(pasta, { limit: 1000 });
    if (!data?.length) return;
    const arquivos = data.filter((x) => x.id).map((x) => `${pasta}/${x.name}`);
    for (const sub of data.filter((x) => !x.id)) await apagarPasta(db, bucket, `${pasta}/${sub.name}`);
    if (!arquivos.length) return;
    const { error } = await db.storage.from(bucket).remove(arquivos);
    if (error) throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const user = await usuarioDoPedido(req);
    if (!user) return json({ erro: "NAO_AUTENTICADO" }, 401);
    const { imobiliariaId, confirmacao } = await req.json();
    if (!imobiliariaId) return json({ erro: "DADOS_INVALIDOS" }, 400);

    const db = admin();
    const { data: fk } = await db.from("frankkia_admins").select("usuario_id").eq("usuario_id", user.id).maybeSingle();
    if (!fk) return json({ erro: "APENAS_FRANKKIA" }, 403);

    // Guarda a assinatura antes de apagar (a linha some junto com a imobiliária)
    const { data: assinatura } = await db.from("assinaturas_stripe").select("assinatura").eq("imobiliaria_id", imobiliariaId).maybeSingle();

    const comoUsuario = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { error } = await comoUsuario.rpc("excluir_imobiliaria", { p_imob: imobiliariaId, p_confirmacao: confirmacao ?? "" });
    if (error) return json({ erro: error.message }, 409);

    for (const bucket of ["documentos", "academy", "marca"])
      await apagarPasta(db, bucket, imobiliariaId).catch((e) => console.error("Não foi possível apagar os arquivos", bucket, e));

    const chave = Deno.env.get("STRIPE_SECRET_KEY");
    if (!assinatura || !chave) return json({ ok: true, stripe: "sem_assinatura" });
    try {
      const stripe = new Stripe(chave);
      const sub = await stripe.subscriptions.retrieve(assinatura.assinatura);
      if (!["canceled", "incomplete_expired"].includes(sub.status)) await stripe.subscriptions.cancel(sub.id);
      return json({ ok: true, stripe: "cancelada" });
    } catch (e) {
      console.error("Não foi possível cancelar a assinatura na Stripe", e);
      return json({ ok: true, stripe: "falhou" });
    }
  } catch (e) {
    console.error(e);
    return json({ erro: "FALHA" }, 500);
  }
});
