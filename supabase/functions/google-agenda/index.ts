// Google Agenda de verdade (Frankkia → Google, e as mudanças feitas no Google voltam).
// - POST {acao: "conectar", origem, caminho}: devolve o endereço da tela oficial de login do Google (OAuth).
// - GET  ?code&state: volta do Google; guarda a conexão e manda os compromissos futuros para a fila.
// - POST {acao: "desconectar"}: revoga o acesso e apaga a conexão.
// - POST {acao: "sincronizar"}: chamada pelo banco a cada minuto; leva a fila (google_sync_fila) para o Google.
// - POST {acao: "buscar"}: chamada a cada 5 minutos; confere, um por um, os eventos que a Frankkia criou e traz
//   de volta o que a pessoa mudou no Google (título, horário, local ou exclusão). Nunca lista os outros eventos.
import { admin, cors, json, origemSegura, usuarioDoPedido } from "../_shared/comum.ts";

const ESCOPOS = "openid email https://www.googleapis.com/auth/calendar.events";
const CAMINHOS = ["/app/agenda", "/admin/agenda"];
const TIPOS: Record<string, string> = { visita: "Visita", captacao: "Captação", reuniao: "Reunião", ligacao: "Ligação", outro: "Compromisso" };
const API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const cliente = () => ({ id: Deno.env.get("GOOGLE_CLIENT_ID") ?? "", segredo: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "" });
// Para onde o Google devolve a pessoa. GOOGLE_REDIRECT_URI = https://frankkia.com/google-agenda/retorno
// (domínio verificado, que repassa para esta função); sem ele, volta direto para esta função.
const retorno = () => Deno.env.get("GOOGLE_REDIRECT_URI") || `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-agenda`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method === "GET") return await voltaDoGoogle(new URL(req.url));
    const corpo = await req.json().catch(() => ({}));
    if (corpo.acao === "sincronizar") return json(await sincronizar());
    if (corpo.acao === "buscar") return json(await buscar());
    if (corpo.acao === "conectar") return await conectar(req, corpo);
    if (corpo.acao === "desconectar") return await desconectar(req);
    return json({ erro: "DADOS_INVALIDOS" }, 400);
  } catch (e) {
    console.error(e);
    return json({ erro: "FALHA_GOOGLE" }, 500);
  }
});

async function conectar(req: Request, corpo: { origem?: string; caminho?: string }) {
  const user = await usuarioDoPedido(req);
  if (!user) return json({ erro: "NAO_AUTENTICADO" }, 401);
  const base = origemSegura(corpo.origem);
  const caminho = CAMINHOS.includes(corpo.caminho ?? "") ? corpo.caminho! : "/app/agenda";
  if (!base) return json({ erro: "DADOS_INVALIDOS" }, 400);
  const { id } = cliente();
  if (!id) return json({ erro: "GOOGLE_NAO_CONFIGURADO" }, 503);

  const estado = crypto.randomUUID() + crypto.randomUUID().replaceAll("-", "");
  const db = admin();
  await db.from("google_oauth_estados").delete().lt("criado_em", new Date(Date.now() - 15 * 60e3).toISOString());
  await db.from("google_oauth_estados").insert({ estado, usuario_id: user.id, origem: base + caminho });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: id,
    redirect_uri: retorno(),
    response_type: "code",
    scope: ESCOPOS,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: estado,
    ...(user.email ? { login_hint: user.email } : {}),
  }).toString();
  return json({ url: url.toString() });
}

async function voltaDoGoogle(url: URL) {
  const db = admin();
  const estado = url.searchParams.get("state") ?? "";
  const { data: e } = await db.from("google_oauth_estados").select("*").eq("estado", estado).maybeSingle();
  if (!e) return new Response("Link expirado. Volte à Frankkia e clique em Conectar Google Agenda de novo.", { status: 400 });
  await db.from("google_oauth_estados").delete().eq("estado", estado);
  const voltar = (r: string) => Response.redirect(`${e.origem}?google=${r}`, 302);
  if (Date.now() - new Date(e.criado_em).getTime() > 15 * 60e3) return voltar("expirado");

  const code = url.searchParams.get("code");
  if (!code) return voltar("cancelado");
  const { id, segredo } = cliente();
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: id, client_secret: segredo, redirect_uri: retorno(), grant_type: "authorization_code" }),
  });
  const t = await r.json();
  if (!r.ok || !t.refresh_token) {
    console.error("Token do Google", r.status, t);
    return voltar("erro");
  }
  // Sem permissão de agenda (a pessoa desmarcou na tela do Google): não conecta
  if (!String(t.scope ?? "").includes("calendar.events")) return voltar("sem_permissao");

  let email = "";
  try {
    const payload = t.id_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    email = JSON.parse(atob(payload)).email ?? "";
  } catch {
    /* sem e-mail no token */
  }
  await db.from("google_conexoes").upsert({ usuario_id: e.usuario_id, email, refresh_token: t.refresh_token, conectado_em: new Date().toISOString() });
  await db.rpc("google_enfileirar_futuros", { p_usuario: e.usuario_id });
  return voltar("ok");
}

async function desconectar(req: Request) {
  const user = await usuarioDoPedido(req);
  if (!user) return json({ erro: "NAO_AUTENTICADO" }, 401);
  const db = admin();
  const { data: c } = await db.from("google_conexoes").select("refresh_token").eq("usuario_id", user.id).maybeSingle();
  if (c) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(c.refresh_token)}`, { method: "POST" }).catch(() => null);
  await db.from("google_conexoes").delete().eq("usuario_id", user.id);
  await db.from("google_sync_fila").delete().eq("usuario_id", user.id);
  // Os eventos ficam na agenda da conta antiga; ao conectar de novo, a Frankkia cria eventos novos
  await db.from("compromissos").update({ google_evento_id: null, google_atualizado: null }).eq("dono_id", user.id).not("google_evento_id", "is", null);
  return json({ ok: true });
}

/** Leva a fila para o Google. Um acesso por pessoa, renovado a cada execução. */
async function sincronizar() {
  const db = admin();
  const { data: fila } = await db.from("google_sync_fila").select("*").lt("tentativas", 5).order("criado_em").limit(50);
  const acessos = new Map<string, string | null>();
  let feitos = 0;

  for (const item of fila ?? []) {
    if (!acessos.has(item.usuario_id)) acessos.set(item.usuario_id, await acessoDe(item.usuario_id));
    const acesso = acessos.get(item.usuario_id);
    if (!acesso) {
      // Desconectado (ou acesso revogado no Google): a fila dessa pessoa não tem mais para onde ir
      await db.from("google_sync_fila").delete().eq("compromisso_id", item.compromisso_id);
      continue;
    }
    const h = { Authorization: `Bearer ${acesso}`, "Content-Type": "application/json" };
    try {
      if (item.acao === "excluir") {
        if (item.evento_id) {
          const r = await fetch(`${API}/${encodeURIComponent(item.evento_id)}`, { method: "DELETE", headers: h });
          if (!r.ok && r.status !== 404 && r.status !== 410) throw new Error(`${r.status} ${await r.text()}`);
        }
      } else {
        const { data: c } = await db.from("compromissos").select("*").eq("id", item.compromisso_id).maybeSingle();
        if (c) {
          const evento = {
            summary: c.titulo,
            location: c.local ?? undefined,
            description: [TIPOS[c.tipo] ?? "Compromisso", c.observacoes, "Criado na Frankkia · frankkia.com"].filter(Boolean).join("\n\n"),
            start: { dateTime: c.inicio, timeZone: "America/Sao_Paulo" },
            end: { dateTime: c.fim, timeZone: "America/Sao_Paulo" },
          };
          let r = c.google_evento_id
            ? await fetch(`${API}/${encodeURIComponent(c.google_evento_id)}`, { method: "PATCH", headers: h, body: JSON.stringify(evento) })
            : null;
          // Sem evento ainda (ou apagado no Google): cria um novo
          if (!r || r.status === 404 || r.status === 410) r = await fetch(API, { method: "POST", headers: h, body: JSON.stringify(evento) });
          if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
          const ev = await r.json();
          // Guarda também a marca de atualização: a conferência de volta sabe que esta mudança veio da Frankkia
          await db.from("compromissos").update({ google_evento_id: ev.id, google_atualizado: ev.updated ?? null }).eq("id", c.id);
        }
      }
      await db.from("google_sync_fila").delete().eq("compromisso_id", item.compromisso_id).eq("criado_em", item.criado_em);
      feitos++;
    } catch (e) {
      console.error("Google Agenda", e);
      await db.from("google_sync_fila").update({ tentativas: item.tentativas + 1, erro: String(e).slice(0, 300) }).eq("compromisso_id", item.compromisso_id);
    }
  }
  return { feitos };
}

/** Mudanças feitas no Google: só nos eventos da Frankkia, de ontem até os próximos 90 dias. */
async function buscar() {
  const db = admin();
  const { data: conexoes } = await db.from("google_conexoes").select("usuario_id");
  let mudancas = 0;
  for (const { usuario_id } of conexoes ?? []) {
    const { data: comps } = await db
      .from("compromissos")
      .select("id, titulo, inicio, fim, local, google_evento_id, google_atualizado")
      .eq("dono_id", usuario_id)
      .not("google_evento_id", "is", null)
      .gt("fim", new Date(Date.now() - 864e5).toISOString())
      .lt("inicio", new Date(Date.now() + 90 * 864e5).toISOString())
      .limit(100);
    if (!comps?.length) continue;
    // Pendências de envio desta pessoa: a versão da Frankkia ainda vai para o Google, então não puxa por cima
    const { data: fila } = await db.from("google_sync_fila").select("compromisso_id").eq("usuario_id", usuario_id);
    const pendentes = new Set((fila ?? []).map((f) => f.compromisso_id));
    const acesso = await acessoDe(usuario_id);
    if (!acesso) continue;

    for (const c of comps) {
      if (pendentes.has(c.id)) continue;
      const r = await fetch(`${API}/${encodeURIComponent(c.google_evento_id!)}`, { headers: { Authorization: `Bearer ${acesso}` } });
      if (!r.ok) continue; // 404: evento de outra conta ou apagado de vez; não mexe no compromisso
      const ev = await r.json();
      if (c.google_atualizado && ev.updated && new Date(ev.updated) <= new Date(c.google_atualizado)) continue;

      const excluir = ev.status === "cancelled";
      const inicio = ev.start?.dateTime ?? c.inicio; // evento de dia inteiro no Google: mantém o horário
      const fim = ev.end?.dateTime ?? c.fim;
      const mudou =
        excluir ||
        new Date(inicio).getTime() !== new Date(c.inicio).getTime() ||
        new Date(fim).getTime() !== new Date(c.fim).getTime() ||
        (ev.summary ?? "") !== c.titulo ||
        (ev.location ?? "") !== (c.local ?? "");
      if (!mudou) {
        await db.from("compromissos").update({ google_atualizado: ev.updated ?? null }).eq("id", c.id);
        continue;
      }
      const { error } = await db.rpc("aplicar_mudanca_google", {
        p_compromisso: c.id,
        p_titulo: ev.summary ?? c.titulo,
        p_inicio: inicio,
        p_fim: fim,
        p_local: ev.location ?? "",
        p_excluir: excluir,
        p_atualizado: ev.updated ?? null,
      });
      if (error) console.error("Mudança do Google", error);
      else mudancas++;
    }
  }
  return { mudancas };
}

/** Acesso de curta duração a partir do refresh token. Acesso revogado: apaga a conexão. */
async function acessoDe(usuario: string): Promise<string | null> {
  const db = admin();
  const { data: c } = await db.from("google_conexoes").select("refresh_token").eq("usuario_id", usuario).maybeSingle();
  if (!c) return null;
  const { id, segredo } = cliente();
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: c.refresh_token, client_id: id, client_secret: segredo, grant_type: "refresh_token" }),
  });
  const t = await r.json();
  if (r.ok && t.access_token) return t.access_token;
  console.error("Renovar acesso do Google", r.status, t);
  if (t.error === "invalid_grant") await db.from("google_conexoes").delete().eq("usuario_id", usuario);
  return null;
}
