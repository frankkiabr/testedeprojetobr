/**
 * DADOS DE EXEMPLO (fictícios), usados na demonstração.
 * No login real, `sync.ts` preenche estas mesmas listas com os dados do banco.
 * Os dados são gerados de forma determinística, então são sempre os mesmos a cada visita.
 */
import type {
  Anuncio,
  ArquivoMarca,
  Captacao,
  CategoriaImovel,
  Chamado,
  Compromisso,
  ConexaoGoogle,
  Convite,
  EtapaLead,
  FechamentoInformado,
  Finalidade,
  Imobiliaria,
  Imovel,
  Lead,
  Parceiro,
  Participante,
  Progresso,
  Proprietario,
  Transacao,
  Trilha,
  Usuario,
} from "./types";

export const CHECKLIST_LEAD = [
  "Primeiro contato",
  "Perfil entendido",
  "Imóveis enviados",
  "Visita agendada",
  "Visita realizada",
  "Proposta enviada",
];

/** Etapas para deixar a captação pronta e regularizada (controle interno do corretor). */
export const CHECKLIST_CAPTACAO = [
  "Documentos do proprietário",
  "Matrícula atualizada",
  "IPTU e condomínio sem débitos",
  "Avaliação de preço",
  "Autorização de venda/locação assinada",
  "Vistoria do imóvel",
  "Chaves com a imobiliária",
];

export const CHECKLIST_MARKETING = [
  "Fotos profissionais",
  "Descrição do anúncio",
  "Anúncio nos portais",
  "Publicação nas redes sociais",
  "Placa no imóvel",
  "Vídeo ou tour virtual",
  "Envio para a base de clientes",
  "Relatório ao proprietário",
];

export const ETAPAS: { id: EtapaLead; label: string }[] = [
  { id: "novo", label: "Novo" },
  { id: "contato", label: "Em contato" },
  { id: "visita", label: "Visita" },
  { id: "proposta", label: "Proposta" },
  { id: "fechado", label: "Fechado" },
  { id: "perdido", label: "Perdido" },
];

export const CATEGORIAS: CategoriaImovel[] = ["Apartamento", "Casa", "Sala comercial", "Loja", "Galpão", "Terreno"];
/** Categorias que normalmente têm nome (edifício/condomínio) e unidade. */
export const CATEGORIAS_COM_UNIDADE: CategoriaImovel[] = ["Apartamento", "Sala comercial"];

export const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

/** Honorários padrão: 6% do valor na venda; 100% do primeiro aluguel na locação. */
export const HONORARIOS_PADRAO: Record<Finalidade, number> = { venda: 6, locacao: 100 };

// Gerador pseudoaleatório com semente fixa
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const between = (a: number, b: number) => a + rand() * (b - a);
const int = (a: number, b: number) => Math.floor(between(a, b + 1));
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const DAY = 864e5;
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * DAY).toISOString();

export const imobiliaria: Imobiliaria = {
  id: "imob-1",
  nome: "Imobiliária Exemplo",
  cnpj: "12.345.678/0001-90",
  email: "contato@imobiliariaexemplo.com.br",
  telefone: "5511940001234",
  cidade: "São Paulo, SP",
  plano: "Equipe 10",
  limiteCorretores: 10,
  metaMensalVGV: 8_000_000,
};

/** Data de aniversário a partir de hoje + n dias (para a demonstração sempre ter aniversariantes). */
function aniversarioEm(diasAPartirDeHoje: number, ano: number) {
  const d = new Date(now + diasAPartirDeHoje * DAY);
  return `${ano}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const admin: Usuario = {
  id: "u-admin",
  imobiliariaId: imobiliaria.id,
  nome: "Gabriel Costa",
  email: "gabriel@imobiliariaexemplo.com.br",
  papel: "admin",
  iniciais: "GC",
  telefone: "5511987650000",
  aniversario: aniversarioEm(41, 1982),
  creci: "45120-F",
  creciUF: "SP",
};

// [nome, desempenho, dias até o aniversário, estagiário]
const TEAM: [string, number, number, boolean][] = [
  ["Marina Costa", 1.35, 0, false],
  ["Rafael Lima", 1.1, 63, false],
  ["Ana Souza", 1.0, 17, false],
  ["Bruno Teixeira", 0.9, 1, false],
  ["Camila Rocha", 1.2, 120, false],
  ["Diego Martins", 0.75, 9, false],
  ["Fernanda Alves", 0.95, 200, false],
  ["Lucas Pereira", 0.65, 26, true],
];

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, ".");

export const corretores: Usuario[] = TEAM.map(([nome, , diasAniv, estagiario], i) => ({
  id: `c${i + 1}`,
  imobiliariaId: imobiliaria.id,
  nome,
  email: `${slug(nome)}@imobiliariaexemplo.com.br`,
  papel: "corretor",
  iniciais: nome
    .split(" ")
    .map((p) => p[0])
    .join(""),
  metaMensalVGV: 1_000_000,
  telefone: `55119${int(1000, 9999)}${int(1000, 9999)}`,
  aniversario: aniversarioEm(diasAniv, int(1984, 1999)),
  estagiario,
  creci: estagiario ? undefined : `${int(30000, 99999)}-F`,
  creciUF: estagiario ? undefined : "SP",
}));

/** Corretor usado no modo "Ver como corretor". */
export const corretorDemo = corretores[1];

/** Outras pessoas da imobiliária (ex.: um segundo administrador). Vazio na demonstração. */
export const outrosMembros: Usuario[] = [];

export const parceiros: Parceiro[] = [
  { id: "pa-1", nome: "Ricardo Fontes", creci: "58231-F", empresa: "Fontes Negócios Imobiliários", telefone: "5511991234567" },
  { id: "pa-2", nome: "Juliana Matos", creci: "61904-F", empresa: "Autônoma", telefone: "5511992345678" },
  { id: "pa-3", nome: "Eduardo Viana", creci: "40217-J", empresa: "Viana Imóveis", telefone: "5511993456789" },
  { id: "pa-4", nome: "Patrícia Leal", creci: "73385-F", empresa: "Autônoma", telefone: "5511994567890" },
];

const PRIMEIROS = ["Juliana", "Pedro", "Carla", "Mateus", "Beatriz", "Rodrigo", "Larissa", "Thiago", "Patrícia", "Gustavo", "Aline", "Felipe", "Renata", "André", "Sofia", "Eduardo", "Natália", "Vinícius", "Helena", "Ricardo"];
const SOBRENOMES = ["Andrade", "Prado", "Barbosa", "Ferreira", "Ribeiro", "Carvalho", "Gomes", "Martins", "Araújo", "Melo", "Cardoso", "Nunes", "Moreira", "Freitas", "Castro"];
export const ORIGENS = ["Portal", "Instagram", "Indicação", "Site", "WhatsApp", "Placa"];
export const BAIRROS = ["Moema", "Pinheiros", "Vila Mariana", "Jardins", "Perdizes", "Brooklin", "Itaim Bibi", "Santana", "Tatuapé", "Vila Madalena"];
const INTERESSES = ["Apartamento 2 dorms", "Apartamento 3 dorms", "Casa com quintal", "Studio para investir", "Cobertura", "Imóvel perto do metrô", "Aluguel até R$ 4 mil", "Sala comercial"];

const RUAS = [
  "Rua das Acácias", "Av. dos Ipês", "Rua Bela Vista", "Alameda dos Jacarandás", "Rua do Bosque", "Av. das Palmeiras", "Rua dos Girassóis",
  "Rua Monte Alegre", "Av. Horizonte", "Rua das Orquídeas", "Rua Santa Clara", "Alameda das Rosas", "Rua Primavera", "Av. Central", "Rua do Sol",
];
const EDIFICIOS = [
  "Edifício Aurora", "Residencial Jardim das Acácias", "Edifício Monte Verde", "Condomínio Vila Serena", "Edifício Atlântico",
  "Residencial Parque das Flores", "Edifício Solar do Bosque", "Edifício Horizonte Azul", "Residencial Bela Vista", "Edifício Ipê Amarelo",
  "Edifício Mirante do Vale", "Residencial Porto Belo", "Edifício Brisa do Parque", "Condomínio Reserva Verde",
];
const COMERCIAIS = ["Centro Empresarial Atlas", "Edifício Corporate Norte", "Torre Business Sul", "Centro Comercial Vértice"];

/** Preço médio do m² por bairro (fictício, para o estudo de mercado ficar coerente). */
const M2_BAIRRO: Record<string, number> = {
  Jardins: 16000, "Itaim Bibi": 15000, Moema: 14000, Pinheiros: 13500, "Vila Madalena": 13000,
  Brooklin: 12500, "Vila Mariana": 12000, Perdizes: 11500, Tatuapé: 9500, Santana: 9000,
};
const CATEGORIA_CFG: Record<CategoriaImovel, { mult: number; area: [number, number]; peso: number; locacao: number; aluguel: number }> = {
  Apartamento: { mult: 1, area: [35, 220], peso: 0.55, locacao: 0.35, aluguel: 0.0045 },
  Casa: { mult: 0.85, area: [120, 420], peso: 0.22, locacao: 0.3, aluguel: 0.004 },
  "Sala comercial": { mult: 0.9, area: [30, 180], peso: 0.08, locacao: 0.6, aluguel: 0.0055 },
  Loja: { mult: 1.05, area: [50, 300], peso: 0.06, locacao: 0.65, aluguel: 0.006 },
  Galpão: { mult: 0.32, area: [600, 3000], peso: 0.04, locacao: 0.7, aluguel: 0.006 },
  Terreno: { mult: 0.45, area: [250, 1500], peso: 0.05, locacao: 0, aluguel: 0 },
};

const pessoa = () => `${pick(PRIMEIROS)} ${pick(SOBRENOMES)}`;
const telefone = () => `55119${int(1000, 9999)}${int(1000, 9999)}`;
const round = (v: number, step: number) => Math.round(v / step) * step;
const endereco = (bairro = pick(BAIRROS)) => ({ logradouro: pick(RUAS), numero: String(int(10, 2400)), bairro, cidade: "São Paulo", uf: "SP" });

// ---------- Imóveis (lugares físicos) ----------

export const imoveis: Imovel[] = [
  ...EDIFICIOS.map((nome, i): Imovel => ({ id: `im-ap-${i}`, categoria: "Apartamento", nome, endereco: endereco(), criadoEm: daysAgo(int(260, 400)) })),
  ...COMERCIAIS.map((nome, i): Imovel => ({ id: `im-sc-${i}`, categoria: "Sala comercial", nome, endereco: endereco(pick(["Itaim Bibi", "Brooklin", "Pinheiros", "Jardins"])), criadoEm: daysAgo(int(260, 400)) })),
  ...Array.from({ length: 34 }, (_, i): Imovel => ({ id: `im-ca-${i}`, categoria: "Casa", endereco: endereco(), criadoEm: daysAgo(int(1, 400)) })),
  ...Array.from({ length: 7 }, (_, i): Imovel => ({ id: `im-lo-${i}`, categoria: "Loja", endereco: endereco(), criadoEm: daysAgo(int(1, 400)) })),
  ...Array.from({ length: 5 }, (_, i): Imovel => ({ id: `im-ga-${i}`, categoria: "Galpão", endereco: endereco(pick(["Tatuapé", "Santana"])), criadoEm: daysAgo(int(1, 400)) })),
  ...Array.from({ length: 7 }, (_, i): Imovel => ({ id: `im-te-${i}`, categoria: "Terreno", endereco: endereco(), criadoEm: daysAgo(int(1, 400)) })),
];

function categoriaAleatoria(): CategoriaImovel {
  const r = rand();
  let acc = 0;
  for (const c of CATEGORIAS) {
    acc += CATEGORIA_CFG[c].peso;
    if (r <= acc) return c;
  }
  return "Apartamento";
}

function unidadePara(categoria: CategoriaImovel, area: number) {
  const andar = int(1, 22);
  const n = `${andar}0${int(1, 4)}`;
  if (categoria === "Sala comercial") return `Sala ${n}`;
  if (categoria !== "Apartamento") return undefined;
  if (area < 45) return `Studio ${n}`;
  if (area > 180) return `Cobertura ${andar + 10}01`;
  return `Apto ${n}`;
}

// ---------- Leads, captações, proprietários e transações ----------

export const leads: Lead[] = [];
export const proprietarios: Proprietario[] = [];
export const captacoes: Captacao[] = [];
export const transacoes: Transacao[] = [];

function etapaAleatoria(skill: number, dias: number): EtapaLead {
  // Lead "novo" (sem atendimento) só faz sentido se chegou há poucos dias.
  if (dias < 6 && rand() < 0.5) return "novo";
  const r = rand();
  const pesos: [EtapaLead, number][] = [
    ["contato", 0.28],
    ["visita", 0.16],
    ["proposta", 0.12],
    ["fechado", 0.1 * skill],
    ["perdido", 0.2],
  ];
  const total = pesos.reduce((s, [, p]) => s + p, 0);
  let acc = 0;
  for (const [e, p] of pesos) {
    acc += p / total;
    if (r <= acc) return e;
  }
  return "contato";
}

/** Visita nos próximos 7 dias, em horário comercial (9h–18h, de meia em meia hora). */
function proximaVisita() {
  const d = new Date(now + int(0, 6) * DAY);
  d.setHours(int(9, 18), rand() < 0.5 ? 0 : 30, 0, 0);
  if (d.getTime() < now) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

const PASSOS: Record<EtapaLead, [number, number]> = {
  novo: [0, 0],
  contato: [1, 2],
  visita: [3, 4],
  proposta: [5, 6],
  fechado: [6, 6],
  perdido: [1, 3],
};

/** Divisão dos honorários: sozinho, parceria interna ou parceria com corretor externo. */
function participantesPara(corretorId: string): Participante[] {
  const r = rand();
  if (r < 0.72) return [{ tipo: "corretor", refId: corretorId, pct: 50 }];
  if (r < 0.88) {
    const outro = pick(corretores.filter((c) => c.id !== corretorId));
    return [
      { tipo: "corretor", refId: corretorId, pct: 25 },
      { tipo: "corretor", refId: outro.id, pct: 25 },
    ];
  }
  return [
    { tipo: "corretor", refId: corretorId, pct: 25 },
    { tipo: "parceiro", refId: pick(parceiros).id, pct: 25 },
  ];
}

corretores.forEach((c, ci) => {
  const skill = TEAM[ci][1];

  // Leads dos últimos 6 meses
  const totalLeads = Math.round(58 * skill);
  for (let i = 0; i < totalLeads; i++) {
    const dias = between(0, 180);
    const etapa = etapaAleatoria(skill, dias);
    const [min, max] = PASSOS[etapa];
    const passos = int(min, max);
    leads.push({
      id: `l-${c.id}-${i}`,
      corretorId: c.id,
      nome: pessoa(),
      telefone: telefone(),
      origem: pick(ORIGENS),
      interesse: pick(INTERESSES),
      etapa,
      criadoEm: daysAgo(dias),
      checklist: CHECKLIST_LEAD.map((_, k) => k < passos),
      visitaEm: etapa === "visita" ? proximaVisita() : undefined,
    });
  }

  // Captações dos últimos ~8 meses (para os primeiros meses do gráfico também terem fechamentos)
  const propsDoCorretor: Proprietario[] = [];
  const total = Math.round(22 * skill);
  for (let i = 0; i < total; i++) {
    const dias = between(0, 250);
    const categoria = categoriaAleatoria();
    const cfg = CATEGORIA_CFG[categoria];
    const imovel = pick(imoveis.filter((x) => x.categoria === categoria));
    const area = int(cfg.area[0], cfg.area[1]);
    const valorVenda = round(area * M2_BAIRRO[imovel.endereco.bairro] * cfg.mult * between(0.88, 1.12), 5_000);
    const finalidade: Finalidade = rand() < cfg.locacao ? "locacao" : "venda";
    const valor = finalidade === "venda" ? valorVenda : round(valorVenda * cfg.aluguel, 50);

    // 15% das captações são de um proprietário que o corretor já atende
    let prop = propsDoCorretor.length && rand() < 0.15 ? pick(propsDoCorretor) : undefined;
    if (!prop) {
      prop = { id: `p-${c.id}-${i}`, corretorId: c.id, nome: pessoa(), whatsapp: telefone() };
      proprietarios.push(prop);
      propsDoCorretor.push(prop);
    }

    // Fechamento: venda de 15 a 70 dias depois; locação de 7 a 40 dias (nunca no futuro)
    const diasFechamento = dias - (finalidade === "venda" ? between(15, 70) : between(7, 40));
    const fechou = diasFechamento >= 2 && rand() < (finalidade === "venda" ? 0.45 : 0.6) * skill;

    const cap: Captacao = {
      id: `cp-${c.id}-${i}`,
      corretorId: c.id,
      proprietarioId: prop.id,
      imovelId: imovel.id,
      unidade: unidadePara(categoria, area),
      finalidade,
      valor,
      areaM2: area,
      status: fechou ? (finalidade === "venda" ? "vendida" : "alugada") : "ativa",
      captadoEm: daysAgo(dias),
      checklistCaptacao: CHECKLIST_CAPTACAO.map((_, k) => (fechou ? true : k < int(2, 7))),
      checklistMarketing: CHECKLIST_MARKETING.map((_, k) => (fechou ? true : k < int(1, 7))),
    };
    captacoes.push(cap);

    if (fechou) {
      transacoes.push({
        id: `tr-${cap.id}`,
        tipo: finalidade,
        captacaoId: cap.id,
        valor: finalidade === "venda" ? round(valor * between(0.92, 0.99), 1_000) : valor,
        honorariosPct: HONORARIOS_PADRAO[finalidade],
        data: daysAgo(diasFechamento),
        cliente: pessoa(),
        participantes: participantesPara(c.id),
      });
    }
  }
});

leads.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
captacoes.sort((a, b) => b.captadoEm.localeCompare(a.captadoEm));
// Códigos de exemplo (no banco, cada captação ganha um código único)
captacoes.forEach((c, k) => {
  const alfabeto = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let n = 7919 * (k + 13);
  let cod = "";
  for (let i = 0; i < 6; i++) {
    cod += alfabeto[n % alfabeto.length];
    n = Math.floor(n / alfabeto.length) + 101 * (i + k + 1);
  }
  c.codigo = "FK-" + cod;
});
transacoes.sort((a, b) => b.data.localeCompare(a.data));

/** Fechamentos que os corretores informaram e o administrador ainda precisa registrar. */
export const fechamentos: FechamentoInformado[] = [corretorDemo, corretores[4]]
  .map((c, i): FechamentoInformado | null => {
    const cap = captacoes.find((x) => x.corretorId === c.id && x.status === "ativa" && x.finalidade === (i === 0 ? "venda" : "locacao"));
    if (!cap) return null;
    return {
      id: `fi-${i + 1}`,
      corretorId: c.id,
      captacaoId: cap.id,
      tipo: cap.finalidade,
      valor: cap.finalidade === "venda" ? round(cap.valor * 0.96, 1_000) : cap.valor,
      data: daysAgo(i + 1),
      observacao: i === 0 ? "Comprador pagará 30% de entrada e financiará o restante." : "Contrato de 30 meses, garantia por seguro-fiança.",
      criadoEm: daysAgo(i + 0.5),
      status: "pendente",
    };
  })
  .filter((x): x is FechamentoInformado => !!x);

// ---------- Agenda ----------

/** Gerador separado, para a agenda não alterar os demais dados de exemplo. */
const randAg = mulberry32(31);
const intAg = (a: number, b: number) => Math.floor(a + randAg() * (b - a + 1));
const pickAg = <T,>(arr: T[]) => arr[Math.floor(randAg() * arr.length)];

function horario(diasAPartirDeHoje: number, hora: number, minuto = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() + diasAPartirDeHoje);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

/** Mesmo que `horario`, mas empurra sábado/domingo para a segunda-feira seguinte. */
function horarioUtil(diasAPartirDeHoje: number, hora: number, minuto = 0) {
  const d = horario(diasAPartirDeHoje, hora, minuto);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}
const mais = (d: Date, minutos: number) => new Date(d.getTime() + minutos * 60_000);

export const compromissos: Compromisso[] = [];
let seqAg = 0;
const addAg = (c: Omit<Compromisso, "id">) => compromissos.push({ ...c, id: `ag-${++seqAg}` });

// 1) Visitas já marcadas nos leads viram compromissos (1h cada)
leads
  .filter((l) => l.visitaEm)
  .forEach((l) => {
    const ini = new Date(l.visitaEm!);
    addAg({ donoId: l.corretorId, titulo: `Visita com ${l.nome}`, tipo: "visita", inicio: ini.toISOString(), fim: mais(ini, 60).toISOString(), leadId: l.id, local: "A combinar" });
  });

// 2) Reunião semanal (segunda, 9h) para administrador e corretores, nas últimas e próximas semanas
const segunda = (() => {
  const d = new Date(now);
  const dia = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - dia);
  return Math.round((d.getTime() - now) / DAY);
})();
[-7, 0, 7, 14].forEach((sem) => {
  [admin, ...corretores].forEach((u) => {
    const ini = horario(segunda + sem, 9);
    addAg({ donoId: u.id, titulo: "Reunião semanal da equipe", tipo: "reuniao", inicio: ini.toISOString(), fim: mais(ini, 60).toISOString(), local: imobiliaria.nome });
  });
});

// 3) Captações e ligações aleatórias de cada corretor (de 10 dias atrás a 14 dias à frente)
corretores.forEach((c) => {
  const minhas = captacoes.filter((x) => x.corretorId === c.id && x.status === "ativa");
  const meusLeads = leads.filter((l) => l.corretorId === c.id && (l.etapa === "contato" || l.etapa === "proposta"));
  for (let i = 0; i < 10; i++) {
    const dia = intAg(-10, 14);
    const dow = new Date(now + dia * DAY).getDay();
    if (dow === 0 || dow === 6) continue; // só dias úteis
    const ini = horario(dia, intAg(9, 17), randAg() < 0.5 ? 0 : 30);
    if (randAg() < 0.45 && minhas.length) {
      const cap = pickAg(minhas);
      addAg({ donoId: c.id, titulo: "Vistoria e fotos da captação", tipo: "captacao", inicio: ini.toISOString(), fim: mais(ini, 90).toISOString(), captacaoId: cap.id });
    } else if (meusLeads.length) {
      const l = pickAg(meusLeads);
      addAg({ donoId: c.id, titulo: `Ligar para ${l.nome}`, tipo: "ligacao", inicio: ini.toISOString(), fim: mais(ini, 30).toISOString(), leadId: l.id });
    }
  }
});

// 4) Compromissos do administrador
[
  { d: 1, h: 14, t: "Alinhamento com o jurídico", tipo: "outro" as const, dur: 60 },
  { d: 3, h: 10, t: "Entrevista de novo corretor", tipo: "reuniao" as const, dur: 45 },
  { d: 4, h: 16, t: "Revisão de metas do mês", tipo: "reuniao" as const, dur: 60 },
].forEach((x) => {
  const ini = horarioUtil(x.d, x.h);
  addAg({ donoId: admin.id, titulo: x.t, tipo: x.tipo, inicio: ini.toISOString(), fim: mais(ini, x.dur).toISOString() });
});

// 5) Compromissos da equipe Frankkia (painel do criador)
[
  { d: 0, h: 15, t: "Demonstração para Horizonte Imóveis", tipo: "reuniao" as const, dur: 60 },
  { d: 1, h: 10, t: "Onboarding da Atrium Imobiliária", tipo: "reuniao" as const, dur: 90 },
  { d: 2, h: 11, t: "Ligação de renovação: Morada Nobre", tipo: "ligacao" as const, dur: 30 },
  { d: 5, h: 14, t: "Planejamento do produto", tipo: "outro" as const, dur: 120 },
].forEach((x) => {
  const ini = horarioUtil(x.d, x.h);
  addAg({ donoId: "u-frankkia", titulo: x.t, tipo: x.tipo, inicio: ini.toISOString(), fim: mais(ini, x.dur).toISOString() });
});

/** Conexões (simuladas) com o Google Agenda, por usuário. */
export const conexoesGoogle: Record<string, ConexaoGoogle> = {};

// ---------- Academy ----------

const MB = 1_000_000;
export const trilhas: Trilha[] = [
  {
    id: "t-1",
    titulo: "Onboarding Frankkia",
    subtitulo: "Primeiros passos na plataforma e na rotina da imobiliária.",
    criadoEm: daysAgo(120),
    capaHue: 226,
    aulas: [
      { id: "a-1", titulo: "Boas-vindas à equipe", tipo: "video", formato: "MP4", arquivoNome: "boas-vindas.mp4", tamanhoBytes: 84 * MB, duracaoMin: 6 },
      { id: "a-2", titulo: "Como cadastrar leads e captações", tipo: "video", formato: "MP4", arquivoNome: "cadastros.mp4", tamanhoBytes: 160 * MB, duracaoMin: 12 },
      { id: "a-3", titulo: "Manual do corretor", tipo: "documento", formato: "PDF", arquivoNome: "manual-do-corretor.pdf", tamanhoBytes: 2.4 * MB },
    ],
  },
  {
    id: "t-2",
    titulo: "Captação de imóveis",
    subtitulo: "Técnicas para captar mais e com qualidade.",
    criadoEm: daysAgo(80),
    capaHue: 158,
    aulas: [
      { id: "a-4", titulo: "Abordagem ao proprietário", tipo: "video", formato: "MP4", arquivoNome: "abordagem.mp4", tamanhoBytes: 230 * MB, duracaoMin: 18 },
      { id: "a-5", titulo: "Avaliação de preço", tipo: "video", formato: "MOV", arquivoNome: "avaliacao-de-preco.mov", tamanhoBytes: 410 * MB, duracaoMin: 22 },
      { id: "a-6", titulo: "Checklist de captação", tipo: "documento", formato: "PDF", arquivoNome: "checklist-de-captacao.pdf", tamanhoBytes: 0.8 * MB },
      { id: "a-7", titulo: "Modelo de autorização de venda", tipo: "documento", formato: "PDF", arquivoNome: "autorizacao-de-venda.pdf", tamanhoBytes: 0.3 * MB },
    ],
  },
  {
    id: "t-3",
    titulo: "Atendimento e negociação",
    subtitulo: "Do primeiro contato à proposta aceita.",
    criadoEm: daysAgo(30),
    capaHue: 268,
    aulas: [
      { id: "a-8", titulo: "Primeiro contato que converte", tipo: "video", formato: "MP4", arquivoNome: "primeiro-contato.mp4", tamanhoBytes: 190 * MB, duracaoMin: 15 },
      { id: "a-9", titulo: "Conduzindo a visita", tipo: "video", formato: "MP4", arquivoNome: "visita.mp4", tamanhoBytes: 250 * MB, duracaoMin: 20 },
      { id: "a-10", titulo: "Roteiro de visita", tipo: "documento", formato: "PDF", arquivoNome: "roteiro-de-visita.pdf", tamanhoBytes: 0.6 * MB },
      { id: "a-11", titulo: "Negociação e proposta", tipo: "video", formato: "MP4", arquivoNome: "negociacao.mp4", tamanhoBytes: 320 * MB, duracaoMin: 25 },
    ],
  },
];

export const progresso: Progresso = { [admin.id]: [] };
corretores.forEach((c, ci) => {
  const chance = 0.25 + TEAM[ci][1] * 0.3;
  progresso[c.id] = trilhas.flatMap((t) => t.aulas.map((a) => a.id)).filter(() => rand() < chance);
});

// ---------- Marketing ----------

/** Logo de exemplo desenhada no navegador (PNG com fundo transparente). */
function demoLogo(): ArquivoMarca | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 240;
  const g = c.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#0f1a33";
  g.beginPath();
  if (g.roundRect) g.roundRect(20, 30, 180, 180, 44);
  else g.rect(20, 30, 180, 180);
  g.fill();
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.moveTo(110, 70);
  g.lineTo(165, 118);
  g.lineTo(152, 118);
  g.lineTo(152, 172);
  g.lineTo(68, 172);
  g.lineTo(68, 118);
  g.lineTo(55, 118);
  g.closePath();
  g.fill();
  g.fillStyle = "#2f5bea";
  g.fillRect(98, 136, 24, 36);
  g.fillStyle = "#0f1a33";
  g.font = "600 92px 'Space Grotesk', system-ui, sans-serif";
  g.fillText("Exemplo", 236, 140);
  g.fillStyle = "#2f5bea";
  g.font = "600 30px Inter, system-ui, sans-serif";
  g.fillText("I M Ó V E I S", 242, 192);
  const url = c.toDataURL("image/png");
  return {
    nome: "logo-imobiliaria-exemplo.png",
    url,
    tamanhoBytes: Math.round(url.length * 0.75),
    largura: c.width,
    altura: c.height,
    enviadoEm: daysAgo(45),
    transparente: true,
  };
}

export const marca: { logo: ArquivoMarca | null } = { logo: demoLogo() };

// ---------- Equipe ----------

export const convites: Convite[] = [{ id: "cv-1", email: "joao.mendes@gmail.com", enviadoEm: daysAgo(2) }];

// ---------- Ajuda ----------

export const chamados: Chamado[] = [
  {
    id: "ch-1",
    imobiliariaId: imobiliaria.id,
    autorId: admin.id,
    assunto: "Como importar minha planilha de leads?",
    categoria: "Dúvida",
    mensagem: "Tenho uma planilha com os leads antigos da equipe e gostaria de trazer para a plataforma.",
    criadoEm: daysAgo(9),
    status: "resolvido",
    resposta:
      "Olá, Gabriel! A importação de planilhas faz parte do módulo Frankkia Performance e está em desenvolvimento. Avisaremos assim que estiver disponível.",
  },
];

// ---------- Portal (anúncios) ----------

/** Características que o corretor marca no anúncio. */
export const CARACTERISTICAS = [
  "Piscina", "Churrasqueira", "Academia", "Salão de festas", "Playground", "Portaria 24h", "Elevador", "Varanda / sacada",
  "Varanda gourmet", "Mobiliado", "Ar-condicionado", "Armários planejados", "Aceita pets", "Quintal", "Jardim", "Área de serviço",
  "Lareira", "Vista para o mar", "Próximo ao metrô", "Aceita financiamento", "Aceita permuta",
];

export const anuncios: Anuncio[] = [];
