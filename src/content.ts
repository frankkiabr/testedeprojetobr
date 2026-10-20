/**
 * TODO O CONTEÚDO DO SITE DA FRANKKIA FICA AQUI.
 * Edite textos, planos e perguntas sem mexer nos componentes.
 */
import {
  BarChart3,
  Brain,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

export const site = {
  name: "Frankkia",
  email: "frankkiabr@gmail.com",
  slogan: "Seu universo imobiliário, em um só lugar.",
  description:
    "Gestão, performance, capacitação e ferramentas comerciais conectadas em uma única plataforma para imobiliárias e corretores.",
};

export const nav = [
  { id: "ecossistema", label: "Ecossistema" },
  { id: "funcoes", label: "Funções" },
  { id: "planos", label: "Planos" },
  { id: "duvidas", label: "Dúvidas" },
] as const;

export const hero = {
  /** Palavras do título; a palavra em `highlight` ganha o sublinhado animado. */
  title: ["Seu", "universo", "imobiliário,", "em", "um", "só", "lugar."],
  highlight: 1,
  lead: "Gestão, performance, capacitação e ferramentas comerciais conectadas em uma única plataforma para",
  typed: ["imobiliárias.", "corretores.", "gestores.", "equipes comerciais."],
  primary: "Solicitar demonstração",
  secondary: "Ver planos",
};

export type Module = { name: string; icon: LucideIcon };

export const ecosystem = {
  eyebrow: "Ecossistema",
  /** Strings viram palavras; objetos viram ícones inline. */
  statement: [
    "Um ecossistema completo",
    { pill: "logo" },
    "para a sua imobiliária.",
    "Possibilidades conectadas",
    { pill: "modules" },
    "em uma única",
    { pill: "chart" },
    "plataforma.",
  ] as Segment[],
  listTitle: "Possibilidades conectadas",
  modules: [
    { name: "Performance", icon: BarChart3 },
    { name: "Capacitação", icon: GraduationCap },
    { name: "Negócios", icon: Briefcase },
    { name: "Marketing", icon: Megaphone },
    { name: "Relacionamento", icon: HeartHandshake },
    { name: "Inteligência", icon: Brain },
  ] as Module[],
};

export type Pill = { pill: "logo" | "modules" | "chart" | "arrow" };
export type Segment = string | Pill;

export type FeatureKey = "captacao" | "leads" | "agenda" | "relatorio" | "mercado";

/** Só funções que existem no painel. */
export const features = {
  eyebrow: "Funções",
  title: "Ferramentas comerciais para cada etapa do negócio.",
  giant: "Funções",
  items: [
    {
      key: "captacao",
      title: "Checklist de captação",
      tag: "Captação",
      text: "Documentação, matrícula, avaliação e autorização: saiba exatamente o que falta para cada imóvel captado estar pronto para negociar.",
    },
    {
      key: "leads",
      title: "Funil de leads",
      tag: "Atendimento",
      text: "Leads organizados por etapa, com checklist de atendimento e ranking de quem mais atende na equipe.",
    },
    {
      key: "agenda",
      title: "Agenda",
      tag: "Organização",
      text: "Visitas, captações, reuniões e ligações num só lugar, ligadas aos leads e com envio para o Google Agenda.",
    },
    {
      key: "relatorio",
      title: "Relatório ao proprietário",
      text: "Marque as ações de divulgação do imóvel e envie ao proprietário um relatório pronto pelo WhatsApp.",
    },
    {
      key: "mercado",
      title: "Estudo de mercado",
      tag: "Inteligência",
      text: "Preço do m² por bairro, tempo médio de venda e margem de negociação, a partir dos negócios fechados pela imobiliária.",
    },
  ] as { key: FeatureKey; title: string; tag?: string; text: string }[],
};

export const pricing = {
  eyebrow: "Planos",
  title: "Planos para o tamanho da sua equipe.",
  text: "Planos mensais pela quantidade de corretores. O administrador da imobiliária não ocupa vaga.",
  note: "Leads, captações, vendas, agenda, Academy e Marketing sem limite em todos os planos. O limite de anúncios vale só para imóveis publicados no portal, que chega em breve. Planos e condições sujeitos à disponibilidade comercial.",
  cta: "Solicitar demonstração",
  plans: [
    { name: "Equipe 5", seats: "1 administrador + até 5 corretores", equipe: "Até 5 corretores", price: "390", anuncios: "50 anúncios no portal (em breve), compartilhados pela equipe" },
    { name: "Equipe 10", seats: "1 administrador + até 10 corretores", equipe: "Até 10 corretores", price: "650", anuncios: "100 anúncios no portal (em breve), compartilhados pela equipe", highlight: true },
    { name: "Equipe 30", seats: "1 administrador + até 30 corretores", equipe: "Até 30 corretores", price: "1.800", anuncios: "300 anúncios no portal (em breve), compartilhados pela equipe" },
    { name: "Equipe 60", seats: "1 administrador + até 60 corretores", equipe: "Até 60 corretores", price: "3.300", anuncios: "600 anúncios no portal (em breve), compartilhados pela equipe" },
  ] as { name: string; seats: string; equipe: string; price: string; anuncios: string; highlight?: boolean }[],
  /** Plano para corretor autônomo: produto separado, sem equipe (não é um degrau dos planos de equipe). */
  solo: {
    name: "Solo",
    eyebrow: "É corretor autônomo?",
    title: "Plano Solo, só para você.",
    text: "Todas as ferramentas da Frankkia para quem trabalha sozinho: leads, captações, vendas, agenda e Academy, sem equipe para gerenciar.",
    seats: "1 corretor (sem equipe)",
    equipe: "Corretor autônomo (Solo)",
    price: "99",
    anuncios: "15 anúncios no portal (em breve)",
  },
};

export const faq = {
  eyebrow: "Dúvidas",
  title: "Perguntas frequentes",
  text: "Não encontrou o que procurava? Escreva para",
  items: [
    {
      q: "O que é Frankkia?",
      a: "A Frankkia é uma proposta de ecossistema de tecnologia para o mercado imobiliário, reunindo gestão, performance, capacitação e ferramentas comerciais. Esta primeira versão apresenta a plataforma por meio de interfaces demonstrativas.",
    },
    {
      q: "Para quem a plataforma foi desenvolvida?",
      a: "Para proprietários, diretores e gestores de imobiliárias, além dos corretores e equipes comerciais que participam da operação no dia a dia.",
    },
    {
      q: "A contratação é individual ou por imobiliária?",
      a: "O modelo de contratação previsto é por imobiliária, com planos mensais dimensionados pela quantidade de corretores. Os planos e as condições estão sujeitos à disponibilidade comercial.",
    },
    {
      q: "Como os corretores recebem acesso?",
      a: "Na experiência planejada, a imobiliária poderá cadastrar gestores e corretores e disponibilizar acessos individuais. O cadastro e a autenticação ainda não estão disponíveis nesta versão demonstrativa.",
    },
    {
      q: "Posso importar dados de planilhas?",
      a: "A importação de planilhas faz parte da proposta do módulo Frankkia Performance. Esse recurso está em desenvolvimento e ainda não pode ser utilizado nesta versão.",
    },
    {
      q: "A Frankkia funciona para qualquer imobiliária?",
      a: "Sim. A proposta da Frankkia é atender imobiliárias de diferentes tamanhos e modelos de operação, independentemente de rede ou franquia. A marca é independente.",
    },
    {
      q: "Como solicitar uma demonstração?",
      a: "Clique em “Solicitar demonstração” e deixe seu nome, imobiliária, e-mail e WhatsApp. A equipe Frankkia fala com você pelo WhatsApp em até 24 horas para agendar uma apresentação sem compromisso.",
    },
  ],
};

export const demo = {
  eyebrow: "Demonstração",
  title: "Solicite uma demonstração.",
  text: "Conheça a Frankkia por dentro e veja como ela pode se conectar à operação da sua imobiliária.",
  notice: "Respondemos pelo WhatsApp em até 24 horas. Sem compromisso.",
  submitted: "Recebemos seu pedido! Vamos falar com você pelo WhatsApp em até 24 horas.",
  fields: { name: "Seu nome", company: "Imobiliária", email: "E-mail", phone: "Telefone" },
  teamSize: ["Corretor autônomo (Solo)", "Até 5 corretores", "Até 10 corretores", "Até 30 corretores", "Até 60 corretores", "Mais de 60 corretores"],
  submit: "Solicitar demonstração",
};
