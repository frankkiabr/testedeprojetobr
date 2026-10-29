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

/** Seção "Seus imóveis na vitrine": o portal de imóveis como benefício de quem assina. */
export const vitrine = {
  eyebrow: "Portal Frankkia",
  title: "Seus imóveis na vitrine.",
  text: "Ao assinar, sua imobiliária ganha uma vitrine pública: cada imóvel captado vira um anúncio com fotos, mapa e contato direto, pronto para compartilhar.",
  items: [
    { title: "Página para cada imóvel, corretor e imobiliária", text: "Endereço próprio, fotos em destaque, filtros e o CRECI de quem anuncia." },
    { title: "Aparece no Google", text: "As páginas chegam prontas para o Google ler, inclusive por cidade e bairro." },
    { title: "Prévia bonita no WhatsApp", text: "Compartilhe o link e o cliente já vê a foto, o título e o preço do imóvel." },
    { title: "Contato vira lead no CRM", text: "Quem pede informações cai direto no funil do corretor responsável." },
  ],
  cta: "Ver os imóveis",
};

export const pricing = {
  eyebrow: "Planos",
  title: "Planos para o tamanho da sua equipe.",
  text: "Planos mensais pela quantidade de corretores. O administrador da imobiliária não ocupa vaga.",
  note: "Leads, captações, vendas, agenda, Academy e Marketing sem limite em todos os planos. O limite de anúncios vale só para imóveis publicados no portal de imóveis da Frankkia. Planos e condições sujeitos à disponibilidade comercial.",
  cta: "Solicitar demonstração",
  ctaTeste: "Começar teste grátis",
  ctaConversa: "Falar com o Luiz",
  plans: [
    { name: "Equipe 5", seats: "1 administrador + até 5 corretores", equipe: "Até 5 corretores", price: "315", anuncios: "100 anúncios no portal, compartilhados pela equipe" },
    { name: "Equipe 10", seats: "1 administrador + até 10 corretores", equipe: "Até 10 corretores", price: "525", anuncios: "150 anúncios no portal, compartilhados pela equipe", highlight: true },
    { name: "Equipe 30", seats: "1 administrador + até 30 corretores", equipe: "Até 30 corretores", price: "1.450", anuncios: "300 anúncios no portal, compartilhados pela equipe" },
    { name: "Equipe 60", seats: "1 administrador + até 60 corretores", equipe: "Até 60 corretores", price: "2.650", anuncios: "1.000 anúncios no portal, compartilhados pela equipe" },
  ] as { name: string; seats: string; equipe: string; price: string; anuncios: string; highlight?: boolean }[],
  /** Plano para corretor autônomo: produto separado, sem equipe (não é um degrau dos planos de equipe). */
  solo: {
    name: "Solo",
    eyebrow: "É corretor autônomo?",
    title: "Plano Solo, só para você.",
    text: "Todas as ferramentas da Frankkia para quem trabalha sozinho: leads, captações, vendas, agenda, estudo de mercado e portal, sem equipe para gerenciar.",
    seats: "1 corretor (sem equipe)",
    equipe: "Corretor autônomo (Solo)",
    price: "79,90",
    anuncios: "50 anúncios no portal",
  },
};

export const faq = {
  eyebrow: "Dúvidas",
  title: "Perguntas frequentes",
  text: "Não encontrou o que procurava? Escreva para",
  items: [
    {
      q: "O que é Frankkia?",
      a: "A Frankkia é uma proposta de ecossistema de tecnologia para o mercado imobiliário, reunindo gestão, performance, capacitação e ferramentas comerciais. Inclui um portal público onde os imóveis das imobiliárias e corretores clientes são anunciados.",
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
      a: "O administrador da imobiliária convida cada corretor pelo e-mail. O corretor completa o cadastro (com o CRECI) e passa a ter acesso individual, vendo apenas os próprios clientes e negócios.",
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
      q: "Os anúncios no portal têm custo extra?",
      a: "Não. O portal está incluído em todos os planos. Cada plano tem um limite de imóveis publicados ao mesmo tempo (de 50 no Solo a 1.000 no Equipe 60), compartilhado pela equipe. O CRM continua sem limite.",
    },
    {
      q: "Para quem vão os contatos dos anúncios?",
      a: "Para o corretor responsável pelo imóvel. Quem pede informações pelo formulário entra direto como lead no funil dele, e o botão de WhatsApp abre a conversa com ele.",
    },
    {
      q: "Vocês enviam os anúncios para Zap, OLX e VivaReal?",
      a: "Esse envio automático está em desenvolvimento. Por enquanto, os anúncios ficam no portal da Frankkia e podem ser compartilhados por link.",
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

/** Contato comercial: para onde a página de captura (/conheca-a-frankkia) e a página Sobre levam. */
export const contato = {
  /** Só números, com DDI 55 e DDD. */
  whatsapp: "5591980959265",
  whatsappExibir: "(91) 98095-9265",
  responsavel: "Luiz Horizonte",
  primeiroNome: "Luiz",
};

/** Quem criou a Frankkia (página /sobre e página de captura). A foto vai em public/luiz-horizonte.jpg. */
export const criador = {
  nome: "Luiz Horizonte",
  papel: "Criador da Frankkia",
  foto: "/luiz-horizonte.jpg",
  resumo: "Marketing estratégico, inteligência digital e mais de 5 anos de experiência prática no mercado imobiliário.",
  bio: [
    "Luiz Horizonte trabalha com marketing estratégico, inteligência digital e inovação, somando mais de 5 anos de experiência prática no mercado imobiliário. Nascido em Belém do Pará e graduado em Marketing pela UNAMA, ele utiliza sua bagagem em automação e análise de dados para conectar pessoas e negócios de forma ágil e moderna.",
    "Uma de suas maiores características profissionais é a otimização do trabalho através do uso de Inteligência Artificial, aplicando a tecnologia para tornar processos mais rápidos e eficientes. Em janeiro de 2026, idealizou a plataforma Dissnorteados, que hoje se consolidou como o maior site de mapeamento artístico da Região Norte do Brasil.",
  ],
};

/** Página de captura dos anúncios (Instagram e YouTube): leva a pessoa para o WhatsApp. */
export const captura = {
  eyebrow: "Para imobiliárias e corretores",
  title: "Pare de perder negócio no caderno, na planilha e no WhatsApp.",
  text: "A Frankkia junta leads, captações, agenda, equipe e um portal de imóveis em uma só plataforma. Chame no WhatsApp e veja tudo funcionando com a rotina da sua imobiliária.",
  cta: "Chamar no WhatsApp",
  garantias: ["Apresentação sem compromisso", "Período de teste grátis", "Sem instalar nada"],
  dores: {
    eyebrow: "Soa familiar?",
    title: "O dia a dia que custa vendas.",
    items: [
      { title: "Lead esquecido", text: "O contato chegou pelo Instagram ou pelo portal e ninguém respondeu a tempo." },
      { title: "Captação travada", text: "O imóvel não anda porque falta matrícula, avaliação ou autorização e ninguém percebeu." },
      { title: "Equipe no escuro", text: "Você não sabe quem está atendendo, quem está captando e quem está vendendo." },
      { title: "Proprietário cobrando", text: "Ele quer saber o que foi feito pelo imóvel e o relatório não existe." },
    ],
  },
  solucao: {
    eyebrow: "A solução",
    title: "Tudo o que a sua operação precisa, em um só lugar.",
  },
  publicos: {
    eyebrow: "Para quem é",
    title: "Feita para o tamanho da sua operação.",
    items: [
      {
        title: "Imobiliárias",
        text: "O administrador vê a operação inteira: funil, captações, vendas, ranking e metas. Cada corretor vê só os próprios clientes e negócios.",
        pontos: ["Planos de 5 a 60 corretores", "O administrador não ocupa vaga", "Academy para treinar a equipe"],
        planos: "Equipe",
      },
      {
        title: "Corretores autônomos",
        text: "Todas as ferramentas para quem trabalha sozinho, sem equipe para gerenciar: leads, captações, agenda, Academy e seus imóveis no portal.",
        pontos: ["1 corretor, sem equipe", "50 anúncios no portal", "Relatório ao proprietário pelo WhatsApp"],
        planos: "Solo",
      },
    ],
  },
  passos: {
    eyebrow: "Como começar",
    title: "Três passos até a sua equipe usar.",
    items: [
      { title: "Chame no WhatsApp", text: "Conte como a sua imobiliária trabalha hoje." },
      { title: "Veja funcionando", text: "Uma apresentação rápida, no horário que for melhor para você." },
      { title: "Comece a testar", text: "Sua conta é criada com um período de teste grátis e você convida a equipe." },
    ],
  },
  final: {
    title: "Vamos organizar a sua imobiliária?",
    text: "Fale direto com quem criou a Frankkia.",
  },
};

/** Páginas por público (/para-imobiliarias e /para-corretores) e o seletor logo abaixo do topo da home. */
export const publicos = {
  seletor: {
    eyebrow: "Para quem é",
    title: "Qual é o seu caso?",
    cards: [
      {
        to: "/para-imobiliarias",
        titulo: "Tenho uma imobiliária",
        texto: "Equipe, metas, ranking e comissões num só lugar, com cada corretor vendo só o que é dele.",
      },
      {
        to: "/para-corretores",
        titulo: "Sou corretor autônomo",
        texto: "Tudo o que uma imobiliária tem, só para você: leads, captações, portal e estudo de mercado.",
      },
    ],
  },
  imobiliarias: {
    titulo: "Para imobiliárias",
    eyebrow: "Para imobiliárias",
    title: "Sua equipe inteira, num só lugar.",
    text: "Leads, captações, vendas e metas de todos os corretores na mesma tela. Você acompanha a operação sem precisar perguntar a ninguém.",
    cta: { label: "Testar grátis por 7 dias", plano: "Equipe 10" },
    dores: [
      { t: "Cada corretor guarda os clientes do seu jeito", d: "WhatsApp, caderno, planilha. Quando alguém sai, a carteira vai junto." },
      { t: "Os números só aparecem no fim do mês", d: "Sem saber quem está atendendo, captando e vendendo, fica difícil cobrar e reconhecer." },
      { t: "Captação sem acompanhamento esfria", d: "Documentos, autorização e retorno ao proprietário ficam para depois, e o imóvel vai para outra imobiliária." },
    ],
    recursos: [
      { t: "Funil de leads da equipe", d: "Quadro por etapa, checklist de atendimento e filtro por corretor." },
      { t: "Captações com checklist", d: "Documentação, autorização e relatório ao proprietário pelo WhatsApp." },
      { t: "Ranking e metas", d: "VGV, locações, captações e leads atendidos, por corretor e por mês." },
      { t: "Comissão protegida", d: "Cada corretor vê só a própria comissão. Você vê todas." },
      { t: "Agenda da equipe", d: "Visitas e compromissos de todos, com o Google Agenda de cada um." },
      { t: "Estudo de mercado", d: "Avaliação por amostras e apresentação pronta para o proprietário." },
      { t: "Portal de imóveis", d: "Anúncios com página própria; quem pede contato vira lead do corretor." },
      { t: "Academy e marketing", d: "Trilhas de treinamento e os materiais oficiais da sua marca para a equipe." },
    ],
    faq: [
      { q: "Um corretor vê os clientes dos outros?", a: "Não. Cada corretor vê só os próprios leads, captações, proprietários e negócios. O administrador vê tudo." },
      { q: "E se um corretor sair da imobiliária?", a: "Você desativa o acesso e tudo o que ele fez continua com a imobiliária: clientes, captações, vendas e o histórico no ranking." },
      { q: "O administrador ocupa vaga?", a: "Não. O plano Equipe 10, por exemplo, tem o administrador mais 10 corretores." },
      { q: "Posso testar antes?", a: "Sim: 7 dias grátis, sem cartão. Ao fim do teste, nada é cobrado automaticamente." },
    ],
  },
  corretores: {
    titulo: "Para corretores autônomos",
    eyebrow: "Para corretores autônomos",
    title: "Tudo de uma imobiliária, só para você.",
    text: "Organize clientes e captações, anuncie no portal com a sua página e mostre ao proprietário quanto vale o imóvel, sem planilha e sem caderno.",
    cta: { label: "Testar grátis por 7 dias", plano: "Solo" },
    dores: [
      { t: "Retornos esquecidos", d: "O cliente pediu para ligar semana que vem e a conversa se perdeu no WhatsApp." },
      { t: "Clientes espalhados", d: "Contatos, imóveis e proprietários em conversas, fotos e anotações soltas." },
      { t: "Sem vitrine própria", d: "Anunciar em portal grande custa caro, e o cliente nem sabe quem é você." },
    ],
    recursos: [
      { t: "Funil de leads", d: "Etapas de atendimento, checklist e aviso de lead novo do portal." },
      { t: "Captações e proprietários", d: "Checklist de documentos e relatório ao proprietário pelo WhatsApp." },
      { t: "Sua página no portal", d: "Seus imóveis com fotos, mapa, seu CRECI e suas redes sociais." },
      { t: "Estudo de mercado", d: "Valor de mercado por amostras e apresentação com a sua cara." },
      { t: "Agenda", d: "Visitas e compromissos, com o Google Agenda no celular." },
      { t: "Seus números", d: "VGV, honorários e meta do mês, sem dividir com ninguém." },
      { t: "Simulador de financiamento", d: "Parcela SAC e Price para enviar ao cliente." },
      { t: "Plano Solo", d: "Sem equipe para gerenciar. Montou uma equipe? A conta muda de plano e nada se perde." },
    ],
    faq: [
      { q: "Preciso ter CRECI?", a: "Sim. O CRECI aparece nos seus anúncios, como exige o conselho." },
      { q: "Meus clientes ficam visíveis para outras pessoas?", a: "Não. Leads, proprietários e negócios são só seus. No portal aparecem apenas os imóveis que você decidir anunciar." },
      { q: "E se eu montar uma equipe depois?", a: "A Frankkia muda a sua conta para um plano de equipe e mantém todos os seus dados." },
      { q: "Posso testar antes?", a: "Sim: 7 dias grátis, sem cartão. Ao fim do teste, nada é cobrado automaticamente." },
    ],
  },
};
