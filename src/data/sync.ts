/**
 * SINCRONIZAÇÃO COM O BANCO.
 * As telas leem as listas de `demo.ts` (leads, captações...). No login real, este arquivo
 * troca o conteúdo dessas listas pelos dados do banco; na demonstração, devolve os dados de exemplo.
 * As regras de quem vê o quê ficam no banco (RLS): cada corretor só recebe o que pode ver.
 */
import * as D from "./demo";
import * as P from "./platform";
import { frankkiaUser } from "./platform";
import { ctx, OUTROS_PARTICIPANTES, type LinhaMercado, type LinhaRanking, type OfertaMercado } from "./contexto";
import { lastMonths } from "./queries";
import type {
  Captacao,
  CategoriaImovel,
  Chamado,
  Cliente,
  ClienteStatus,
  ErroSistema,
  PedidoUpgrade,
  PlanoNome,
  Compromisso,
  FechamentoInformado,
  Imovel,
  Lead,
  Parceiro,
  Participante,
  Proprietario,
  Transacao,
  Trilha,
  Usuario,
} from "./types";
import { legado as supabase, mensagemErro } from "@/integrations/supabase/client";

/** Linhas das tabelas antigas (sem tipos gerados: essas tabelas não existem mais no banco). */
type Row<T extends string> = Record<string, any> & { __tabela?: T };

// ---------- Avisos de mudança (para as telas se redesenharem) ----------

const ouvintes = new Set<() => void>();
export function aoMudar(f: () => void) {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
}
const avisar = () => ouvintes.forEach((f) => f());

// ---------- Cópia dos dados de exemplo (para voltar à demonstração) ----------

const ORIGINAL = structuredClone({
  imobiliaria: D.imobiliaria,
  admin: D.admin,
  corretores: D.corretores,
  outrosMembros: D.outrosMembros,
  parceiros: D.parceiros,
  leads: D.leads,
  proprietarios: D.proprietarios,
  imoveis: D.imoveis,
  captacoes: D.captacoes,
  transacoes: D.transacoes,
  fechamentos: D.fechamentos,
  compromissos: D.compromissos,
  conexoesGoogle: D.conexoesGoogle,
  trilhas: D.trilhas,
  progresso: D.progresso,
  marca: D.marca,
  convites: D.convites,
  chamados: D.chamados,
  frankkiaUser,
  clientes: P.clientes,
  pedidosUpgrade: P.pedidosUpgrade,
  chamadosOutras: P.chamadosOutras,
  errosSistema: P.errosSistema,
});

function trocarLista<T>(alvo: T[], novos: T[]) {
  alvo.splice(0, alvo.length, ...novos);
}
function trocarObjeto<T extends object>(alvo: T, novo: T) {
  for (const k of Object.keys(alvo)) delete (alvo as Record<string, unknown>)[k];
  Object.assign(alvo, novo);
}

function aplicarDemo() {
  const o = structuredClone(ORIGINAL);
  trocarObjeto(D.imobiliaria, o.imobiliaria);
  trocarObjeto(D.admin, o.admin);
  trocarLista(D.corretores, o.corretores);
  trocarLista(D.outrosMembros, o.outrosMembros);
  trocarLista(D.parceiros, o.parceiros);
  trocarLista(D.leads, o.leads);
  trocarLista(D.proprietarios, o.proprietarios);
  trocarLista(D.imoveis, o.imoveis);
  trocarLista(D.captacoes, o.captacoes);
  trocarLista(D.transacoes, o.transacoes);
  trocarLista(D.fechamentos, o.fechamentos);
  trocarLista(D.compromissos, o.compromissos);
  trocarObjeto(D.conexoesGoogle, o.conexoesGoogle);
  trocarLista(D.trilhas, o.trilhas);
  trocarObjeto(D.progresso, o.progresso);
  trocarObjeto(D.marca, o.marca);
  trocarLista(D.convites, o.convites);
  trocarLista(D.chamados, o.chamados);
  trocarObjeto(frankkiaUser, o.frankkiaUser);
  trocarLista(P.clientes, o.clientes);
  trocarLista(P.pedidosUpgrade, o.pedidosUpgrade);
  trocarLista(P.chamadosOutras, o.chamadosOutras);
  trocarLista(P.errosSistema, o.errosSistema);
  Object.assign(ctx, { modo: "demo", imobId: "", userId: "", papel: null, mercado: null, ranking: null });
}

/** Volta para os dados de exemplo (ao sair do login real). */
export function usarDemo() {
  if (ctx.modo === "demo") return;
  aplicarDemo();
  avisar();
}

// ---------- Leitura em páginas (o banco devolve no máximo 1.000 linhas por vez) ----------

type Pagina<T> = PromiseLike<{ data: T[] | null; error: unknown }>;
async function todos<T>(pagina: (de: number, ate: number) => Pagina<T>): Promise<T[]> {
  const out: T[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await pagina(de, de + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

/** Funções do banco ainda não listadas nos tipos gerados. */
const rpc = supabase.rpc as unknown as (f: string, args: object) => PromiseLike<{ data: unknown; error: unknown }>;

// ---------- Conversões banco → telas ----------

const u = <T>(v: T | null) => (v === null ? undefined : v);

const iniciaisDe = (nome: string, email: string) => {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (p.length) return ((p[0][0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  return email.slice(0, 2).toUpperCase();
};

const paraLead = (r: Row<"leads">): Lead => ({
  id: r.id,
  corretorId: r.corretor_id,
  nome: r.nome,
  telefone: r.telefone,
  origem: r.origem,
  interesse: r.interesse,
  etapa: r.etapa as Lead["etapa"],
  criadoEm: r.criado_em,
  checklist: r.checklist,
  visitaEm: u(r.visita_em),
  observacoes: u(r.observacoes),
});

const paraImovel = (r: Row<"imoveis">): Imovel => ({
  id: r.id,
  categoria: r.categoria as CategoriaImovel,
  nome: u(r.nome),
  endereco: { logradouro: r.logradouro, numero: r.numero, bairro: r.bairro, cidade: r.cidade, uf: r.uf },
  criadoEm: r.criado_em,
});

const paraCaptacao = (r: Row<"captacoes">): Captacao => ({
  id: r.id,
  corretorId: r.corretor_id,
  proprietarioId: r.proprietario_id,
  imovelId: r.imovel_id,
  unidade: u(r.unidade),
  finalidade: r.finalidade as Captacao["finalidade"],
  valor: Number(r.valor),
  areaM2: Number(r.area_m2),
  status: r.status as Captacao["status"],
  captadoEm: r.captado_em,
  checklistCaptacao: r.checklist_captacao,
  checklistMarketing: r.checklist_marketing,
});

const paraCompromisso = (r: Row<"compromissos">): Compromisso => ({
  id: r.id,
  donoId: r.dono_id,
  titulo: r.titulo,
  tipo: r.tipo as Compromisso["tipo"],
  inicio: r.inicio,
  fim: r.fim,
  leadId: u(r.lead_id),
  captacaoId: u(r.captacao_id),
  local: u(r.local),
  observacoes: u(r.observacoes),
});

const paraChamado = (c: Row<"chamados">): Chamado => ({
  id: c.id,
  imobiliariaId: c.imobiliaria_id,
  autorId: c.autor_id,
  assunto: c.assunto,
  categoria: c.categoria,
  mensagem: c.mensagem,
  criadoEm: c.criado_em,
  status: c.status as Chamado["status"],
  resposta: u(c.resposta),
});

const paraPedido = (p: Row<"pedidos_upgrade">): PedidoUpgrade => ({
  id: p.id,
  imobiliariaId: p.imobiliaria_id,
  planoAtual: p.plano_atual as PlanoNome,
  planoNovo: p.plano_novo as PlanoNome,
  valorMensal: Number(p.valor_mensal),
  criadoEm: p.criado_em,
  pagamento: p.pagamento as PedidoUpgrade["pagamento"],
  metodo: u(p.metodo) as PedidoUpgrade["metodo"],
  pagoEm: u(p.pago_em),
  liberado: p.liberado,
  liberadoEm: u(p.liberado_em),
  referencia: p.referencia ?? p.id.slice(0, 8).toUpperCase(),
});

// ---------- Carregar tudo do banco ----------

let geracao = 0;

export type ContaDados = { usuarioId: string; email: string; nome: string; frankkia: boolean; papel: "admin" | "corretor" | null; imobId: string | null };

/** Preenche as listas com os dados do banco para quem entrou. */
export async function carregarReal(conta: ContaDados) {
  const minha = ++geracao;
  const papel = conta.frankkia ? "frankkia" : conta.papel;

  // Conta sem imobiliária ativa (a tela "sem acesso" aparece): nada para carregar.
  if (!conta.frankkia && !conta.imobId) {
    aplicarDemo();
    trocarLista(D.leads, []);
    Object.assign(ctx, { modo: "real", userId: conta.usuarioId, papel: null });
    avisar();
    return;
  }

  // Equipe Frankkia: contas, planos, volumes de uso, pedidos, chamados e erros (nunca o conteúdo das imobiliárias).
  if (papel === "frankkia" || !conta.imobId) {
    const [agenda, painel, pedidos, chamados, erros] = await Promise.all([
      todos<Row<"compromissos">>((a, b) =>
        supabase.from("compromissos").select("*").is("imobiliaria_id", null).eq("dono_id", conta.usuarioId).order("inicio").range(a, b),
      ),
      supabase.rpc("painel_imobiliarias"),
      supabase.from("pedidos_upgrade").select("*").order("criado_em", { ascending: false }),
      todos<Row<"chamados">>((a, b) => supabase.from("chamados").select("*").order("criado_em", { ascending: false }).range(a, b)),
      supabase.from("erros_sistema").select("*").order("ultima_vez", { ascending: false }),
    ]);
    if (painel.error) throw painel.error;
    const autores = [...new Set(chamados.map((c) => c.autor_id))];
    const perfis = autores.length ? ((await supabase.from("perfis").select("id, nome, email").in("id", autores)).data ?? []) : [];
    const nomeAutor = new Map(perfis.map((p) => [p.id, p.nome || p.email]));
    if (minha !== geracao) return;
    aplicarDemo();
    Object.assign(frankkiaUser, { id: conta.usuarioId, email: conta.email, nome: conta.nome || frankkiaUser.nome });
    trocarLista(D.compromissos, agenda.map(paraCompromisso));
    trocarLista(
      P.clientes,
      (painel.data ?? []).map(
        (c: any): Cliente => ({
          id: c.id,
          nome: c.nome,
          cidade: c.cidade,
          cnpj: c.cnpj,
          plano: c.plano as PlanoNome,
          status: c.status as ClienteStatus,
          clienteDesde: c.cliente_desde,
          ultimoAcesso: u(c.ultimo_acesso),
          testeAte: u(c.teste_ate),
          testeDias: u(c.teste_dias),
          adminNome: c.admin_nome,
          adminEmail: c.admin_email,
          corretores: c.vagas,
          uso: { negocios: c.uso_negocios, performance: c.uso_performance, academy: c.uso_academy, marketing: c.uso_marketing },
        }),
      ),
    );
    trocarLista(P.pedidosUpgrade, (pedidos.data ?? []).map(paraPedido));
    trocarLista(P.chamadosOutras, []);
    trocarLista(
      D.chamados,
      chamados.map((c) => ({ ...paraChamado(c), autorNome: nomeAutor.get(c.autor_id) })),
    );
    trocarLista(
      P.errosSistema,
      (erros.data ?? []).map(
        (e): ErroSistema => ({
          id: e.id,
          mensagem: e.mensagem,
          local: e.local,
          ocorrencias: e.ocorrencias,
          imobiliarias: e.imobiliarias_afetadas.length,
          primeiraVez: e.primeira_vez,
          ultimaVez: e.ultima_vez,
          status: e.status as ErroSistema["status"],
          origem: "capturado",
        }),
      ),
    );
    Object.assign(ctx, { modo: "real", imobId: "", userId: conta.usuarioId, papel: "frankkia" });
    avisar();
    return;
  }

  const imob = conta.imobId;

  const [imobRow, membros, convites, parceiros, leads, proprietarios, imoveis, captacoes, transacoes, detalhes, participantes, fechamentos, compromissos, trilhas, aulas, progresso, chamados, logo, pedidos] =
    await Promise.all([
      supabase.from("imobiliarias").select("*").eq("id", imob).single(),
      supabase.from("membros").select("*").eq("imobiliaria_id", imob),
      papel === "admin" ? supabase.from("convites").select("*").eq("imobiliaria_id", imob).eq("status", "pendente").order("enviado_em", { ascending: false }) : null,
      papel === "admin" ? supabase.from("parceiros").select("*").eq("imobiliaria_id", imob).order("nome") : null,
      todos<Row<"leads">>((a, b) => supabase.from("leads").select("*").eq("imobiliaria_id", imob).order("criado_em", { ascending: false }).range(a, b)),
      todos<Row<"proprietarios">>((a, b) => supabase.from("proprietarios").select("*").eq("imobiliaria_id", imob).order("criado_em", { ascending: false }).range(a, b)),
      todos<Row<"imoveis">>((a, b) => supabase.from("imoveis").select("*").eq("imobiliaria_id", imob).order("criado_em", { ascending: false }).range(a, b)),
      todos<Row<"captacoes">>((a, b) => supabase.from("captacoes").select("*").eq("imobiliaria_id", imob).order("captado_em", { ascending: false }).range(a, b)),
      todos<Row<"transacoes">>((a, b) => supabase.from("transacoes").select("*").eq("imobiliaria_id", imob).order("data", { ascending: false }).range(a, b)),
      todos<Row<"transacao_detalhes">>((a, b) => supabase.from("transacao_detalhes").select("*").eq("imobiliaria_id", imob).range(a, b)),
      todos<Row<"transacao_participantes">>((a, b) => supabase.from("transacao_participantes").select("*").eq("imobiliaria_id", imob).range(a, b)),
      todos<Row<"fechamentos_informados">>((a, b) =>
        supabase.from("fechamentos_informados").select("*").eq("imobiliaria_id", imob).order("criado_em", { ascending: false }).range(a, b),
      ),
      todos<Row<"compromissos">>((a, b) => supabase.from("compromissos").select("*").eq("imobiliaria_id", imob).order("inicio").range(a, b)),
      supabase.from("trilhas").select("*").eq("imobiliaria_id", imob).order("criado_em"),
      supabase.from("aulas").select("*").eq("imobiliaria_id", imob).order("ordem"),
      supabase.from("progresso_aulas").select("*").eq("imobiliaria_id", imob),
      supabase.from("chamados").select("*").eq("imobiliaria_id", imob).order("criado_em", { ascending: false }),
      supabase.from("marca_logo").select("*").eq("imobiliaria_id", imob).maybeSingle(),
      papel === "admin" ? supabase.from("pedidos_upgrade").select("*").eq("imobiliaria_id", imob).order("criado_em", { ascending: false }) : null,
    ]);
  if (imobRow.error) throw imobRow.error;

  // Pessoas da imobiliária
  const ids = (membros.data ?? []).map((m) => m.usuario_id);
  const perfis = ids.length ? ((await supabase.from("perfis").select("*").in("id", ids)).data ?? []) : [];
  const perfil = new Map(perfis.map((p) => [p.id, p]));
  const pessoas: Usuario[] = (membros.data ?? []).map((m) => {
    const p = perfil.get(m.usuario_id);
    const nome = p?.nome || p?.email || "Sem nome";
    return {
      id: m.usuario_id,
      imobiliariaId: imob,
      nome,
      email: p?.email ?? "",
      telefone: u(p?.telefone ?? null),
      papel: m.papel as Usuario["papel"],
      iniciais: p?.iniciais || iniciaisDe(nome, p?.email ?? ""),
      metaMensalVGV: m.meta_mensal_vgv === null ? undefined : Number(m.meta_mensal_vgv),
      ativo: m.ativo,
      aniversario: u(p?.aniversario ?? null),
      creci: u(p?.creci ?? null),
      creciUF: u(p?.creci_uf ?? null),
      estagiario: p?.estagiario ?? false,
    };
  });
  const admins = pessoas.filter((p) => p.papel === "admin");
  const adminPrincipal = admins.find((a) => a.id === conta.usuarioId) ?? admins.find((a) => a.ativo) ?? admins[0];

  // Vendas e locações: o corretor só recebe a própria parte da divisão; o resto vira "outros participantes".
  const det = new Map(detalhes.map((d) => [d.transacao_id, d]));
  const partes = new Map<string, Participante[]>();
  participantes.forEach((p) => {
    const lista = partes.get(p.transacao_id) ?? [];
    lista.push({ tipo: p.tipo as Participante["tipo"], refId: (p.corretor_id ?? p.parceiro_id)!, pct: Number(p.pct) });
    partes.set(p.transacao_id, lista);
  });
  let somas = new Map<string, number>();
  if (papel === "corretor") {
    const { data } = await rpc("minhas_participacoes", { p_imob: imob });
    somas = new Map(((data as { transacao_id: string; soma_pct: number }[] | null) ?? []).map((r) => [r.transacao_id, Number(r.soma_pct)]));
  }
  const listaTransacoes: Transacao[] = transacoes
    .map((t): Transacao => {
      const ps = [...(partes.get(t.id) ?? [])];
      const minhaSoma = ps.reduce((s, p) => s + p.pct, 0);
      const total = somas.get(t.id);
      if (papel === "corretor" && total !== undefined && total - minhaSoma > 0.001)
        ps.push({ tipo: "parceiro", refId: OUTROS_PARTICIPANTES, pct: total - minhaSoma });
      const d = det.get(t.id);
      return {
        id: t.id,
        tipo: t.tipo as Transacao["tipo"],
        captacaoId: t.captacao_id,
        valor: Number(t.valor),
        honorariosPct: d ? Number(d.honorarios_pct) : 0,
        data: t.data,
        cliente: u(d?.cliente ?? null),
        participantes: ps,
      };
    })
    // O corretor vê nas listas só os negócios de que participou (o mercado usa outra fonte, abaixo)
    .filter((t) => papel !== "corretor" || t.participantes.some((p) => p.tipo === "corretor" && p.refId === conta.usuarioId));

  // Corretor: ranking e estudo de mercado da equipe vêm de funções do banco
  let ranking: Record<string, LinhaRanking[]> | null = null;
  let mercado: { fechados: LinhaMercado[]; ofertas: OfertaMercado[] } | null = null;
  if (papel === "corretor") {
    [ranking, mercado] = await Promise.all([carregarRanking(imob, 12), carregarMercado(imob)]);
  }

  if (minha !== geracao) return; // outra conta entrou enquanto carregava

  const i = imobRow.data;
  trocarObjeto(D.imobiliaria, {
    id: i.id,
    nome: i.nome,
    cnpj: i.cnpj ?? "",
    email: i.email ?? "",
    telefone: i.telefone ?? "",
    cidade: i.cidade ?? "",
    plano: i.plano as typeof D.imobiliaria.plano,
    limiteCorretores: i.limite_corretores,
    metaMensalVGV: Number(i.meta_mensal_vgv),
  });
  trocarObjeto(
    D.admin,
    adminPrincipal ?? { id: "sem-admin", imobiliariaId: imob, nome: "Administrador", email: "", papel: "admin", iniciais: "AD" },
  );
  trocarLista(
    D.corretores,
    pessoas.filter((p) => p.papel === "corretor").sort((a, b) => a.nome.localeCompare(b.nome)),
  );
  trocarLista(
    D.outrosMembros,
    admins.filter((a) => a !== adminPrincipal),
  );
  trocarLista(
    D.convites,
    (convites?.data ?? []).map((c) => ({ id: c.id, email: c.email, enviadoEm: c.enviado_em })),
  );
  trocarLista(
    D.parceiros,
    (parceiros?.data ?? []).map((p): Parceiro => ({ id: p.id, nome: p.nome, creci: u(p.creci), empresa: u(p.empresa), telefone: u(p.telefone) })),
  );
  trocarLista(D.leads, leads.map(paraLead));
  trocarLista(
    D.proprietarios,
    proprietarios.map((p): Proprietario => ({ id: p.id, corretorId: p.corretor_id, nome: p.nome, whatsapp: p.whatsapp })),
  );
  trocarLista(D.imoveis, imoveis.map(paraImovel));
  trocarLista(D.captacoes, captacoes.map(paraCaptacao));
  trocarLista(D.transacoes, listaTransacoes);
  trocarLista(
    D.fechamentos,
    fechamentos.map(
      (f): FechamentoInformado => ({
        id: f.id,
        corretorId: f.corretor_id,
        captacaoId: f.captacao_id,
        tipo: f.tipo as FechamentoInformado["tipo"],
        valor: Number(f.valor),
        data: f.data,
        observacao: u(f.observacao),
        criadoEm: f.criado_em,
        status: f.status as FechamentoInformado["status"],
      }),
    ),
  );
  trocarLista(D.compromissos, compromissos.map(paraCompromisso));
  trocarObjeto(D.conexoesGoogle, {});
  const aulasRows = aulas.data ?? [];
  trocarLista(
    D.trilhas,
    (trilhas.data ?? []).map(
      (t): Trilha => ({
        id: t.id,
        titulo: t.titulo,
        subtitulo: t.subtitulo,
        criadoEm: t.criado_em,
        capaHue: t.capa_hue,
        aulas: aulasRows
          .filter((a) => a.trilha_id === t.id)
          .map((a) => ({
            id: a.id,
            titulo: a.titulo,
            tipo: a.tipo as "video" | "documento",
            formato: a.formato as Trilha["aulas"][number]["formato"],
            arquivoNome: a.arquivo_nome,
            tamanhoBytes: Number(a.tamanho_bytes),
            duracaoMin: u(a.duracao_min),
            videoUrl: u(a.video_url),
            arquivoPath: u(a.arquivo_path),
          })),
      }),
    ),
  );
  const prog: Record<string, string[]> = {};
  (progresso.data ?? []).forEach((p) => (prog[p.usuario_id] ??= []).push(p.aula_id));
  trocarObjeto(D.progresso, prog);
  const l = logo.data;
  trocarObjeto(D.marca, {
    logo: l
      ? {
          nome: l.nome,
          url: supabase.storage.from("marca").getPublicUrl(l.arquivo_path).data.publicUrl,
          path: l.arquivo_path,
          tamanhoBytes: Number(l.tamanho_bytes),
          largura: l.largura ?? 0,
          altura: l.altura ?? 0,
          enviadoEm: l.enviado_em,
          transparente: l.transparente,
        }
      : null,
  });
  trocarLista(D.chamados, (chamados.data ?? []).map(paraChamado));
  trocarLista(P.chamadosOutras, []);
  trocarLista(P.clientes, []);
  trocarLista(P.pedidosUpgrade, (pedidos?.data ?? []).map(paraPedido));
  Object.assign(ctx, { modo: "real", imobId: imob, userId: conta.usuarioId, papel, ranking, mercado });
  avisar();
}

// ---------- Ranking e mercado (corretor) ----------

async function carregarRanking(imob: string, meses: number) {
  const lista = lastMonths(meses);
  const res = await Promise.all(lista.map((m) => supabase.rpc("ranking_mes", { p_imob: imob, p_mes: `${m.key}-01` })));
  const out: Record<string, LinhaRanking[]> = {};
  res.forEach((r, k) => {
    out[lista[k].key] = (r.data ?? []).map((x: any) => ({
      corretorId: x.corretor_id,
      vgv: Number(x.vgv),
      alugados: x.alugados,
      captados: x.captados,
      atendidos: x.atendidos,
      vgc: Number(x.vgc ?? 0),
    }));
  });
  return out;
}

async function carregarMercado(imob: string) {
  const [f, o] = await Promise.all([supabase.rpc("estudo_mercado", { p_imob: imob }), supabase.rpc("ofertas_mercado", { p_imob: imob })]);
  const fechados: LinhaMercado[] = (f.data ?? []).map((r: any) => {
    const im: Imovel = {
      id: `m-im-${r.transacao_id}`,
      categoria: r.categoria as CategoriaImovel,
      nome: u(r.imovel_nome),
      endereco: { logradouro: r.logradouro, numero: r.numero, bairro: r.bairro, cidade: "", uf: "" },
      criadoEm: r.captado_em,
    };
    const c = {
      id: `m-cp-${r.transacao_id}`,
      corretorId: "",
      proprietarioId: "",
      imovelId: im.id,
      unidade: u(r.unidade),
      finalidade: r.tipo,
      valor: Number(r.valor),
      areaM2: Number(r.area_m2),
      status: "vendida",
      captadoEm: r.captado_em,
      checklistCaptacao: [],
      checklistMarketing: [],
    } as Captacao;
    const t: Transacao = { id: r.transacao_id, tipo: r.tipo as Transacao["tipo"], captacaoId: c.id, valor: Number(r.valor), honorariosPct: 0, data: r.data, participantes: [] };
    return { t, c, im };
  });
  const ofertas: OfertaMercado[] = (o.data ?? []).map((r: any, k: number) => ({
    c: { id: `m-of-${k}`, finalidade: r.finalidade, valor: Number(r.valor), areaM2: Number(r.area_m2), status: "ativa" } as Captacao,
    im: { id: `m-of-im-${k}`, categoria: r.categoria as CategoriaImovel, endereco: { logradouro: "", numero: "", bairro: r.bairro, cidade: "", uf: "" }, criadoEm: "" },
  }));
  return { fechados, ofertas };
}

let rankingPendente: ReturnType<typeof setTimeout> | undefined;
/** Depois de uma gravação do corretor, atualiza o ranking do mês atual. */
function atualizarRanking() {
  if (ctx.papel !== "corretor" || !ctx.imobId) return;
  clearTimeout(rankingPendente);
  rankingPendente = setTimeout(async () => {
    const r = await carregarRanking(ctx.imobId, 1);
    if (ctx.ranking) Object.assign(ctx.ranking, r);
    avisar();
  }, 800);
}

// ---------- Gravações ----------

let avisarErro: (texto: string) => void = () => {};
let recarregar: () => void = () => {};
export function configurarGravacao(opts: { aviso: (texto: string) => void; recarregar: () => void }) {
  avisarErro = opts.aviso;
  recarregar = opts.recarregar;
}

/** Recarrega tudo do banco (ex.: depois de mudar a equipe). */
export const recarregarDados = () => recarregar();

/**
 * Grava no banco (só no login real). A tela já mostrou a mudança; se o banco recusar,
 * avisa e recarrega os dados verdadeiros.
 */
export function gravar(...ops: (() => PromiseLike<{ error: unknown }>)[]) {
  if (ctx.modo !== "real") return Promise.resolve(true);
  return enfileirar(async () => {
    for (const op of ops) {
      const { error } = await op();
      if (error) {
        falhou(error);
        return false;
      }
    }
    atualizarRanking();
    return true;
  });
}

/** Avisa que o banco recusou uma gravação e recarrega os dados verdadeiros. */
export function falhou(error: unknown) {
  avisarErro(`Não foi possível salvar: ${mensagemErro(error)}`);
  recarregar();
}

// As gravações vão ao banco na ordem em que aconteceram (ex.: o proprietário novo antes da captação dele).
let fila: Promise<unknown> = Promise.resolve();
export function enfileirar<T>(f: () => Promise<T>): Promise<T> {
  const p = fila.then(f, f);
  fila = p.catch(() => undefined);
  return p;
}

/** Identificador novo: no banco precisa ser um UUID. */
export const novoId = (prefixo: string) =>
  ctx.modo === "real" ? crypto.randomUUID() : `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const ehReal = () => ctx.modo === "real";
export const contexto = ctx;

// ---------- Conversões telas → banco ----------

export const leadParaBanco = (l: Lead) => ({
  id: l.id,
  imobiliaria_id: ctx.imobId,
  corretor_id: l.corretorId,
  nome: l.nome,
  telefone: l.telefone,
  origem: l.origem,
  interesse: l.interesse,
  etapa: l.etapa,
  checklist: l.checklist,
  visita_em: l.visitaEm ?? null,
  observacoes: l.observacoes ?? null,
  criado_em: l.criadoEm,
});

export const compromissoParaBanco = (c: Compromisso) => ({
  id: c.id,
  imobiliaria_id: ctx.papel === "frankkia" ? null : ctx.imobId,
  dono_id: c.donoId,
  titulo: c.titulo,
  tipo: c.tipo,
  inicio: c.inicio,
  fim: c.fim,
  lead_id: c.leadId ?? null,
  captacao_id: c.captacaoId ?? null,
  local: c.local ?? null,
  observacoes: c.observacoes ?? null,
});

export { supabase };
