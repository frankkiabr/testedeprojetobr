// Troca para um plano menor, aplicada pela equipe Frankkia (botão "Aplicar troca" em Upgrades).
// 1) O banco confere as vagas e troca o plano (função aplicar_reducao, com o login de quem clicou).
// 2) Se a imobiliária tem assinatura na Stripe, o valor novo passa a valer a partir da próxima cobrança
//    (sem estorno do período já pago).
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { admin, cors, json, usuarioDoPedido } from "../_shared/comum.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const user = await usuarioDoPedido(req);
    if (!user) return json({ erro: "NAO_AUTENTICADO" }, 401);
    const { pedidoId } = await req.json();
    if (!pedidoId) return json({ erro: "DADOS_INVALIDOS" }, 400);

    const db = admin();
    const { data: fk } = await db.from("frankkia_admins").select("usuario_id").eq("usuario_id", user.id).maybeSingle();
    if (!fk) return json({ erro: "APENAS_FRANKKIA" }, 403);

    const { data: pedido } = await db.from("pedidos_upgrade").select("*").eq("id", pedidoId).maybeSingle();
    if (!pedido || pedido.tipo !== "reducao") return json({ erro: "PEDIDO_NAO_ENCONTRADO" }, 404);

    // 1) Banco: com o login de quem clicou (a função confere que é a Frankkia e que as vagas cabem)
    const comoUsuario = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { error } = await comoUsuario.rpc("aplicar_reducao", { p_pedido: pedidoId });
    if (error) return json({ erro: error.message }, 409);

    // 2) Stripe: novo valor a partir da próxima cobrança
    const chave = Deno.env.get("STRIPE_SECRET_KEY");
    const { data: atual } = await db.from("assinaturas_stripe").select("*").eq("imobiliaria_id", pedido.imobiliaria_id).maybeSingle();
    if (!chave || !atual) return json({ ok: true, stripe: "sem_assinatura" });
    try {
      const stripe = new Stripe(chave);
      const sub = await stripe.subscriptions.retrieve(atual.assinatura);
      if (!["active", "trialing", "past_due"].includes(sub.status)) return json({ ok: true, stripe: "sem_assinatura" });
      const { data: plano } = await db.from("planos").select("preco").eq("nome", pedido.plano_novo).single();
      const anual = atual.ciclo === "anual";
      const preco = await stripe.prices.create({
        currency: "brl",
        unit_amount: Math.round(Number(plano!.preco) * (anual ? 10 : 1) * 100),
        recurring: { interval: anual ? "year" : "month" },
        product_data: { name: `Frankkia ${pedido.plano_novo}${anual ? " (anual)" : ""}` },
      });
      await stripe.subscriptions.update(sub.id, {
        items: [{ id: sub.items.data[0].id, price: preco.id }],
        proration_behavior: "none",
        metadata: { ...sub.metadata, pedido_id: pedido.id },
      });
      return json({ ok: true, stripe: "atualizada" });
    } catch (e) {
      console.error("Stripe não atualizou", e);
      return json({ ok: true, stripe: "falhou" });
    }
  } catch (e) {
    console.error(e);
    return json({ erro: "FALHA" }, 500);
  }
});
