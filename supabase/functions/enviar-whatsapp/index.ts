// Envia os avisos da fila whatsapp_avisos (lead novo, rodízio, lembrete de visita, chave atrasada) pelo número da Frankkia.
// Chamada pelo banco a cada minuto (pg_cron). Não recebe dados nem devolve nada sensível: só manda o que já está na fila.
import { admin, json } from "../_shared/comum.ts";
import { configWhatsApp, enviarModelo } from "../_shared/whatsapp.ts";

// Nome de cada modelo aprovado na Meta (WhatsApp Manager → Modelos de mensagem), idioma pt_BR
const MODELOS: Record<string, string> = {
  lead_novo: "frankkia_lead_novo",
  lead_rodizio: "frankkia_lead_rodizio",
  visita_lembrete: "frankkia_lembrete_visita",
  chave_atrasada: "frankkia_chave_atrasada",
};

Deno.serve(async () => {
  const cfg = configWhatsApp();
  if (!cfg) return json({ erro: "WHATSAPP_NAO_CONFIGURADO" }, 503);

  const db = admin();
  // Aviso velho não serve mais (ex.: lembrete de uma visita que já passou)
  const limite = new Date(Date.now() - 6 * 3600_000).toISOString();
  const { data: fila } = await db
    .from("whatsapp_avisos")
    .select("id, tipo, para, parametros, tentativas")
    .is("enviado_em", null)
    .lt("tentativas", 5)
    .gt("criado_em", limite)
    .order("criado_em")
    .limit(50);

  let enviados = 0;
  for (const a of fila ?? []) {
    const modelo = MODELOS[a.tipo];
    if (!modelo) continue;
    const r = await enviarModelo(cfg, a.para, modelo, Array.isArray(a.parametros) ? a.parametros.map(String) : []);
    if (r.ok) {
      enviados++;
      await db.from("whatsapp_avisos").update({ enviado_em: new Date().toISOString(), wamid: r.wamid, situacao: "sent", erro: null }).eq("id", a.id);
    } else {
      console.error("WhatsApp", a.tipo, r.erro);
      await db.from("whatsapp_avisos").update({ tentativas: a.tentativas + 1, erro: r.erro }).eq("id", a.id);
    }
  }
  return json({ enviados });
});
