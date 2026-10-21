// Pagamento de um pedido de plano. Só o administrador da imobiliária do pedido pode pedir.
// - Primeira assinatura: abre a página segura da Stripe (o cartão é digitado na Stripe, nunca na Frankkia).
// - Já tem assinatura: troca o plano nela mesma e cobra só a diferença proporcional, no cartão já salvo
//   (sem criar uma segunda cobrança). Se o cartão recusar, nada muda.
import Stripe from "npm:stripe@17.7.0";
import { admin, cors, json, origemSegura, usuarioDoPedido } from "../_shared/comum.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const chave = Deno.env.get("STRIPE_SECRET_KEY");
    if (!chave) return json({ erro: "STRIPE_NAO_CONFIGURADA" }, 503);

    const user = await usuarioDoPedido(req);
    if (!user) return json({ erro: "NAO_AUTENTICADO" }, 401);

    const { pedidoId, origem } = await req.json();
    const base = origemSegura(origem);
    if (!pedidoId || !base) return json({ erro: "DADOS_INVALIDOS" }, 400);

    const db = admin();
    const { data: pedido } = await db.from("pedidos_upgrade").select("*, imobiliarias(nome)").eq("id", pedidoId).maybeSingle();
    if (!pedido) return json({ erro: "PEDIDO_NAO_ENCONTRADO" }, 404);

    // Precisa ser administrador ativo dessa imobiliária
    const { data: membro } = await db
      .from("membros")
      .select("papel")
      .eq("imobiliaria_id", pedido.imobiliaria_id)
      .eq("usuario_id", user.id)
      .eq("ativo", true)
      .maybeSingle();
    if (membro?.papel !== "admin") return json({ erro: "APENAS_ADMIN" }, 403);
    if (pedido.pagamento !== "aguardando" || pedido.liberado) return json({ erro: "PEDIDO_JA_PAGO" }, 409);
    if (pedido.tipo === "reducao") return json({ erro: "PEDIDO_SEM_PAGAMENTO" }, 409);

    // Preço oficial do plano (nunca o que veio do navegador). Anual = 12 meses pelo preço de 10, cobrado por ano.
    const { data: plano } = await db.from("planos").select("preco").eq("nome", pedido.plano_novo).maybeSingle();
    if (!plano) return json({ erro: "PLANO_INVALIDO" }, 400);
    const anual = pedido.ciclo === "anual";
    const centavos = Math.round(Number(plano.preco) * (anual ? 10 : 1) * 100);

    const stripe = new Stripe(chave);
    const nomeImob = (pedido.imobiliarias as { nome: string } | null)?.nome ?? "";
    const metadata = { pedido_id: pedido.id, imobiliaria_id: pedido.imobiliaria_id, ciclo: anual ? "anual" : "mensal" };
    const produto = { name: `Frankkia ${pedido.plano_novo}${anual ? " (anual)" : ""}`, description: nomeImob || undefined };
    const intervalo = anual ? "year" : "month";

    // ---------- Já assina: troca o plano na mesma assinatura ----------
    const { data: atual } = await db.from("assinaturas_stripe").select("*").eq("imobiliaria_id", pedido.imobiliaria_id).maybeSingle();
    if (atual) {
      const sub = await stripe.subscriptions.retrieve(atual.assinatura).catch(() => null);
      if (sub && ["active", "trialing", "past_due"].includes(sub.status)) {
        const preco = await stripe.prices.create({ currency: "brl", unit_amount: centavos, recurring: { interval: intervalo }, product_data: { name: produto.name } });
        const atualizada = await stripe.subscriptions.update(sub.id, {
          items: [{ id: sub.items.data[0].id, price: preco.id }],
          // Cobra agora só a diferença proporcional; se o cartão recusar, a troca não acontece
          proration_behavior: "always_invoice",
          payment_behavior: "pending_if_incomplete",
          metadata,
        });
        if (atualizada.pending_update) return json({ erro: "PAGAMENTO_RECUSADO" }, 402);

        await db
          .from("pedidos_upgrade")
          .update({ pagamento: "confirmado", metodo: "cartao", pago_em: new Date().toISOString(), referencia: sub.id })
          .eq("id", pedido.id);
        const { error } = await db.rpc("aplicar_upgrade", { p_pedido: pedido.id });
        if (error) console.error("Liberação automática falhou", error);
        await db
          .from("assinaturas_stripe")
          .update({ ciclo: anual ? "anual" : "mensal", atualizado_em: new Date().toISOString() })
          .eq("imobiliaria_id", pedido.imobiliaria_id);
        return json({ atualizado: true });
      }
      // Assinatura antiga encerrada ou cancelada: segue para uma nova
    }

    // ---------- Primeira assinatura: página de pagamento da Stripe ----------
    const sessao = await stripe.checkout.sessions.create({
      mode: "subscription",
      locale: "pt-BR",
      customer: atual?.cliente ?? undefined,
      customer_email: atual?.cliente ? undefined : (user.email ?? undefined),
      client_reference_id: pedido.id,
      metadata,
      subscription_data: { metadata },
      line_items: [{ quantity: 1, price_data: { currency: "brl", unit_amount: centavos, recurring: { interval: intervalo }, product_data: produto } }],
      success_url: `${base}/checkout/${pedido.id}?pagamento=ok`,
      cancel_url: `${base}/checkout/${pedido.id}`,
    });

    await db.from("pedidos_upgrade").update({ referencia: sessao.id }).eq("id", pedido.id);
    return json({ url: sessao.url });
  } catch (e) {
    console.error(e);
    return json({ erro: "FALHA_STRIPE" }, 500);
  }
});
