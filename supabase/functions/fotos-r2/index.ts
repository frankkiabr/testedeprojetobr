// Fotos dos anúncios no Cloudflare R2.
// "assinar": devolve um endereço temporário (10 min) para o navegador enviar a foto direto ao R2.
// "remover": apaga a foto do R2. Só o administrador da imobiliária ou o corretor captador podem.
import { AwsClient } from "npm:aws4fetch@1.0.20";
import { admin, cors, json, usuarioDoPedido } from "../_shared/comum.ts";

const env = (k: string) => Deno.env.get(k) ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const conta = env("R2_ACCOUNT_ID");
    const bucket = env("R2_BUCKET");
    const publico = env("R2_PUBLIC_URL").replace(/\/+$/, "");
    if (!conta || !bucket || !publico || !env("R2_ACCESS_KEY_ID") || !env("R2_SECRET_ACCESS_KEY")) {
      return json({ erro: "R2_NAO_CONFIGURADO" }, 503);
    }

    const user = await usuarioDoPedido(req);
    if (!user) return json({ erro: "NAO_AUTENTICADO" }, 401);

    const { acao, captacaoId, chave, tipo } = await req.json();
    const db = admin();
    const { data: cap } = await db.from("captacoes").select("id, imobiliaria_id, corretor_id").eq("id", captacaoId).maybeSingle();
    if (!cap) return json({ erro: "CAPTACAO_NAO_ENCONTRADA" }, 404);

    // Mesma regra do banco: administrador ativo da imobiliária ou o corretor captador (membro ativo)
    const { data: membro } = await db
      .from("membros")
      .select("papel")
      .eq("imobiliaria_id", cap.imobiliaria_id)
      .eq("usuario_id", user.id)
      .eq("ativo", true)
      .maybeSingle();
    if (!membro || (membro.papel !== "admin" && cap.corretor_id !== user.id)) return json({ erro: "SEM_PERMISSAO" }, 403);

    const r2 = new AwsClient({ accessKeyId: env("R2_ACCESS_KEY_ID"), secretAccessKey: env("R2_SECRET_ACCESS_KEY"), service: "s3", region: "auto" });
    const base = `https://${conta}.r2.cloudflarestorage.com/${bucket}`;
    const pasta = `${cap.imobiliaria_id}/${cap.id}/`;

    if (acao === "assinar") {
      const ext = tipo === "image/jpeg" ? "jpg" : "webp";
      const novaChave = `${pasta}${crypto.randomUUID()}.${ext}`;
      const assinado = await r2.sign(new Request(`${base}/${novaChave}?X-Amz-Expires=600`, { method: "PUT" }), { aws: { signQuery: true } });
      return json({ uploadUrl: assinado.url, chave: novaChave, url: `${publico}/${novaChave}` });
    }

    if (acao === "remover") {
      if (typeof chave !== "string" || !chave.startsWith(pasta)) return json({ erro: "CHAVE_INVALIDA" }, 400);
      const r = await r2.fetch(`${base}/${chave}`, { method: "DELETE" });
      return json({ removido: r.ok || r.status === 404 });
    }

    return json({ erro: "ACAO_INVALIDA" }, 400);
  } catch (e) {
    console.error(e);
    return json({ erro: "FALHA_R2" }, 500);
  }
});
