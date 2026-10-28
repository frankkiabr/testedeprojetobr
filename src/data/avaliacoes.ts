/**
 * ESTUDOS DE MERCADO (Estudo de mercado → Estudos), no estilo do BrokerApp com o jeito Frankkia.
 * O corretor cria o estudo com todos os dados do imóvel de uma vez e junta amostras parecidas:
 * de um portal (link do VivaReal/Zap/OLX, lido pela função ler-anuncio), do radar (anúncios do portal
 * Frankkia e captações) ou digitadas. Valores: Improvável, Valor de mercado e Urgência na venda.
 * Login real: tabelas avaliacoes e avaliacao_amostras (cada corretor vê os próprios; o administrador vê todos).
 * Demonstração: tudo fica na memória.
 */
import { supabase } from "@/integrations/frankkia/client";
import type { Database } from "@/integrations/frankkia/types";
import type { Finalidade } from "./types";
import { calcularValores } from "@/lib/estudo-calculo";

export type Infra = "nao" | "parcial" | "completa";
export type Portaria = "nao" | "parcial" | "24h";

export type Amostra = {
  id: string;
  avaliacaoId: string;
  origem: "link" | "manual" | "radar" | "vendido";
  portal?: string;
  url?: string;
  titulo?: string;
  endereco?: string;
  valor: number;
  areaM2: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  portaria?: Portaria;
  infraestrutura?: Infra;
  anoConstrucao?: number;
  bairro?: string;
  fotoUrl?: string;
  usar: boolean;
};

/** Tipos do "Novo estudo" (como no BrokerApp); `categoria` guarda o rótulo escolhido. */
export const TIPOS_ESTUDO = [
  { valor: "Apartamento", rotulo: "Apartamento / Studio / Flat" },
  { valor: "Casa", rotulo: "Casa / Casa em condomínio / Sobrado" },
  { valor: "Cobertura", rotulo: "Cobertura" },
  { valor: "Sala comercial", rotulo: "Sala comercial / Loja" },
  { valor: "Terreno", rotulo: "Terreno / Lotes" },
  { valor: "Outros", rotulo: "Outros / Galpão / Fazenda" },
] as const;

export type DadosImovel = {
  titulo: string;
  finalidade: Finalidade;
  categoria: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  lat?: number;
  lng?: number;
  dataVisita?: string;
  areaM2: number;
  areaTerreno?: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  anoConstrucao?: number;
  emCondominio?: boolean;
  infraestrutura?: Infra;
  portaria?: Portaria;
  orientacaoSolar?: "nascente" | "poente" | "norte" | "sul" | "mista";
  conservacao?: "reformar" | "regular" | "bom" | "otimo" | "novo";
  mobilia?: "nao" | "semi" | "mobiliado";
  valorAnunciado?: number;
  observacoes?: string;
  fotoUrl?: string;
  proprietarioId?: string;
  captacaoId?: string;
};

export type Situacao = { apresentado: boolean; exclusividade: boolean; vendido: boolean; expirado: boolean; linkLiberado: boolean };
export type Ajustes = {
  ajusteImprovavel: number;
  ajusteMercado: number;
  ajusteUrgencia: number;
  mostrarImprovavel: boolean;
  mostrarMercado: boolean;
  mostrarUrgencia: boolean;
  /** Considerar conservação, idade, portaria etc. no valor (ajuste por características). */
  usarVariaveis: boolean;
};

export type Avaliacao = DadosImovel &
  Situacao &
  Ajustes & {
    id: string;
    corretorId: string;
    criadoEm: string;
    /** Código do link da apresentação (/estudo/<token>). */
    token?: string;
    amostras: Amostra[];
  };

/** O que a leitura de um anúncio devolve (função ler-anuncio). */
export type AnuncioLido = {
  portal: string;
  url: string;
  titulo?: string;
  finalidade?: Finalidade;
  valor?: number;
  area?: number;
  quartos?: number;
  banheiros?: number;
  vagas?: number;
  bairro?: string;
  cidade?: string;
  foto?: string;
  completo: boolean;
};

export type NovaAmostra = Omit<Amostra, "id" | "avaliacaoId" | "usar">;

const AJUSTES_PADRAO: Ajustes = {
  ajusteImprovavel: 0,
  ajusteMercado: 10,
  ajusteUrgencia: 20,
  mostrarImprovavel: true,
  mostrarMercado: true,
  mostrarUrgencia: true,
  usarVariaveis: true,
};
const SITUACAO_PADRAO: Situacao = { apresentado: false, exclusividade: false, vendido: false, expirado: false, linkLiberado: true };

const u = <T>(v: T | null) => v ?? undefined;
const n = (v: number | string | null) => (v === null ? undefined : Number(v));
const novoId = () => crypto.randomUUID();

// ---------- Cálculo ----------

/**
 * Improvável = preço médio do m² das amostras marcadas × área privativa (menos o ajuste dele).
 * Valor de mercado e Urgência na venda = Improvável sem ajuste, decrescido dos respectivos %.
 */
export function resultado(a: Avaliacao) {
  const usadas = a.amostras.filter((x) => x.usar && x.valor > 0 && x.areaM2 > 0);
  const v = calcularValores({
    amostras: usadas.map((x) => ({ valor: x.valor, area: x.areaM2 })),
    area: a.areaM2,
    ajusteImprovavel: a.ajusteImprovavel,
    ajusteMercado: a.ajusteMercado,
    ajusteUrgencia: a.ajusteUrgencia,
    usarVariaveis: a.usarVariaveis,
    caracteristicas: a,
  });
  if (!v) return null;
  return {
    ...v,
    qtd: usadas.length,
    areaMedia: usadas.reduce((t, x) => t + x.areaM2, 0) / usadas.length,
    valorMedio: usadas.reduce((t, x) => t + x.valor, 0) / usadas.length,
  };
}

/** Funil dos estudos: criados → apresentados → assinados → vendidos (e suspensos). */
export function funil(lista: Avaliacao[]) {
  const criados = lista.length;
  const pct = (x: number) => (criados ? Math.round((x / criados) * 100) : 0);
  const apresentados = lista.filter((a) => a.apresentado).length;
  const assinados = lista.filter((a) => a.exclusividade).length;
  const vendidos = lista.filter((a) => a.vendido).length;
  const suspensos = lista.filter((a) => a.expirado).length;
  return [
    { rotulo: "Criados", qtd: criados, pct: criados ? 100 : 0 },
    { rotulo: "Apresentados", qtd: apresentados, pct: pct(apresentados) },
    { rotulo: "Assinados", qtd: assinados, pct: pct(assinados) },
    { rotulo: "Vendidos", qtd: vendidos, pct: pct(vendidos) },
    { rotulo: "Suspensos", qtd: suspensos, pct: pct(suspensos) },
  ];
}

// ---------- Banco ↔ app ----------

type LinhaEstudo = Database["public"]["Tables"]["avaliacoes"]["Row"];
type LinhaAmostra = Database["public"]["Tables"]["avaliacao_amostras"]["Row"];

const deAmostra = (x: LinhaAmostra): Amostra => ({
  id: x.id,
  avaliacaoId: x.avaliacao_id,
  origem: x.origem as Amostra["origem"],
  portal: u(x.portal),
  url: u(x.url),
  titulo: u(x.titulo),
  endereco: u(x.endereco),
  valor: Number(x.valor),
  areaM2: Number(x.area_m2),
  quartos: u(x.quartos),
  suites: u(x.suites),
  banheiros: u(x.banheiros),
  vagas: u(x.vagas),
  portaria: u(x.portaria) as Portaria | undefined,
  infraestrutura: u(x.infraestrutura) as Infra | undefined,
  anoConstrucao: u(x.ano_construcao),
  bairro: u(x.bairro),
  fotoUrl: u(x.foto_url),
  usar: x.usar,
});

const deEstudo = (x: LinhaEstudo, amostras: Amostra[]): Avaliacao => ({
  id: x.id,
  corretorId: x.corretor_id,
  criadoEm: x.criado_em,
  token: x.token,
  titulo: x.titulo,
  finalidade: x.finalidade as Finalidade,
  categoria: x.categoria,
  cep: u(x.cep),
  logradouro: u(x.logradouro),
  numero: u(x.numero),
  complemento: u(x.complemento),
  bairro: u(x.bairro),
  cidade: u(x.cidade),
  uf: u(x.uf),
  lat: u(x.lat),
  lng: u(x.lng),
  dataVisita: u(x.data_visita),
  areaM2: Number(x.area_m2),
  areaTerreno: n(x.area_terreno),
  quartos: u(x.quartos),
  suites: u(x.suites),
  banheiros: u(x.banheiros),
  vagas: u(x.vagas),
  anoConstrucao: u(x.ano_construcao),
  emCondominio: u(x.em_condominio),
  infraestrutura: u(x.infraestrutura) as Infra | undefined,
  portaria: u(x.portaria) as Portaria | undefined,
  orientacaoSolar: u(x.orientacao_solar) as DadosImovel["orientacaoSolar"],
  conservacao: u(x.conservacao) as DadosImovel["conservacao"],
  mobilia: u(x.mobilia) as DadosImovel["mobilia"],
  valorAnunciado: n(x.valor_anunciado),
  observacoes: u(x.observacoes),
  fotoUrl: u(x.foto_url),
  proprietarioId: u(x.proprietario_id),
  captacaoId: u(x.captacao_id),
  ajusteImprovavel: Number(x.ajuste_improvavel),
  ajusteMercado: Number(x.ajuste_mercado),
  ajusteUrgencia: Number(x.ajuste_urgencia),
  mostrarImprovavel: x.mostrar_improvavel,
  mostrarMercado: x.mostrar_mercado,
  mostrarUrgencia: x.mostrar_urgencia,
  usarVariaveis: x.usar_variaveis,
  apresentado: x.apresentado,
  exclusividade: x.exclusividade,
  vendido: x.vendido,
  expirado: x.expirado,
  linkLiberado: x.link_liberado,
  amostras,
});

/** Campos do estudo no formato do banco (só os informados). */
function paraBanco(p: Partial<Avaliacao>) {
  const m: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) m[k] = v === "" ? null : v;
  };
  set("titulo", p.titulo);
  set("finalidade", p.finalidade);
  set("categoria", p.categoria);
  set("cep", p.cep);
  set("logradouro", p.logradouro);
  set("numero", p.numero);
  set("complemento", p.complemento);
  set("bairro", p.bairro);
  set("cidade", p.cidade);
  set("uf", p.uf);
  set("lat", p.lat);
  set("lng", p.lng);
  set("data_visita", p.dataVisita);
  set("area_m2", p.areaM2);
  set("area_terreno", p.areaTerreno);
  set("quartos", p.quartos);
  set("suites", p.suites);
  set("banheiros", p.banheiros);
  set("vagas", p.vagas);
  set("ano_construcao", p.anoConstrucao);
  set("em_condominio", p.emCondominio);
  set("infraestrutura", p.infraestrutura);
  set("portaria", p.portaria);
  set("orientacao_solar", p.orientacaoSolar);
  set("conservacao", p.conservacao);
  set("mobilia", p.mobilia);
  set("valor_anunciado", p.valorAnunciado);
  set("observacoes", p.observacoes);
  set("foto_url", p.fotoUrl);
  set("proprietario_id", p.proprietarioId);
  set("captacao_id", p.captacaoId);
  set("ajuste_improvavel", p.ajusteImprovavel);
  set("ajuste_mercado", p.ajusteMercado);
  set("ajuste_urgencia", p.ajusteUrgencia);
  set("mostrar_improvavel", p.mostrarImprovavel);
  set("mostrar_mercado", p.mostrarMercado);
  set("mostrar_urgencia", p.mostrarUrgencia);
  set("usar_variaveis", p.usarVariaveis);
  set("apresentado", p.apresentado);
  set("exclusividade", p.exclusividade);
  set("vendido", p.vendido);
  set("expirado", p.expirado);
  set("link_liberado", p.linkLiberado);
  set("corretor_id", p.corretorId);
  return m;
}

function paraBancoAmostra(s: Partial<Amostra>) {
  const m: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) m[k] = v === "" ? null : v;
  };
  set("origem", s.origem);
  set("portal", s.portal);
  set("url", s.url);
  set("titulo", s.titulo);
  set("endereco", s.endereco);
  set("valor", s.valor);
  set("area_m2", s.areaM2);
  set("quartos", s.quartos);
  set("suites", s.suites);
  set("banheiros", s.banheiros);
  set("vagas", s.vagas);
  set("portaria", s.portaria);
  set("infraestrutura", s.infraestrutura);
  set("ano_construcao", s.anoConstrucao);
  set("bairro", s.bairro);
  set("foto_url", s.fotoUrl);
  set("usar", s.usar);
  return m;
}

// ---------- Demonstração ----------

const exemplo = (): Avaliacao[] => [
  {
    ...AJUSTES_PADRAO,
    ...SITUACAO_PADRAO,
    apresentado: true,
    id: "av-exemplo",
    token: "demonstracao",
    corretorId: "",
    criadoEm: new Date().toISOString(),
    titulo: "Marina Souza – Apartamento – Pinheiros – São Paulo",
    finalidade: "venda",
    categoria: "Apartamento",
    logradouro: "Rua dos Pinheiros",
    numero: "870",
    bairro: "Pinheiros",
    cidade: "São Paulo",
    uf: "SP",
    areaM2: 92,
    quartos: 3,
    suites: 1,
    banheiros: 2,
    vagas: 2,
    valorAnunciado: 1_450_000,
    amostras: [
      { id: "am-1", avaliacaoId: "av-exemplo", origem: "manual", titulo: "Apartamento 3 quartos", endereco: "Rua Fradique Coutinho", valor: 1_250_000, areaM2: 88, quartos: 3, suites: 1, banheiros: 2, vagas: 2, bairro: "Pinheiros", usar: true },
      { id: "am-2", avaliacaoId: "av-exemplo", origem: "manual", titulo: "Apartamento 3 quartos", endereco: "Rua Cardeal Arcoverde", valor: 1_390_000, areaM2: 95, quartos: 3, suites: 1, banheiros: 3, vagas: 2, bairro: "Pinheiros", usar: true },
      { id: "am-3", avaliacaoId: "av-exemplo", origem: "manual", titulo: "Apartamento 3 quartos", endereco: "Rua Teodoro Sampaio", valor: 1_420_000, areaM2: 101, quartos: 3, suites: 2, banheiros: 3, vagas: 1, bairro: "Pinheiros", usar: true },
    ],
  },
];
let demo: Avaliacao[] = exemplo();

// ---------- Leitura e gravação ----------

export async function listarAvaliacoes(real: boolean): Promise<Avaliacao[]> {
  if (!real) return demo;
  const [av, am] = await Promise.all([
    supabase.from("avaliacoes").select("*").order("criado_em", { ascending: false }),
    supabase.from("avaliacao_amostras").select("*").order("criado_em"),
  ]);
  if (av.error) throw av.error;
  const amostras = (am.data ?? []).map(deAmostra);
  return (av.data ?? []).map((x) => deEstudo(x, amostras.filter((s) => s.avaliacaoId === x.id)));
}

export async function criarAvaliacao(real: boolean, imobiliariaId: string, corretorId: string, d: DadosImovel): Promise<Avaliacao> {
  const nova: Avaliacao = { ...AJUSTES_PADRAO, ...SITUACAO_PADRAO, ...d, id: novoId(), corretorId, criadoEm: new Date().toISOString(), amostras: [] };
  if (real) {
    const { error } = await supabase.from("avaliacoes").insert({ ...paraBanco(nova), id: nova.id, imobiliaria_id: imobiliariaId } as never);
    if (error) throw error;
  } else demo = [nova, ...demo];
  return nova;
}

/** Grava uma mudança no estudo (dados, ajustes, situação, corretor). */
export async function atualizarAvaliacao(real: boolean, a: Avaliacao, patch: Partial<Avaliacao>) {
  const antes = { ...a };
  Object.assign(a, patch);
  if (!real) return;
  const { error } = await supabase.from("avaliacoes").update(paraBanco(patch) as never).eq("id", a.id);
  if (error) {
    Object.assign(a, antes);
    throw error;
  }
}

export async function duplicarAvaliacao(real: boolean, imobiliariaId: string, corretorId: string, a: Avaliacao): Promise<Avaliacao> {
  const { id: _id, amostras, criadoEm: _c, corretorId: _co, ...resto } = a;
  const copia = await criarAvaliacao(real, imobiliariaId, corretorId, { ...resto, titulo: `${a.titulo} (cópia)` });
  await atualizarAvaliacao(real, copia, {
    ajusteImprovavel: a.ajusteImprovavel,
    ajusteMercado: a.ajusteMercado,
    ajusteUrgencia: a.ajusteUrgencia,
    mostrarImprovavel: a.mostrarImprovavel,
    mostrarMercado: a.mostrarMercado,
    mostrarUrgencia: a.mostrarUrgencia,
    usarVariaveis: a.usarVariaveis,
  });
  for (const s of amostras) {
    const { id: _s, avaliacaoId: _a, usar, ...dados } = s;
    const nova = await adicionarAmostra(real, copia, dados);
    if (!usar) await atualizarAmostra(real, copia, nova, { usar: false });
  }
  return copia;
}

export async function excluirAvaliacao(real: boolean, avaliacaoId: string) {
  if (real) {
    const { error } = await supabase.from("avaliacoes").delete().eq("id", avaliacaoId);
    if (error) throw error;
  } else demo = demo.filter((a) => a.id !== avaliacaoId);
}

export async function adicionarAmostra(real: boolean, a: Avaliacao, d: NovaAmostra): Promise<Amostra> {
  const nova: Amostra = { ...d, id: novoId(), avaliacaoId: a.id, usar: true };
  if (real) {
    const { error } = await supabase.from("avaliacao_amostras").insert({ ...paraBancoAmostra(nova), id: nova.id, avaliacao_id: a.id } as never);
    if (error) throw error;
  }
  a.amostras.push(nova);
  return nova;
}

export async function atualizarAmostra(real: boolean, _a: Avaliacao, s: Amostra, patch: Partial<Amostra>) {
  const antes = { ...s };
  Object.assign(s, patch);
  if (!real) return;
  const { error } = await supabase.from("avaliacao_amostras").update(paraBancoAmostra(patch) as never).eq("id", s.id);
  if (error) {
    Object.assign(s, antes);
    throw error;
  }
}

export async function removerAmostra(real: boolean, a: Avaliacao, amostraId: string) {
  if (real) {
    const { error } = await supabase.from("avaliacao_amostras").delete().eq("id", amostraId);
    if (error) throw error;
  }
  a.amostras = a.amostras.filter((s) => s.id !== amostraId);
}

/** Lê um anúncio pelo link (função ler-anuncio). Na demonstração, só aproveita o que o próprio link informa. */
export async function lerAnuncio(real: boolean, url: string): Promise<{ anuncio?: AnuncioLido; erro?: string }> {
  if (!real) {
    const p = url.toLowerCase();
    const area = Number(p.match(/-(\d+)m2/)?.[1]) || undefined;
    const valor = Number(p.match(/-rs(\d+)/)?.[1]) || undefined;
    if (!area && !valor) return { erro: "NAO_LIDO" };
    return { anuncio: { portal: "demonstração", url, area, valor, quartos: Number(p.match(/-(\d+)-quartos?-/)?.[1]) || undefined, completo: false } };
  }
  const { data, error } = await supabase.functions.invoke("ler-anuncio", { body: { url } });
  const d = data as (AnuncioLido & { erro?: string }) | null;
  if (d && !d.erro && (d.valor || d.area)) return { anuncio: d };
  let motivo = d?.erro;
  if (!motivo && error && "context" in error) {
    try {
      motivo = ((await (error as { context: Response }).context.json()) as { erro?: string }).erro;
    } catch {
      /* sem detalhes */
    }
  }
  return { erro: motivo ?? "FALHA" };
}

// ---------- Apresentação ----------

/** Endereço público da apresentação do estudo (o proprietário abre sem login). */
export const linkApresentacao = (a: Avaliacao) => (a.token ? `${window.location.origin}/estudo/${a.token}` : "");

/** Manda a apresentação por e-mail (função enviar-estudo) e marca o estudo como apresentado. */
export async function enviarEstudoPorEmail(real: boolean, a: Avaliacao, para: string, nome?: string): Promise<{ erro?: string }> {
  if (!real) {
    a.apresentado = true;
    return {};
  }
  const { data, error } = await supabase.functions.invoke("enviar-estudo", { body: { estudoId: a.id, para, nome, origem: window.location.origin } });
  const d = data as { enviado?: boolean; erro?: string } | null;
  if (d?.enviado) {
    a.apresentado = true;
    return {};
  }
  let motivo = d?.erro;
  if (!motivo && error && "context" in error) {
    try {
      motivo = ((await (error as { context: Response }).context.json()) as { erro?: string }).erro;
    } catch {
      /* sem detalhes */
    }
  }
  return { erro: motivo ?? "FALHA_ENVIO" };
}

// ---------- Imóveis vendidos na região ----------

export type Vendido = {
  id: string;
  origem: "frankkia" | "cadastrada";
  categoria: string;
  logradouro?: string;
  bairro: string;
  cidade: string;
  uf?: string;
  area: number;
  quartos?: number;
  vagas?: number;
  valorAnunciado?: number;
  valorVenda: number;
  dataVenda: string;
  dias?: number;
  foto?: string;
  imobiliaria: string;
  corretor?: string;
};

export type FiltroVendidos = { finalidade: Finalidade; cidade?: string; bairro?: string; categoria?: string; meses?: number };

/** Categoria do estudo → categoria do imóvel cadastrado (Cobertura é apartamento; Outros, galpão). */
export const categoriaImovel = (c: string) => (c === "Cobertura" ? "Apartamento" : c === "Outros" ? "Galpão" : c);

const vendidosDemo: Vendido[] = [
  { id: "vd-1", origem: "frankkia", categoria: "Apartamento", logradouro: "Rua Fradique Coutinho", bairro: "Pinheiros", cidade: "São Paulo", uf: "SP", area: 90, quartos: 3, vagas: 2, valorAnunciado: 1_350_000, valorVenda: 1_290_000, dataVenda: new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10), dias: 62, imobiliaria: "Imobiliária Exemplo" },
  { id: "vd-2", origem: "cadastrada", categoria: "Apartamento", logradouro: "Rua Mourato Coelho", bairro: "Pinheiros", cidade: "São Paulo", uf: "SP", area: 84, quartos: 2, vagas: 1, valorAnunciado: 1_100_000, valorVenda: 1_040_000, dataVenda: new Date(Date.now() - 95 * 864e5).toISOString().slice(0, 10), dias: 30, imobiliaria: "Imobiliária Exemplo" },
];

export async function listarVendidos(real: boolean, f: FiltroVendidos): Promise<Vendido[]> {
  if (!real)
    return vendidosDemo.filter(
      (v) => (!f.bairro || v.bairro.toLowerCase() === f.bairro.toLowerCase()) && (!f.categoria || v.categoria === f.categoria),
    );
  const { data, error } = await supabase.rpc("vendidos_regiao", {
    p_finalidade: f.finalidade,
    p_cidade: f.cidade || undefined,
    p_bairro: f.bairro || undefined,
    p_categoria: f.categoria || undefined,
    p_meses: f.meses || undefined,
  });
  if (error) throw error;
  return (data ?? []).map((x) => ({
    id: x.id,
    origem: x.origem as Vendido["origem"],
    categoria: x.categoria,
    logradouro: u(x.logradouro),
    bairro: x.bairro,
    cidade: x.cidade,
    uf: u(x.uf),
    area: Number(x.area),
    quartos: u(x.quartos),
    vagas: u(x.vagas),
    valorAnunciado: n(x.valor_anunciado),
    valorVenda: Number(x.valor_venda),
    dataVenda: x.data_venda,
    dias: u(x.dias),
    foto: u(x.foto),
    imobiliaria: x.imobiliaria,
    corretor: u(x.corretor),
  }));
}

export type NovaVendaExterna = Omit<Vendido, "id" | "origem" | "foto" | "imobiliaria" | "corretor"> & { finalidade: Finalidade };

/** "Cadastrar imóvel vendido": venda que não passou pela Frankkia, para servir de referência nos estudos. */
export async function cadastrarVendaExterna(real: boolean, imobiliariaId: string, corretorId: string, v: NovaVendaExterna) {
  if (!real) {
    vendidosDemo.unshift({ ...v, id: novoId(), origem: "cadastrada", imobiliaria: "Imobiliária Exemplo" });
    return;
  }
  const { error } = await supabase.from("vendas_externas").insert({
    imobiliaria_id: imobiliariaId,
    corretor_id: corretorId,
    finalidade: v.finalidade,
    categoria: v.categoria,
    logradouro: v.logradouro || null,
    bairro: v.bairro,
    cidade: v.cidade,
    uf: v.uf || null,
    area_m2: v.area,
    quartos: v.quartos ?? null,
    vagas: v.vagas ?? null,
    valor_anunciado: v.valorAnunciado ?? null,
    valor_venda: v.valorVenda,
    data_venda: v.dataVenda,
    dias_para_vender: v.dias ?? null,
  });
  if (error) throw error;
}

/** Exclui uma venda cadastrada à mão (o banco só deixa o próprio corretor ou o administrador). */
export async function excluirVendaExterna(real: boolean, id: string) {
  if (!real) {
    const i = vendidosDemo.findIndex((v) => v.id === id);
    if (i >= 0) vendidosDemo.splice(i, 1);
    return;
  }
  const { error, count } = await supabase.from("vendas_externas").delete({ count: "exact" }).eq("id", id);
  if (error) throw error;
  if (!count) throw new Error("APENAS_ADMIN");
}

// ---------- Lembretes, comentários e histórico de preço ----------

export type Nota = { id: string; texto: string; lembreteEm?: string; criadoEm: string; autorId: string };

const notasDemo: Record<string, Nota[]> = {};

export async function listarNotas(real: boolean, avaliacaoId: string): Promise<Nota[]> {
  if (!real) return notasDemo[avaliacaoId] ?? [];
  const { data, error } = await supabase.from("avaliacao_notas").select("*").eq("avaliacao_id", avaliacaoId).order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((x) => ({ id: x.id, texto: x.texto, lembreteEm: u(x.lembrete_em), criadoEm: x.criado_em, autorId: x.autor_id }));
}

export async function adicionarNota(real: boolean, avaliacaoId: string, autorId: string, texto: string, lembreteEm?: string, compromissoId?: string): Promise<Nota> {
  const nota: Nota = { id: novoId(), texto, lembreteEm, criadoEm: new Date().toISOString(), autorId };
  if (real) {
    const { error } = await supabase.from("avaliacao_notas").insert({
      id: nota.id,
      avaliacao_id: avaliacaoId,
      autor_id: autorId,
      texto,
      lembrete_em: lembreteEm ?? null,
      compromisso_id: compromissoId ?? null,
    });
    if (error) throw error;
  } else notasDemo[avaliacaoId] = [nota, ...(notasDemo[avaliacaoId] ?? [])];
  return nota;
}

export async function excluirNota(real: boolean, avaliacaoId: string, notaId: string) {
  if (real) {
    const { error } = await supabase.from("avaliacao_notas").delete().eq("id", notaId);
    if (error) throw error;
  } else notasDemo[avaliacaoId] = (notasDemo[avaliacaoId] ?? []).filter((n) => n.id !== notaId);
}

/** Histórico do valor pedido pelo cliente (gravado pelo banco a cada mudança). */
export async function historicoPreco(real: boolean, a: Avaliacao): Promise<{ data: string; valor: number }[]> {
  if (!real) return a.valorAnunciado ? [{ data: a.criadoEm, valor: a.valorAnunciado }] : [];
  const { data, error } = await supabase.from("avaliacao_precos").select("valor, criado_em").eq("avaliacao_id", a.id).order("criado_em");
  if (error) throw error;
  return (data ?? []).map((x) => ({ data: x.criado_em, valor: Number(x.valor) }));
}
