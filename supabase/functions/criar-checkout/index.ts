// Cria a página de pagamento segura da Stripe para um pedido de plano.
// Só o administrador da imobiliária do pedido pode pedir. O cartão é digitado na Stripe, nunca na Frankkia.
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
    const metadata = { pedido_id: pedido.id, imobiliaria_id: pedido.imobiliaria_id };
    const sessao = await stripe.checkout.sessions.create({
      mode: "subscription",
      locale: "pt-BR",
      customer_email: user.email ?? undefined,
      client_reference_id: pedido.id,
      metadata,
      subscription_data: { metadata },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: centavos,
            recurring: { interval: anual ? "year" : "month" },
            product_data: { name: `Frankkia ${pedido.plano_novo}${anual ? " (anual)" : ""}`, description: nomeImob || undefined },
          },
        },
      ],
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
