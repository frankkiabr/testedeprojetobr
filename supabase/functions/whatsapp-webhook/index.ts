// Webhook do WhatsApp (Meta). Endereço para colar no app da Meta:
//   https://yvbbktrufoyhtiotholf.supabase.co/functions/v1/whatsapp-webhook
// GET: a Meta confirma o endereço com a palavra WHATSAPP_VERIFY_TOKEN.
// POST: mensagens que chegam no número da Frankkia (viram conversas no Painel Frankkia) e a situação das que saíram
//       (entregue, lida, falhou). Só aceita o que vem assinado com a chave secreta do app (WHATSAPP_APP_SECRET).
// "PARAR" desliga os avisos do corretor dono daquele número.
import { admin } from "../_shared/comum.ts";
import { assinaturaValida, configWhatsApp, enviarTexto } from "../_shared/whatsapp.ts";

type Msg = {
  from: string;
  id: string;
  timestamp?: string;
  type: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  image?: { caption?: string };
  video?: { caption?: string };
  document?: { caption?: string; filename?: string };
  location?: { name?: string; address?: string };
};
type Situacao = { id: string; status: string; errors?: { code?: number; title?: string }[] };

const ROTULOS: Record<string, string> = {
  image: "[foto]",
  audio: "[áudio]",
  voice: "[áudio]",
  video: "[vídeo]",
  document: "[documento]",
  sticker: "[figurinha]",
  location: "[localização]",
  contacts: "[contato]",
};

function textoDa(m: Msg) {
  if (m.type === "text") return m.text?.body ?? "";
  if (m.type === "button") return m.button?.text ?? "";
  if (m.type === "interactive") return m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";
  const extra = m.image?.caption ?? m.video?.caption ?? m.document?.caption ?? m.document?.filename ?? m.location?.name ?? m.location?.address;
  return [ROTULOS[m.type] ?? `[${m.type}]`, extra].filter(Boolean).join(" ");
}

const ehParar = (t: string) => ["PARAR", "SAIR", "STOP", "CANCELAR AVISOS"].includes(t.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase());

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const palavra = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (palavra && url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === palavra)
      return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
    return new Response("Proibido", { status: 403 });
  }
  if (req.method !== "POST") return new Response("Método não aceito", { status: 405 });

  const segredo = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!segredo) return new Response("WhatsApp não configurado", { status: 503 });
  const corpo = await req.text();
  if (!(await assinaturaValida(corpo, req.headers.get("x-hub-signature-256"), segredo)))
    return new Response("Assinatura inválida", { status: 401 });

  let dados: { entry?: { changes?: { field?: string; value?: Record<string, unknown> }[] }[] };
  try {
    dados = JSON.parse(corpo);
  } catch {
    return new Response("ok");
  }

  const db = admin();
  const cfg = configWhatsApp();

  for (const entrada of dados.entry ?? []) {
    for (const mudanca of entrada.changes ?? []) {
      if (mudanca.field !== "messages" || !mudanca.value) continue;
      const v = mudanca.value as { contacts?: { wa_id?: string; profile?: { name?: string } }[]; messages?: Msg[]; statuses?: Situacao[] };

      // Situação das mensagens que saíram (avisos e respostas)
      for (const s of v.statuses ?? []) {
        const erro = s.errors?.[0] ? `${s.errors[0].code ?? ""} ${s.errors[0].title ?? ""}`.trim() : null;
        await db.from("whatsapp_avisos").update({ situacao: s.status, ...(erro ? { erro } : {}) }).eq("wamid", s.id);
        await db.from("whatsapp_mensagens").update({ situacao: s.status }).eq("wamid", s.id);
      }

      // Mensagens que chegaram
      for (const m of v.messages ?? []) {
        if (m.type === "reaction") continue;
        const nome = v.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? null;
        const quando = m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString();
        const texto = textoDa(m);

        const { data: conversa } = await db
          .from("whatsapp_conversas")
          .upsert({ telefone: m.from, ...(nome ? { nome } : {}) }, { onConflict: "telefone" })
          .select("id, nao_lidas")
          .single();
        if (!conversa) continue;

        const { error } = await db
          .from("whatsapp_mensagens")
          .insert({ conversa_id: conversa.id, direcao: "entrada", tipo: m.type, texto, wamid: m.id, criado_em: quando });
        if (error) continue; // repetida (a Meta às vezes manda duas vezes)
        await db
          .from("whatsapp_conversas")
          .update({ ultima_em: quando, entrada_em: quando, nao_lidas: (conversa.nao_lidas ?? 0) + 1 })
          .eq("id", conversa.id);

        if (ehParar(texto)) {
          const { data: desligados } = await db.rpc("whatsapp_parar", { p_wa_id: m.from });
          if (cfg && (desligados ?? 0) > 0) {
            const aviso = "Pronto: você não vai mais receber avisos da Frankkia por aqui. Para ligar de novo, use Configurações → Notificações na Frankkia.";
            const r = await enviarTexto(cfg, m.from, aviso);
            if (r.ok) await db.from("whatsapp_mensagens").insert({ conversa_id: conversa.id, direcao: "saida", texto: aviso, wamid: r.wamid, situacao: "sent" });
          }
        }
      }
    }
  }
  return new Response("ok");
});
