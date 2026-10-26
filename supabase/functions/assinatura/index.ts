// Assinatura da imobiliária, pelo app (só o administrador da conta):
// - "cancelar": a assinatura termina no fim do período já pago (nada de nova cobrança);
// - "manter": desfaz um cancelamento agendado;
// - "portal": abre a página segura da Stripe para trocar o cartão e ver as faturas.
import Stripe from "npm:stripe@17.7.0";
import { admin, cors, json, origemSegura, situacaoDaAssinatura, usuarioDoPedido } from "../_shared/comum.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const chave = Deno.env.get("STRIPE_SECRET_KEY");
    if (!chave) return json({ erro: "STRIPE_NAO_CONFIGURADA" }, 503);

    const user = await usuarioDoPedido(req);
    if (!user) return json({ erro: "NAO_AUTENTICADO" }, 401);

    const { imobiliariaId, acao, origem } = await req.json();
    if (!imobiliariaId || !["cancelar", "manter", "portal"].includes(acao)) return json({ erro: "DADOS_INVALIDOS" }, 400);

    const db = admin();
    const { data: membro } = await db
      .from("membros")
      .select("papel")
      .eq("imobiliaria_id", imobiliariaId)
      .eq("usuario_id", user.id)
      .eq("ativo", true)
      .maybeSingle();
    if (membro?.papel !== "admin") return json({ erro: "APENAS_ADMIN" }, 403);

    const { data: atual } = await db.from("assinaturas_stripe").select("*").eq("imobiliaria_id", imobiliariaId).maybeSingle();
    if (!atual) return json({ erro: "SEM_ASSINATURA" }, 404);

    const stripe = new Stripe(chave);

    if (acao === "portal") {
      const base = origemSegura(origem);
      if (!base) return json({ erro: "DADOS_INVALIDOS" }, 400);
      const sessao = await stripe.billingPortal.sessions.create({
        customer: atual.cliente,
        locale: "pt-BR",
        return_url: `${base}/app/configuracoes?aba=plano`,
      });
      return json({ url: sessao.url });
    }

    const sub = await stripe.subscriptions.update(atual.assinatura, { cancel_at_period_end: acao === "cancelar" });
    const { error } = await db.rpc("registrar_assinatura", { p_assinatura: sub.id, ...situacaoDaAssinatura(sub) });
    if (error) console.error("Não foi possível registrar a assinatura", error);
    return json({ ok: true, ...situacaoDaAssinatura(sub) });
  } catch (e) {
    console.error(e);
    return json({ erro: "FALHA_STRIPE" }, 500);
  }
});
