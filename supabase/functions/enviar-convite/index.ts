// Envia por e-mail (Resend) o link de primeiro acesso de um convite.
// Pode enviar: o administrador da imobiliária do convite, ou a equipe Frankkia.
import { admin, cors, json, origemSegura, usuarioDoPedido } from "../_shared/comum.ts";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const chave = Deno.env.get("RESEND_API_KEY");
    const remetente = Deno.env.get("EMAIL_REMETENTE"); // ex.: "Frankkia <convites@seudominio.com.br>"
    if (!chave || !remetente) return json({ enviado: false, motivo: "EMAIL_NAO_CONFIGURADO" });

    const user = await usuarioDoPedido(req);
    if (!user) return json({ erro: "NAO_AUTENTICADO" }, 401);

    const { token, origem } = await req.json();
    const base = origemSegura(origem);
    if (typeof token !== "string" || !base) return json({ erro: "DADOS_INVALIDOS" }, 400);

    const db = admin();
    const { data: convite } = await db
      .from("convites")
      .select("email, papel, status, imobiliaria_id, imobiliarias(nome)")
      .eq("token", token)
      .maybeSingle();
    if (!convite || convite.status !== "pendente") return json({ erro: "CONVITE_INVALIDO" }, 404);

    // Quem pode enviar
    const [{ data: fk }, { data: membro }] = await Promise.all([
      db.from("frankkia_admins").select("usuario_id").eq("usuario_id", user.id).maybeSingle(),
      db.from("membros").select("papel").eq("imobiliaria_id", convite.imobiliaria_id).eq("usuario_id", user.id).eq("ativo", true).maybeSingle(),
    ]);
    if (!fk && membro?.papel !== "admin") return json({ erro: "SEM_PERMISSAO" }, 403);

    const imob = (convite.imobiliarias as { nome: string } | null)?.nome ?? "sua imobiliária";
    const link = `${base}/convite/${token}`;
    const papel = convite.papel === "admin" ? "administrador(a)" : "corretor(a)";
    const html = `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#0f1a33">
  <p style="font-size:22px;font-weight:700;margin:0 0 24px">frankkia</p>
  <h1 style="font-size:24px;margin:0 0 12px">Você foi convidado(a) para a ${esc(imob)}</h1>
  <p style="font-size:15px;line-height:1.6;color:#4a5570">Crie seu acesso à Frankkia como ${papel}. Leva menos de 2 minutos.</p>
  <p style="margin:28px 0"><a href="${link}" style="background:#0f1a33;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:600;display:inline-block">Criar meu acesso</a></p>
  <p style="font-size:13px;color:#8a93a8">Se o botão não funcionar, copie este endereço no navegador:<br>${esc(link)}</p>
  <p style="font-size:13px;color:#8a93a8;margin-top:28px">Frankkia — Seu universo imobiliário, em um só lugar.</p>
</div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: remetente, to: [convite.email], subject: `Seu convite para a ${imob} na Frankkia`, html }),
    });
    if (!r.ok) {
      console.error("Resend", r.status, await r.text());
      return json({ enviado: false, motivo: "FALHA_ENVIO" });
    }
    return json({ enviado: true });
  } catch (e) {
    console.error(e);
    return json({ enviado: false, motivo: "FALHA_ENVIO" });
  }
});
