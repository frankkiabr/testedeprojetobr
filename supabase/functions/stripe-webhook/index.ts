// Aviso automático da Stripe:
// - pagamento aprovado: o pedido fica "Pagamento confirmado" e o novo plano é liberado na hora;
// - renovação recusada, cancelamento agendado ou assinatura encerrada: a situação da assinatura e
//   da imobiliária é atualizada (função registrar_assinatura no banco).
import Stripe from "npm:stripe@17.7.0";
import { admin, situacaoDaAssinatura } from "../_shared/comum.ts";

const cripto = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const chave = Deno.env.get("STRIPE_SECRET_KEY");
  const segredo = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!chave || !segredo) return new Response("Stripe não configurada", { status: 503 });

  const stripe = new Stripe(chave);
  const corpo = await req.text();
  let evento: Stripe.Event;
  try {
    // Confere a assinatura: só a Stripe consegue mandar este aviso
    evento = await stripe.webhooks.constructEventAsync(corpo, req.headers.get("stripe-signature") ?? "", segredo, undefined, cripto);
  } catch {
    return new Response("Assinatura inválida", { status: 400 });
  }

  const db = admin();
  if (evento.type.startsWith("checkout.session.")) {
    const s = evento.data.object as Stripe.Checkout.Session;
    const pedidoId = s.metadata?.pedido_id ?? s.client_reference_id;
    if (pedidoId) {
      const pago =
        evento.type === "checkout.session.async_payment_succeeded" || (evento.type === "checkout.session.completed" && s.payment_status === "paid");
      const recusado = evento.type === "checkout.session.async_payment_failed" || evento.type === "checkout.session.expired";
      const pendente = evento.type === "checkout.session.completed" && s.payment_status === "unpaid";
      const pagamento = pago ? "confirmado" : recusado ? "cancelado" : pendente ? "pendente" : null;
      if (pagamento) {
        const { data: atualizado } = await db
          .from("pedidos_upgrade")
          .update({ pagamento, metodo: "cartao", ...(pago ? { pago_em: new Date().toISOString() } : {}), referencia: s.id })
          .eq("id", pedidoId)
          .eq("liberado", false)
          .neq("pagamento", "confirmado")
          .select("id");
        // Pagou: o novo plano é liberado na hora, sem esperar a equipe Frankkia
        if (pago && atualizado?.length) {
          const { error } = await db.rpc("aplicar_upgrade", { p_pedido: pedidoId });
          if (error) console.error("Liberação automática falhou", error);
        }
        // Guarda a assinatura: os próximos upgrades e reduções atualizam esta mesma (nada de cobrança dupla)
        if (pago && s.subscription && s.customer && s.metadata?.imobiliaria_id) {
          const imob = s.metadata.imobiliaria_id;
          const nova = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
          const { data: antiga } = await db.from("assinaturas_stripe").select("assinatura").eq("imobiliaria_id", imob).maybeSingle();
          // Se por algum motivo já havia outra assinatura ativa, ela é encerrada para não cobrar duas vezes
          if (antiga?.assinatura && antiga.assinatura !== nova) {
            try {
              await stripe.subscriptions.cancel(antiga.assinatura, { prorate: true });
            } catch (e) {
              console.error("Não foi possível encerrar a assinatura antiga", e);
            }
          }
          await db.from("assinaturas_stripe").upsert({
            imobiliaria_id: imob,
            cliente: typeof s.customer === "string" ? s.customer : s.customer.id,
            assinatura: nova,
            ciclo: s.metadata?.ciclo === "anual" ? "anual" : "mensal",
            situacao: "ativa",
            cancela_em: null,
            atualizado_em: new Date().toISOString(),
          });
          await registrarAssinatura(stripe, db, nova);
        }
      }
    }
  }

  // Renovações e cancelamentos: sempre relê a assinatura na Stripe (o formato dos avisos muda entre versões)
  if (evento.type.startsWith("customer.subscription.")) {
    const assinatura = evento.data.object as Stripe.Subscription;
    await registrarAssinatura(stripe, db, assinatura.id);
  }
  if (evento.type === "invoice.paid" || evento.type === "invoice.payment_failed") {
    const fatura = evento.data.object as Stripe.Invoice & { parent?: { subscription_details?: { subscription?: string } } };
    const ref = fatura.subscription ?? fatura.parent?.subscription_details?.subscription;
    const id = typeof ref === "string" ? ref : ref?.id;
    if (id) await registrarAssinatura(stripe, db, id);
  }
  return new Response(JSON.stringify({ recebido: true }), { headers: { "Content-Type": "application/json" } });
});

async function registrarAssinatura(stripe: Stripe, db: ReturnType<typeof admin>, id: string) {
  try {
    const sub = await stripe.subscriptions.retrieve(id);
    const { error } = await db.rpc("registrar_assinatura", { p_assinatura: id, ...situacaoDaAssinatura(sub) });
    if (error) console.error("Não foi possível registrar a assinatura", error);
  } catch (e) {
    console.error("Não foi possível ler a assinatura", e);
  }
}
