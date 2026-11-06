// WhatsApp oficial (Cloud API da Meta). Segredos no Supabase (Edge Functions → Secrets), nunca no código:
//   WHATSAPP_TOKEN         token permanente do usuário do sistema (whatsapp_business_messaging)
//   WHATSAPP_PHONE_ID      identificação do número da Frankkia (não é o número em si)
//   WHATSAPP_APP_SECRET    chave secreta do app (confere a assinatura do webhook)
//   WHATSAPP_VERIFY_TOKEN  palavra combinada para a Meta confirmar o webhook
//   WHATSAPP_API_VERSION   opcional (padrão v27.0)

export function configWhatsApp() {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_ID");
  if (!token || !phoneId) return null;
  return { token, phoneId, versao: Deno.env.get("WHATSAPP_API_VERSION") || "v27.0" };
}

type Config = NonNullable<ReturnType<typeof configWhatsApp>>;
export type Resposta = { ok: true; wamid: string } | { ok: false; erro: string };

async function enviar(cfg: Config, corpo: Record<string, unknown>): Promise<Resposta> {
  const r = await fetch(`https://graph.facebook.com/${cfg.versao}/${cfg.phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...corpo }),
  });
  const dados = await r.json().catch(() => ({}));
  if (r.ok && dados?.messages?.[0]?.id) return { ok: true, wamid: dados.messages[0].id };
  const e = dados?.error;
  return { ok: false, erro: `${r.status} ${e?.code ?? ""} ${e?.error_data?.details ?? e?.message ?? ""}`.trim().slice(0, 300) };
}

/** Mensagem de modelo aprovado (pode ser enviada a qualquer hora). */
export function enviarModelo(cfg: Config, para: string, modelo: string, parametros: string[]) {
  return enviar(cfg, {
    to: para,
    type: "template",
    template: {
      name: modelo,
      language: { code: "pt_BR" },
      components: parametros.length
        ? [{ type: "body", parameters: parametros.map((t) => ({ type: "text", text: limpar(t) })) }]
        : [],
    },
  });
}

/** Texto livre: só vale até 24 horas depois da última mensagem da pessoa. */
export function enviarTexto(cfg: Config, para: string, texto: string) {
  return enviar(cfg, { to: para, type: "text", text: { body: texto.slice(0, 4096), preview_url: false } });
}

// A Meta recusa parâmetros com quebra de linha, tab ou mais de 4 espaços seguidos
function limpar(t: string) {
  const s = String(t ?? "").replace(/[\n\r\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  return (s || "-").slice(0, 200);
}

/** Confere a assinatura X-Hub-Signature-256 (só a Meta conhece a chave secreta do app). */
export async function assinaturaValida(corpo: string, cabecalho: string | null, segredo: string) {
  if (!cabecalho?.startsWith("sha256=")) return false;
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const assinatura = new Uint8Array(await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(corpo)));
  const esperado = Array.from(assinatura, (b) => b.toString(16).padStart(2, "0")).join("");
  const recebido = cabecalho.slice(7).toLowerCase();
  if (recebido.length !== esperado.length) return false;
  let dif = 0;
  for (let i = 0; i < esperado.length; i++) dif |= esperado.charCodeAt(i) ^ recebido.charCodeAt(i);
  return dif === 0;
}
