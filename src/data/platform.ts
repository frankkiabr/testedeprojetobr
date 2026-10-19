/**
 * DADOS DO PAINEL FRANKKIA (você, criador da plataforma).
 * Imobiliárias clientes, chamados de todas elas e erros do sistema (fictícios na demonstração;
 * no login real da Frankkia, `sync.ts` preenche estas listas com o banco).
 * A "Imobiliária Exemplo" é a mesma usada na área logada, então mudanças aqui aparecem lá.
 */
import { site } from "@/content";
import { chamados, imobiliaria } from "./demo";
import { monthKey, vagasUsadas } from "./queries";
import type { Chamado, Cliente, ClienteStatus, ErroSistema, PedidoUpgrade, PlanoNome, Usuario } from "./types";

export const PLANOS: Record<PlanoNome, { limite: number; preco: number }> = {
  "Equipe 15": { limite: 15, preco: 999 },
  "Equipe 30": { limite: 30, preco: 1699 },
  "Equipe 60": { limite: 60, preco: 2999 },
};

export const STATUS_CLIENTE: Record<ClienteStatus, { label: string; tone: "verified" | "accent" | "warn" | "neutral" | "danger" }> = {
  ativa: { label: "Ativa", tone: "verified" },
  teste: { label: "Em teste", tone: "accent" },
  pagamento: { label: "Pagamento pendente", tone: "warn" },
  suspensa: { label: "Suspensa", tone: "danger" },
  aguardando: { label: "Aguardando 1º acesso", tone: "neutral" },
};

export const frankkiaUser: Usuario = {
  id: "u-frankkia",
  imobiliariaId: "",
  nome: "Equipe Frankkia",
  email: site.email,
  papel: "admin",
  iniciais: "FK",
};

// Gerador pseudoaleatório próprio (não altera os dados da imobiliária de exemplo)
let seed = 777;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (a: number, b: number) => Math.floor(a + rand() * (b - a + 1));
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const DAY = 864e5;
const daysAgo = (d: number) => new Date(Date.now() - d * DAY).toISOString();

const NOMES = [
  "Horizonte Imóveis", "Casa Viva Imobiliária", "Porto Lar Imóveis", "Morada Nobre", "Vértice Imóveis", "Bairro Bom Imóveis",
  "Lar & Cia", "Ponto Alto Imóveis", "Raiz Imobiliária", "Nova Era Imóveis", "Solar Negócios Imobiliários", "Vista Verde Imóveis",
  "Prisma Imóveis", "Alameda Imobiliária", "Chave Certa Imóveis", "Bem Morar Imóveis", "Atrium Imobiliária", "Varanda Imóveis",
  "Litoral Sul Imóveis", "Serra Azul Imobiliária", "Mirante Imóveis", "Pátio Imobiliária", "Rota Norte Imóveis", "Cobalto Imóveis",
  "Terraço Imobiliária", "Esquina Imóveis", "Ipê Imobiliária", "Marco Zero Imóveis", "Portal do Lar Imóveis",
];
const CIDADES = [
  "São Paulo, SP", "Campinas, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR", "Florianópolis, SC", "Porto Alegre, RS",
  "Goiânia, GO", "Brasília, DF", "Salvador, BA", "Recife, PE", "Fortaleza, CE", "Vitória, ES", "Santos, SP", "Ribeirão Preto, SP",
];
const PRIMEIROS = ["Ana", "Bruno", "Carla", "Daniel", "Elisa", "Fábio", "Gisele", "Henrique", "Isabela", "Jorge", "Karina", "Leonardo", "Mariana", "Otávio", "Paula", "Rafael", "Sílvia", "Tiago"];
const SOBRENOMES = ["Almeida", "Batista", "Correia", "Duarte", "Esteves", "Fonseca", "Guimarães", "Lacerda", "Monteiro", "Nogueira", "Pacheco", "Queiroz", "Rezende", "Siqueira", "Tavares"];

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const cnpj = () => `${int(10, 99)}.${int(100, 999)}.${int(100, 999)}/0001-${int(10, 99)}`;

function statusAleatorio(): ClienteStatus {
  const r = rand();
  if (r < 0.7) return "ativa";
  if (r < 0.79) return "teste";
  if (r < 0.87) return "pagamento";
  if (r < 0.93) return "suspensa";
  return "aguardando";
}

const usoPor = (n: number) => ({
  negocios: Math.round(n * (30 + rand() * 50)),
  performance: Math.round(n * (8 + rand() * 20)),
  academy: Math.round(n * (2 + rand() * 14)),
  marketing: Math.round(n * (1 + rand() * 6)),
});

export const clientes: Cliente[] = [
  {
    id: imobiliaria.id,
    nome: imobiliaria.nome,
    cidade: imobiliaria.cidade,
    cnpj: imobiliaria.cnpj,
    plano: imobiliaria.plano,
    status: "ativa",
    clienteDesde: daysAgo(260),
    ultimoAcesso: daysAgo(0.02),
    adminNome: "Gabriel Costa",
    adminEmail: "gabriel@imobiliariaexemplo.com.br",
    corretores: 0,
    uso: usoPor(9),
  },
  ...NOMES.map((nome, i): Cliente => {
    const plano: PlanoNome = pick(["Equipe 15", "Equipe 15", "Equipe 15", "Equipe 30", "Equipe 30", "Equipe 60"]);
    const status = statusAleatorio();
    const limite = PLANOS[plano].limite;
    // Em teste, a equipe ainda é pequena; aguardando = ninguém entrou ainda.
    const corretores =
      status === "aguardando" ? 0 : status === "teste" ? int(1, Math.round(limite * 0.35)) : Math.max(1, Math.round(limite * (0.45 + rand() * 0.57)));
    const admin = `${pick(PRIMEIROS)} ${pick(SOBRENOMES)}`;
    const desde = status === "teste" ? int(1, 13) : status === "aguardando" ? int(0, 6) : int(20, 420);
    // O último acesso nunca é anterior à data em que virou cliente.
    const diasAcesso = rand() < 0.82 || status === "teste" ? rand() * 3 : int(15, 45);
    const acesso = status === "aguardando" ? undefined : daysAgo(Math.min(diasAcesso, desde));
    return {
      id: `cli-${i + 1}`,
      nome,
      cidade: pick(CIDADES),
      cnpj: cnpj(),
      plano,
      status,
      clienteDesde: daysAgo(desde),
      ultimoAcesso: acesso,
      adminNome: admin,
      adminEmail: `${slug(admin.split(" ")[0])}@${slug(nome)}.com.br`,
      corretores: Math.min(limite, corretores),
      uso: status === "aguardando" ? { negocios: 0, performance: 0, academy: 0, marketing: 0 } : usoPor(corretores),
    };
  }),
];

/** Mantém a "Imobiliária Exemplo" sincronizada com a área logada. */
function sync() {
  const c = clientes.find((x) => x.id === imobiliaria.id);
  if (c) {
    c.nome = imobiliaria.nome;
    c.cidade = imobiliaria.cidade;
    c.cnpj = imobiliaria.cnpj;
    c.plano = imobiliaria.plano;
    c.corretores = vagasUsadas();
  }
}

export function listaClientes() {
  sync();
  return clientes;
}
export const clienteById = (id: string) => listaClientes().find((c) => c.id === id);
export const clienteNome = (id: string) => clienteById(id)?.nome ?? "—";

/** Clientes que pagam: ativos e com pagamento pendente (teste e aguardando não pagam). */
export const pagante = (c: Cliente) => c.status === "ativa" || c.status === "pagamento";
export const mrrDe = (c: Cliente) => (pagante(c) ? PLANOS[c.plano].preco : 0);

export function metricasPlataforma() {
  const cs = listaClientes();
  const pagantes = cs.filter(pagante);
  const mrr = pagantes.reduce((s, c) => s + PLANOS[c.plano].preco, 0);
  const usuarios = cs.filter((c) => c.status !== "aguardando").reduce((s, c) => s + c.corretores + 1, 0);
  const ocupacao = pagantes.length ? pagantes.reduce((s, c) => s + c.corretores / PLANOS[c.plano].limite, 0) / pagantes.length : 0;
  return {
    mrr,
    clientes: cs.length,
    ativas: pagantes.length,
    teste: cs.filter((c) => c.status === "teste").length,
    usuarios,
    ocupacao,
  };
}

/** Receita mensal (MRR) dos últimos 6 meses: clientes pagantes que já eram clientes no fim de cada mês. */
export function mrrSerie(months: { key: string; short: string }[]) {
  const cs = listaClientes();
  const atual = months[months.length - 1].key;
  return months.map((m) => {
    const value = cs
      .filter((c) => {
        const desde = monthKey(c.clienteDesde) <= m.key;
        // Suspensas pagavam antes; teste e aguardando nunca pagaram.
        const pagava = m.key === atual ? pagante(c) : pagante(c) || c.status === "suspensa";
        return desde && pagava;
      })
      .reduce((s, c) => s + PLANOS[c.plano].preco, 0);
    return { label: m.short, value };
  });
}

// ---------- Pedidos de upgrade ----------

const ORDEM_PLANOS: PlanoNome[] = ["Equipe 15", "Equipe 30", "Equipe 60"];
export const planoSeguinte = (p: PlanoNome): PlanoNome | null => ORDEM_PLANOS[ORDEM_PLANOS.indexOf(p) + 1] ?? null;
const ref = () => `cs_demo_${Math.random().toString(36).slice(2, 12)}`;

/** Exemplos: um pedido pago aguardando liberação e um com boleto em compensação. */
export const pedidosUpgrade: PedidoUpgrade[] = clientes
  .filter((c) => c.status === "ativa" && c.id !== imobiliaria.id && planoSeguinte(c.plano))
  .slice(0, 2)
  .map((c, i): PedidoUpgrade => {
    const novo = planoSeguinte(c.plano)!;
    return {
      id: `up-${i + 1}`,
      imobiliariaId: c.id,
      planoAtual: c.plano,
      planoNovo: novo,
      valorMensal: PLANOS[novo].preco,
      criadoEm: daysAgo(i === 0 ? 0.3 : 1.5),
      pagamento: i === 0 ? "confirmado" : "pendente",
      metodo: i === 0 ? "cartao" : "boleto",
      pagoEm: i === 0 ? daysAgo(0.29) : undefined,
      liberado: false,
      referencia: ref(),
    };
  });

export const novaReferencia = ref;

/** Pedido em andamento de uma imobiliária (não cancelado e ainda não liberado). */
export const pedidoAberto = (imobiliariaId: string) =>
  pedidosUpgrade.find((p) => p.imobiliariaId === imobiliariaId && !p.liberado && p.pagamento !== "cancelado");

export const pedidoById = (id: string) => pedidosUpgrade.find((p) => p.id === id);

export const diasSemAcesso = (c: Cliente) => (c.ultimoAcesso ? Math.floor((Date.now() - new Date(c.ultimoAcesso).getTime()) / DAY) : null);

// ---------- Chamados de todas as imobiliárias ----------

export const chamadosOutras: Chamado[] = [
  { id: "chp-1", imobiliariaId: "cli-3", autorId: "", autorNome: "Carla Duarte", assunto: "Vídeo .mov não carrega na Academy", categoria: "Problema técnico", mensagem: "Subi um vídeo em MOV de 900 MB e ele fica carregando sem terminar.", criadoEm: daysAgo(0.2), status: "aberto" },
  { id: "chp-2", imobiliariaId: "cli-8", autorId: "", autorNome: "Jorge Tavares", assunto: "Quero mudar para o plano Equipe 30", categoria: "Financeiro", mensagem: "Nossa equipe cresceu e precisamos de mais vagas.", criadoEm: daysAgo(1), status: "aberto" },
  { id: "chp-3", imobiliariaId: "cli-12", autorId: "", autorNome: "Paula Nogueira", assunto: "Relatório do WhatsApp sem o nome da imobiliária", categoria: "Sugestão", mensagem: "Seria bom incluir a logo ou o site no final do relatório enviado ao proprietário.", criadoEm: daysAgo(3), status: "em_andamento" },
  { id: "chp-4", imobiliariaId: "cli-5", autorId: "", autorNome: "Henrique Lacerda", assunto: "Corretor não recebeu o convite", categoria: "Problema técnico", mensagem: "Enviei o convite ontem e ele diz que não chegou nada.", criadoEm: daysAgo(2), status: "em_andamento" },
  { id: "chp-5", imobiliariaId: "cli-20", autorId: "", autorNome: "Isabela Correia", assunto: "Como altero a meta mensal da equipe?", categoria: "Dúvida", mensagem: "Não encontrei onde muda a meta de VGV.", criadoEm: daysAgo(6), status: "resolvido", resposta: "Olá, Isabela! A configuração de metas chega na próxima atualização, dentro de Performance." },
  { id: "chp-6", imobiliariaId: "cli-15", autorId: "", autorNome: "Otávio Rezende", assunto: "Boleto do mês", categoria: "Financeiro", mensagem: "Preciso da segunda via do boleto deste mês.", criadoEm: daysAgo(12), status: "resolvido", resposta: "Olá, Otávio! Enviamos a segunda via para o e-mail do administrador." },
];

/** Chamados da Imobiliária Exemplo (abertos na Ajuda) + chamados das outras imobiliárias. */
export const todosChamados = () => [...chamados, ...chamadosOutras].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
export const chamadoById = (id: string) => todosChamados().find((c) => c.id === id);

// ---------- Erros do sistema ----------

export const errosSistema: ErroSistema[] = [
  { id: "er-1", mensagem: "Relatório WhatsApp: número do proprietário sem DDD", local: "Negócios › Imóveis", ocorrencias: 22, imobiliarias: 6, primeiraVez: daysAgo(5), ultimaVez: daysAgo(0.1), status: "novo", origem: "exemplo" },
  { id: "er-2", mensagem: "TypeError: Cannot read properties of undefined (reading 'valor')", local: "Negócios › Vendas", ocorrencias: 14, imobiliarias: 3, primeiraVez: daysAgo(2), ultimaVez: daysAgo(0.4), status: "novo", origem: "exemplo" },
  { id: "er-3", mensagem: "Upload de vídeo interrompido: tempo limite excedido (.mov)", local: "Academy › Adicionar aula", ocorrencias: 9, imobiliarias: 4, primeiraVez: daysAgo(8), ultimaVez: daysAgo(0.2), status: "investigando", origem: "exemplo" },
  { id: "er-4", mensagem: "Pré-visualização falhou: PNG maior que 20 MB", local: "Marketing › Logo", ocorrencias: 7, imobiliarias: 3, primeiraVez: daysAgo(11), ultimaVez: daysAgo(3), status: "investigando", origem: "exemplo" },
  { id: "er-5", mensagem: "Gráfico de evolução vazio em mês sem vendas", local: "Performance", ocorrencias: 5, imobiliarias: 2, primeiraVez: daysAgo(20), ultimaVez: daysAgo(14), status: "corrigido", origem: "exemplo" },
  { id: "er-6", mensagem: "Envio de convite recusado: muitas tentativas (429)", local: "Equipe › Convidar", ocorrencias: 3, imobiliarias: 1, primeiraVez: daysAgo(25), ultimaVez: daysAgo(24), status: "corrigido", origem: "exemplo" },
];

/** Traduz o endereço da página para o nome da tela. */
export function nomeDaTela(path: string) {
  const map: [string, string][] = [
    ["/app/negocios/leads", "Negócios › Leads"],
    ["/app/negocios/imoveis", "Negócios › Imóveis"],
    ["/app/negocios/proprietarios", "Negócios › Proprietários"],
    ["/app/negocios/vendas", "Negócios › Vendas"],
    ["/app/visao-geral", "Visão geral"],
    ["/app/performance", "Performance"],
    ["/app/academy", "Academy"],
    ["/app/marketing", "Marketing"],
    ["/app/equipe", "Equipe"],
    ["/app/configuracoes", "Configurações"],
    ["/app/ajuda", "Ajuda"],
    ["/admin", "Painel Frankkia"],
  ];
  return map.find(([p]) => path.startsWith(p))?.[1] ?? (path === "/" ? "Site" : path);
}

/** Situação para mostrar: um teste grátis com prazo vencido aparece como "Teste encerrado". */
export function statusDe(c: Pick<Cliente, "status" | "testeAte">) {
  if (c.status === "teste" && c.testeAte && new Date(c.testeAte).getTime() < Date.now()) return { label: "Teste encerrado", tone: "danger" as const };
  return STATUS_CLIENTE[c.status];
}
