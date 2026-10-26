// Envia por e-mail (Resend) o link de primeiro acesso de um convite.
// Pode enviar: o administrador da imobiliária do convite, ou a equipe Frankkia.
import { admin, cors, json, origemSegura, usuarioDoPedido } from "../_shared/comum.ts";
import { emailFrankkia, esc } from "../_shared/email.ts";

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
    const html = emailFrankkia({
      previa: "Crie seu acesso em menos de 2 minutos.",
      etiqueta: "Convite",
      titulo: `Você foi convidado(a) para a ${esc(imob)}`,
      texto: `Crie seu acesso à Frankkia como ${papel}. Leva menos de 2 minutos: é só completar seu cadastro e criar uma senha.`,
      botao: { rotulo: "Criar meu acesso", link: esc(link) },
      nota: "Tenha em mãos seu WhatsApp e, se for corretor(a), o número do CRECI.",
    });

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
