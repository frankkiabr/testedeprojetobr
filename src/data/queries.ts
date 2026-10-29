/**
 * CÁLCULOS DA PLATAFORMA (VGV, locação, VGC, rankings, pendências, mercado, aniversários).
 * As telas só usam estas funções. No login real, as listas são preenchidas com os dados do banco (`sync.ts`).
 */
import {
  admin,
  captacoes,
  compromissos,
  convites,
  corretores,
  fechamentos,
  imobiliaria,
  imoveis,
  anuncios,
  leads,
  outrosMembros,
  parceiros,
  progresso,
  proprietarios,
  transacoes,
} from "./demo";
import type { Captacao, Endereco, Finalidade, Imovel, Lead, Participante, Transacao, Trilha, Usuario } from "./types";
import { ctx, OUTROS_PARTICIPANTES, type LinhaMercado, type OfertaMercado } from "./contexto";

const DAY = 864e5;

/** Escopo: sem corretorId = equipe inteira (visão do administrador). */
export type Scope = { corretorId?: string };

const inScope = (corretorId: string, s: Scope) => !s.corretorId || s.corretorId === corretorId;
export const monthKey = (iso: string | Date) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Últimos n meses, do mais antigo ao atual. */
export function lastMonths(n = 6) {
  const out: { key: string; short: string; long: string }[] = [];
  const base = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const short = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const long = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    out.push({ key: monthKey(d), short: short[0].toUpperCase() + short.slice(1), long: long[0].toUpperCase() + long.slice(1) });
  }
  return out;
}

export const previousMonth = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 2, 1));
};

export const atendido = (l: Lead) => l.checklist.some(Boolean);
export const leadsOf = (s: Scope) => leads.filter((l) => inScope(l.corretorId, s));
export const leadById = (id: string) => leads.find((l) => l.id === id);

// ---------- Pessoas ----------

export function userById(id: string): Usuario | undefined {
  return id === admin.id ? admin : (corretores.find((c) => c.id === id) ?? outrosMembros.find((c) => c.id === id));
}
export const parceiroById = (id: string) => parceiros.find((p) => p.id === id);
export const participanteNome = (p: Participante) =>
  p.refId === OUTROS_PARTICIPANTES ? "Outros participantes" : ((p.tipo === "corretor" ? userById(p.refId)?.nome : parceiroById(p.refId)?.nome) ?? "—");
/** Foto (ou iniciais) de quem participou de uma venda: corretor da equipe ou parceiro externo. */
export function participanteAvatar(p: Participante) {
  const nome = participanteNome(p);
  const iniciais = nome
    .split(/s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");
  const fotoUrl = p.refId === OUTROS_PARTICIPANTES ? undefined : p.tipo === "corretor" ? userById(p.refId)?.fotoUrl : parceiroById(p.refId)?.fotoUrl;
  return { id: p.refId || nome, nome, iniciais, fotoUrl };
}
export const creciLabel = (u: Pick<Usuario, "creci" | "creciUF" | "estagiario">) =>
  u.estagiario ? "Estagiário(a)" : u.creci ? `CRECI ${u.creci}${u.creciUF ? `/${u.creciUF}` : ""}` : "CRECI pendente";

// ---------- Imóveis e captações ----------

export const imovelById = (id: string) => imoveis.find((i) => i.id === id);
export const captacaoById = (id: string) => captacoes.find((c) => c.id === id);
export const enderecoCurto = (e: Endereco) => `${e.logradouro}, ${e.numero} · ${e.bairro}`;
export const enderecoCompleto = (e: Endereco) => `${e.logradouro}, ${e.numero}, ${e.bairro}, ${e.cidade}, ${e.uf}`;
/** Nome do imóvel: o nome do edifício ou, sem nome, o endereço. */
export const imovelNome = (im: Imovel) => im.nome ?? `${im.endereco.logradouro}, ${im.endereco.numero}`;

/** Título curto de uma captação: "Apto 302 · Edifício Aurora" ou "Casa · Rua do Sol, 120". */
/**
 * Unidade com o rótulo certo: só o número ("302") vira "Apto 302" (apartamento) ou "Sala 302" (sala comercial);
 * textos que já têm o tipo ("Cobertura 1801", "Studio 504") ficam como estão.
 */
export function rotuloUnidade(categoria: string, unidade?: string) {
  const u = unidade?.trim();
  if (!u) return undefined;
  if (/^[a-zà-ú]/i.test(u)) return u;
  if (categoria === "Apartamento") return `Apto ${u}`;
  if (categoria === "Sala comercial") return `Sala ${u}`;
  return `Unidade ${u}`;
}

export function captacaoTitulo(c: Captacao) {
  const im = imovelById(c.imovelId);
  if (!im) return c.unidade ?? "Captação";
  const unidade = rotuloUnidade(im.categoria, c.unidade);
  return unidade ? `${unidade} · ${imovelNome(im)}` : `${im.categoria} · ${imovelNome(im)}`;
}
export const captacaoBairro = (c: Captacao) => imovelById(c.imovelId)?.endereco.bairro ?? "";
export const captacaoCategoria = (c: Captacao) => imovelById(c.imovelId)?.categoria ?? "Apartamento";

/** Foto de capa do anúncio da captação (ou do imóvel, pela primeira captação com foto). */
export const fotoCapa = (captacaoId: string) => anuncios.find((a) => a.captacaoId === captacaoId)?.fotos[0]?.url;
export const fotoDoImovel = (imovelId: string) =>
  captacoes.filter((c) => c.imovelId === imovelId).map((c) => fotoCapa(c.id)).find(Boolean);

export const captacoesOf = (s: Scope) => captacoes.filter((c) => inScope(c.corretorId, s));
export const captacoesDoProprietario = (pid: string) => captacoes.filter((c) => c.proprietarioId === pid);
export const captacoesDoImovel = (iid: string) => captacoes.filter((c) => c.imovelId === iid);
export const proprietariosOf = (s: Scope) => proprietarios.filter((p) => inScope(p.corretorId, s));
export const proprietarioById = (id: string) => proprietarios.find((p) => p.id === id);
export const done = (c: Captacao) => c.checklistMarketing.filter(Boolean).length;
export const doneCaptacao = (c: Captacao) => c.checklistCaptacao.filter(Boolean).length;

// ---------- Transações (vendas e locações) ----------

export const honorarios = (t: Transacao) => (t.valor * t.honorariosPct) / 100;
export const somaPct = (t: Transacao) => t.participantes.reduce((s, p) => s + p.pct, 0);
export const parteDe = (t: Transacao, p: Participante) => (honorarios(t) * p.pct) / 100;
export const parteImobiliaria = (t: Transacao) => honorarios(t) * Math.max(0, 1 - somaPct(t) / 100);
export const participa = (t: Transacao, corretorId: string) => t.participantes.some((p) => p.tipo === "corretor" && p.refId === corretorId);
/** Corretor "principal" da transação (o primeiro corretor da equipe na divisão). */
export const corretorPrincipal = (t: Transacao) => t.participantes.find((p) => p.tipo === "corretor")?.refId ?? "";

/** Quanto do valor e da comissão é creditado a um corretor (proporcional à sua parte). */
export function creditoDe(t: Transacao, corretorId: string) {
  const p = t.participantes.find((x) => x.tipo === "corretor" && x.refId === corretorId);
  if (!p) return { valor: 0, comissao: 0 };
  return { valor: (t.valor * p.pct) / (somaPct(t) || 1), comissao: parteDe(t, p) };
}

export const transacoesOf = (s: Scope, month?: string) =>
  transacoes.filter((t) => (!s.corretorId || participa(t, s.corretorId)) && (!month || monthKey(t.data) === month));

export const fechamentosPendentes = (s: Scope) => fechamentos.filter((f) => f.status === "pendente" && inScope(f.corretorId, s));

export function metrics(scope: Scope, month: string) {
  const txs = transacoesOf(scope, month);
  const val = (t: Transacao) => (scope.corretorId ? creditoDe(t, scope.corretorId).valor : t.valor);
  const com = (t: Transacao) =>
    scope.corretorId ? creditoDe(t, scope.corretorId).comissao : t.participantes.filter((p) => p.tipo === "corretor").reduce((s, p) => s + parteDe(t, p), 0);
  const vendas = txs.filter((t) => t.tipo === "venda");
  const locs = txs.filter((t) => t.tipo === "locacao");
  const l = leads.filter((x) => inScope(x.corretorId, scope) && monthKey(x.criadoEm) === month);
  const atendidos = l.filter(atendido).length;
  const vgv = vendas.reduce((s, t) => s + val(t), 0);
  const meta = scope.corretorId ? (userById(scope.corretorId)?.metaMensalVGV ?? 0) : imobiliaria.metaMensalVGV;
  return {
    vgv,
    volLocacao: locs.reduce((s, t) => s + val(t), 0),
    vgc: txs.reduce((s, t) => s + com(t), 0),
    receitaImob: scope.corretorId ? 0 : txs.reduce((s, t) => s + parteImobiliaria(t), 0),
    vendidos: vendas.length,
    alugados: locs.length,
    captados: captacoes.filter((x) => inScope(x.corretorId, scope) && monthKey(x.captadoEm) === month).length,
    leads: l.length,
    atendidos,
    taxa: l.length ? (atendidos / l.length) * 100 : 0,
    meta,
    metaPct: meta ? (vgv / meta) * 100 : 0,
  };
}
export type Metrics = ReturnType<typeof metrics>;

export const series = (scope: Scope, n = 6) => lastMonths(n).map((m) => ({ ...m, ...metrics(scope, m.key) }));

export type RankingKind = "vgv" | "alugados" | "captados" | "atendidos" | "vgc";
export const RANKING_LABELS: Record<RankingKind, string> = {
  vgv: "VGV",
  alugados: "Locações",
  captados: "Captações",
  atendidos: "Leads atendidos",
  vgc: "VGC",
};

export function ranking(kind: RankingKind, month: string) {
  // Login real do corretor: os números da equipe vêm do banco (ranking_mes), sem expor dados dos colegas.
  const doBanco = ctx.ranking?.[month];
  if (doBanco)
    return corretoresAtivos()
      .map((c) => ({ user: c, value: doBanco.find((r) => r.corretorId === c.id)?.[kind] ?? 0 }))
      .sort((a, b) => b.value - a.value);
  return corretoresAtivos()
    .map((c) => ({ user: c, value: metrics({ corretorId: c.id }, month)[kind] }))
    .sort((a, b) => b.value - a.value);
}

export const position = (userId: string, kind: RankingKind, month: string) =>
  ranking(kind, month).findIndex((r) => r.user.id === userId) + 1;

// ---------- Visão geral ----------

/** Lead atrasado: mais de 5 dias sem contato e ainda em aberto (nem fechado, nem perdido). */
export const DIAS_ATRASO = 5;
export const diasSemContato = (l: Lead) => Math.max(0, Math.floor((Date.now() - new Date(l.ultimoContato ?? l.criadoEm).getTime()) / 864e5));
export const emAberto = (l: Lead) => l.etapa !== "fechado" && l.etapa !== "perdido";
export const atrasado = (l: Lead) => emAberto(l) && diasSemContato(l) > DIAS_ATRASO;
export const leadsAtrasados = (scope: Scope) =>
  leads.filter((l) => inScope(l.corretorId, scope) && atrasado(l)).sort((a, b) => diasSemContato(b) - diasSemContato(a));

/** Lead do rodízio ainda sem o primeiro contato (é o que o repasse automático confere). */
export const aguardandoRodizio = (l: Lead) =>
  !!l.rodizio && !l.voltouAoAdmin && l.etapa === "novo" && !l.ultimoContato && !l.checklist.some(Boolean);
/** Até quando o corretor tem para o primeiro contato antes de o lead passar para o próximo (sem prazo = null). */
export function prazoRodizio(l: Lead) {
  const min = imobiliaria.rodizio?.ativo ? imobiliaria.rodizio.minutos : null;
  if (!min || !aguardandoRodizio(l) || !l.atribuidoEm) return null;
  return new Date(new Date(l.atribuidoEm).getTime() + min * 60_000);
}

export const leadsSemAtendimento = (scope: Scope) =>
  leads.filter((l) => inScope(l.corretorId, scope) && !atendido(l) && l.etapa === "novo").sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));

export const proximasVisitas = (scope: Scope) =>
  leads
    .filter((l) => inScope(l.corretorId, scope) && l.visitaEm && new Date(l.visitaEm).getTime() >= Date.now())
    .sort((a, b) => a.visitaEm!.localeCompare(b.visitaEm!));

export const marketingPendente = (scope: Scope) =>
  captacoes.filter((c) => inScope(c.corretorId, scope) && c.status === "ativa" && c.checklistMarketing.some((x) => !x)).sort((a, b) => done(a) - done(b));

export type Atividade = { id: string; tipo: "lead" | "captacao" | "venda" | "locacao"; data: string; corretorId: string; texto: string; valor?: number };

export function atividades(scope: Scope, n = 8): Atividade[] {
  const out: Atividade[] = [
    ...leads.filter((l) => inScope(l.corretorId, scope)).slice(0, n).map((l) => ({
      id: l.id,
      tipo: "lead" as const,
      data: l.criadoEm,
      corretorId: l.corretorId,
      texto: `cadastrou o lead ${l.nome}`,
    })),
    ...captacoes.filter((c) => inScope(c.corretorId, scope)).slice(0, n).map((c) => ({
      id: c.id,
      tipo: "captacao" as const,
      data: c.captadoEm,
      corretorId: c.corretorId,
      texto: `captou ${captacaoTitulo(c)} para ${c.finalidade === "venda" ? "venda" : "locação"}`,
    })),
    ...transacoesOf(scope).slice(0, n).map((t) => {
      const c = captacaoById(t.captacaoId)!;
      return {
        id: t.id,
        tipo: t.tipo,
        data: t.data,
        corretorId: scope.corretorId ?? corretorPrincipal(t),
        texto: `${t.tipo === "venda" ? "vendeu" : "alugou"} ${captacaoTitulo(c)}`,
        valor: t.valor,
      };
    }),
  ];
  return out.sort((a, b) => b.data.localeCompare(a.data)).slice(0, n);
}

// ---------- Equipe e plano ----------

export const corretoresAtivos = () => corretores.filter((c) => c.ativo !== false);
export const corretoresInativos = () => corretores.filter((c) => c.ativo === false);
export const equipeAtiva = () => corretoresAtivos().length;
/** Vagas ocupadas = corretores ativos + convites pendentes. */
export const vagasUsadas = () => equipeAtiva() + convites.length;
export const vagasLivres = () => Math.max(0, imobiliaria.limiteCorretores - vagasUsadas());
export const usoDoPlano = () => vagasUsadas() / imobiliaria.limiteCorretores;

// ---------- Aniversários ----------

/** Dias até o próximo aniversário (0 = hoje). */
export function diasAteAniversario(u: Usuario): number | null {
  if (!u.aniversario) return null;
  const [, m, d] = u.aniversario.split("-").map(Number);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prox = new Date(hoje.getFullYear(), m - 1, d);
  if (prox < hoje) prox.setFullYear(prox.getFullYear() + 1);
  return Math.round((prox.getTime() - hoje.getTime()) / DAY);
}

export function idadeQueCompleta(u: Usuario) {
  if (!u.aniversario) return null;
  const ano = Number(u.aniversario.slice(0, 4));
  const dias = diasAteAniversario(u) ?? 0;
  const anoAniv = new Date(Date.now() + dias * DAY).getFullYear();
  return anoAniv - ano;
}

/** Aniversariantes da imobiliária (administrador + corretores ativos) nos próximos n dias. */
export const aniversariantes = (ateDias: number) =>
  [admin, ...corretoresAtivos()]
    .map((u) => ({ user: u, dias: diasAteAniversario(u) }))
    .filter((x): x is { user: Usuario; dias: number } => x.dias !== null && x.dias <= ateDias)
    .sort((a, b) => a.dias - b.dias);

// ---------- Estudo de mercado ----------

export type FiltroMercado = { tipo: Finalidade; categoria: string; bairro: string; meses: number };

/** Negócios fechados e ofertas ativas da imobiliária inteira (no login real do corretor, vêm do banco sem nomes). */
function baseMercado(): { fechados: LinhaMercado[]; ofertas: OfertaMercado[] } {
  if (ctx.mercado) return ctx.mercado;
  const fechados: LinhaMercado[] = [];
  transacoes.forEach((t) => {
    const c = captacaoById(t.captacaoId);
    const im = c && imovelById(c.imovelId);
    if (c && im) fechados.push({ t, c, im });
  });
  const ofertas: OfertaMercado[] = [];
  captacoes.forEach((c) => {
    const im = c.status === "ativa" ? imovelById(c.imovelId) : undefined;
    if (im) ofertas.push({ c, im });
  });
  return { fechados, ofertas };
}

const unicos = (xs: string[]) => [...new Set(xs)].filter(Boolean).sort((a, b) => a.localeCompare(b));

/** Bairros que aparecem nos negócios e nas ofertas (filtro do estudo de mercado). */
export function bairrosMercado() {
  const b = baseMercado();
  return unicos([...b.fechados.map((r) => r.im.endereco.bairro), ...b.ofertas.map((r) => r.im.endereco.bairro)]);
}

/** Bairros já cadastrados nos imóveis (sugestões ao cadastrar um imóvel novo). */
export const bairrosCadastrados = () => unicos(imoveis.map((i) => i.endereco.bairro));

const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

export function mercado(f: FiltroMercado) {
  const limite = f.meses ? Date.now() - f.meses * 30 * DAY : 0;
  const passa = (im: Imovel) => (!f.categoria || im.categoria === f.categoria) && (!f.bairro || im.endereco.bairro === f.bairro);

  const base = baseMercado();
  const linhas = base.fechados
    .filter(({ t }) => t.tipo === f.tipo && new Date(t.data).getTime() >= limite)
    .map(({ t, c, im }) => ({ t, c, im, m2: t.valor / c.areaM2, dias: (new Date(t.data).getTime() - new Date(c.captadoEm).getTime()) / DAY }))
    .filter((r) => passa(r.im))
    .sort((a, b) => b.t.data.localeCompare(a.t.data));

  // Oferta atual (captações ativas) para comparar preço pedido × preço fechado
  const oferta = base.ofertas.filter((r) => r.c.finalidade === f.tipo && passa(r.im)).map((r) => r.c.valor / r.c.areaM2);

  const agrupar = (chave: (r: (typeof linhas)[number]) => string) => {
    const g = new Map<string, typeof linhas>();
    linhas.forEach((r) => g.set(chave(r), [...(g.get(chave(r)) ?? []), r]));
    return [...g.entries()]
      .map(([nome, rs]) => ({ nome, qtd: rs.length, valorMedio: media(rs.map((r) => r.t.valor)), m2Medio: media(rs.map((r) => r.m2)), diasMedio: media(rs.map((r) => r.dias)) }))
      .sort((a, b) => b.m2Medio - a.m2Medio);
  };

  return {
    linhas,
    resumo: {
      qtd: linhas.length,
      valorMedio: media(linhas.map((r) => r.t.valor)),
      areaMedia: media(linhas.map((r) => r.c.areaM2)),
      m2Medio: media(linhas.map((r) => r.m2)),
      diasMedio: media(linhas.map((r) => r.dias)),
      ofertaM2: media(oferta),
      ofertaQtd: oferta.length,
    },
    porBairro: agrupar((r) => r.im.endereco.bairro),
    porCategoria: agrupar((r) => r.im.categoria),
  };
}

// ---------- Agenda ----------

/** Compromissos de um conjunto de pessoas dentro de um intervalo de datas. */
export const compromissosDe = (donoIds: string[], de: Date, ate: Date) =>
  compromissos
    .filter((c) => donoIds.includes(c.donoId) && new Date(c.fim) > de && new Date(c.inicio) < ate)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

export const proximosCompromissos = (donoIds: string[], n = 5) =>
  compromissos
    .filter((c) => donoIds.includes(c.donoId) && new Date(c.fim).getTime() >= Date.now())
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .slice(0, n);

// ---------- Academy ----------

export function progressoTrilha(userId: string, t: Trilha) {
  const feitas = progresso[userId] ?? [];
  const n = t.aulas.length;
  const k = t.aulas.filter((a) => feitas.includes(a.id)).length;
  return { k, n, pct: n ? k / n : 0 };
}

export function progressoEquipe(t: Trilha) {
  const ativos = corretoresAtivos();
  if (!ativos.length || !t.aulas.length) return 0;
  return ativos.reduce((s, c) => s + progressoTrilha(c.id, t).pct, 0) / ativos.length;
}

export const aulaConcluida = (userId: string, aulaId: string) => (progresso[userId] ?? []).includes(aulaId);
export const duracaoTrilha = (t: Trilha) => t.aulas.reduce((s, a) => s + (a.duracaoMin ?? 0), 0);

/** Pessoa para exibir (nunca vazia): quem saiu da equipe ou não está visível aparece como "Usuário removido". */
export const pessoa = (id: string): Usuario =>
  userById(id) ?? { id: id || "?", imobiliariaId: "", nome: "Usuário removido", email: "", papel: "corretor", iniciais: "?" };
