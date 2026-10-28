// Envia por e-mail (Resend) a apresentação de um estudo de mercado para o proprietário.
// Só quem pode ver o estudo (o corretor dono ou o administrador) consegue enviar; o estudo fica marcado como apresentado.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { cors, json, origemSegura, usuarioDoPedido } from "../_shared/comum.ts";
import { emailFrankkia, esc } from "../_shared/email.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const chave = Deno.env.get("RESEND_API_KEY");
    const remetente = Deno.env.get("EMAIL_REMETENTE");
    if (!chave || !remetente) return json({ erro: "EMAIL_NAO_CONFIGURADO" }, 503);

    const user = await usuarioDoPedido(req);
    if (!user) return json({ erro: "NAO_AUTENTICADO" }, 401);
    const { estudoId, para, nome, origem } = await req.json();
    const base = origemSegura(origem);
    const email = String(para ?? "").trim().toLowerCase();
    if (!estudoId || !base || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ erro: "DADOS_INVALIDOS" }, 400);

    // Com o login de quem pede: as regras do banco garantem que só o dono ou o administrador enxergam o estudo
    const comoUsuario = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: e } = await comoUsuario.from("avaliacoes").select("id, token, link_liberado, categoria, bairro, cidade").eq("id", estudoId).maybeSingle();
    if (!e) return json({ erro: "ESTUDO_NAO_ENCONTRADO" }, 404);
    if (!e.link_liberado) return json({ erro: "LINK_BLOQUEADO" }, 409);
    const { data: pf } = await comoUsuario.from("perfis").select("nome").eq("id", user.id).maybeSingle();

    const link = `${base}/estudo/${e.token}`;
    const quem = pf?.nome ? esc(pf.nome) : "Seu corretor";
    const imovel = esc(`${e.categoria}${e.bairro ? ` em ${e.bairro}` : ""}`);
    const html = emailFrankkia({
      previa: "Veja quanto vale o seu imóvel no mercado de hoje.",
      etiqueta: "Estudo de mercado",
      titulo: `${nome ? `${esc(String(nome).split(" ")[0])}, o` : "O"} estudo do seu imóvel está pronto`,
      texto: `${quem} preparou o estudo de mercado do ${imovel}${e.cidade ? `, ${esc(e.cidade)}` : ""}, com imóveis parecidos da região e os valores sugeridos.`,
      botao: { rotulo: "Ver o estudo", link: esc(link) },
      nota: "Ficou com alguma dúvida? Responda pelo WhatsApp do seu corretor.",
    });
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: remetente, to: [email], subject: `Estudo de mercado do seu imóvel`, html }),
    });
    if (!r.ok) {
      console.error("Resend", r.status, await r.text());
      return json({ erro: "FALHA_ENVIO" }, 502);
    }
    await comoUsuario.from("avaliacoes").update({ apresentado: true }).eq("id", e.id);
    return json({ enviado: true });
  } catch (e) {
    console.error(e);
    return json({ erro: "FALHA_ENVIO" }, 500);
  }
});
