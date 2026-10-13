export const plans = [
  { name: 'Equipe 15', brokers: 15, price: 999 },
  { name: 'Equipe 30', brokers: 30, price: 1799 },
  { name: 'Equipe 60', brokers: 60, price: 2999 },
  { name: 'Equipe 100', brokers: 100, price: 4499 },
] as const;
export const navigation = [
  { label: 'Plataforma', id: 'plataforma' }, { label: 'Soluções', id: 'solucoes' },
  { label: 'Como funciona', id: 'como-funciona' }, { label: 'Planos', id: 'planos' }, { label: 'Sobre', id: 'sobre' },
];
export const demoRanking = [
  { initials: 'MC', name: 'Marina Costa', value: 'R$ 420 mil', role: '12 negócios' },
  { initials: 'RL', name: 'Rafael Lima', value: 'R$ 365 mil', role: '10 negócios' },
  { initials: 'AS', name: 'Ana Souza', value: 'R$ 298 mil', role: '8 negócios' },
];
export const faqs = [
  { question: 'O que é a Frankkia?', answer: 'A Frankkia é uma proposta de ecossistema de tecnologia para o mercado imobiliário, reunindo gestão, performance, capacitação e ferramentas comerciais. Esta primeira versão apresenta a plataforma por meio de interfaces demonstrativas.' },
  { question: 'Para quem a plataforma foi desenvolvida?', answer: 'Para proprietários, diretores e gestores de imobiliárias, além dos corretores e equipes comerciais que participam da operação no dia a dia.' },
  { question: 'A contratação é individual ou por imobiliária?', answer: 'O modelo de contratação previsto é por imobiliária, com planos mensais dimensionados pela quantidade de corretores. Os planos e as condições estão sujeitos à disponibilidade comercial.' },
  { question: 'Como os corretores recebem acesso?', answer: 'Na experiência planejada, a imobiliária poderá cadastrar gestores e corretores e disponibilizar acessos individuais. O cadastro e a autenticação ainda não estão disponíveis nesta versão demonstrativa.' },
  { question: 'Posso importar dados de planilhas?', answer: 'A importação de planilhas faz parte da proposta do módulo Frankkia Performance. Esse recurso está em desenvolvimento e ainda não pode ser utilizado nesta versão.' },
  { question: 'A Frankkia funciona para qualquer imobiliária?', answer: 'Sim. A proposta da Frankkia é atender imobiliárias de diferentes tamanhos e modelos de operação, independentemente de rede ou franquia. A marca é independente.' },
  { question: 'Como solicitar uma demonstração?', answer: 'A seção de demonstração apresenta os campos previstos para solicitar contato. Nesta etapa, o formulário é apenas visual: não envia nem armazena dados. O canal de solicitação será habilitado quando estiver disponível comercialmente.' },
];
export const tools = [
 { name: 'ApresentaImóvel', description: 'Apresentações de imóveis com uma experiência comercial mais profissional.', type: 'presentation' },
 { name: 'PósVisita', description: 'Organização de feedbacks e próximos passos depois de cada visita.', type: 'visit' },
 { name: 'CaptaCheck', description: 'Checklists para uma captação mais organizada e consistente.', type: 'check' },
 { name: 'PropostaFácil', description: 'Estruturação de propostas comerciais com clareza e agilidade.', type: 'proposal' },
 { name: 'SimulaCasa', description: 'Simulações para apoiar as conversas sobre a compra de um imóvel.', type: 'simulation' },
 { name: 'ImobStudio', description: 'Criação de materiais para fortalecer o marketing imobiliário.', type: 'studio' },
] as const;
export const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(price);
