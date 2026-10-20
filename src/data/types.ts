/**
 * FORMATO DOS DADOS DA PLATAFORMA.
 * Cada tipo aqui vira uma tabela no banco de dados (Lovable Cloud) na próxima fase.
 */

/** Quem está vendo a tela. "frankkia" = você, criador da plataforma. */
export type Role = "frankkia" | "admin" | "corretor";

export type Imobiliaria = {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  cidade: string;
  plano: "Solo" | "Equipe 5" | "Equipe 10" | "Equipe 30" | "Equipe 60";
  limiteCorretores: number;
  metaMensalVGV: number;
};

export type Usuario = {
  id: string;
  imobiliariaId: string;
  nome: string;
  email: string;
  telefone?: string;
  papel: "admin" | "corretor";
  iniciais: string;
  metaMensalVGV?: number;
  /** false = acesso desativado pelo administrador (a vaga do plano é liberada). */
  ativo?: boolean;
  /** Data de nascimento (AAAA-MM-DD). */
  aniversario?: string;
  /** Número do CRECI (ex.: 84213-F) e estado de inscrição. */
  creci?: string;
  creciUF?: string;
  /** Estagiário não é obrigado a informar CRECI. */
  estagiario?: boolean;
  /** Foto de perfil (sem foto: mostra as iniciais). */
  fotoUrl?: string;
  /** Redes sociais (links completos), mostradas na página pública do corretor no portal. */
  redes?: Redes;
};

export type RedeChave = "instagram" | "facebook" | "linkedin" | "tiktok" | "youtube" | "site";
export type Redes = Partial<Record<RedeChave, string>>;

/** Corretor de fora da imobiliária, usado só para registrar parcerias (não tem acesso). */
export type Parceiro = {
  id: string;
  nome: string;
  creci?: string;
  empresa?: string;
  telefone?: string;
  fotoUrl?: string;
};

/** Convite enviado por e-mail que ainda não foi aceito (ocupa uma vaga do plano). */
export type Convite = {
  id: string;
  email: string;
  enviadoEm: string;
};

// ---------- Agenda ----------

export type TipoCompromisso = "visita" | "captacao" | "reuniao" | "ligacao" | "outro";

/**
 * Compromisso da agenda de um usuário (corretor, administrador ou Frankkia).
 * Visita ligada a um lead fica sincronizada com a data de visita do lead.
 */
export type Compromisso = {
  id: string;
  donoId: string;
  titulo: string;
  tipo: TipoCompromisso;
  inicio: string;
  fim: string;
  leadId?: string;
  captacaoId?: string;
  local?: string;
  /** Posição do local no mapa (quando encontrada). */
  localLat?: number;
  localLng?: number;
  observacoes?: string;
};

/** Conexão (simulada nesta fase) com o Google Agenda de cada usuário. */
export type ConexaoGoogle = { email: string; conectadoEm: string };

// ---------- Academy ----------

/** Vídeo: link do YouTube/Vimeo ("não listado"); MP4/MOV só nos exemplos antigos. Documento: PDF/DOC/DOCX. */
export type FormatoAula = "MP4" | "MOV" | "YOUTUBE" | "VIMEO" | "PDF" | "DOC" | "DOCX";

export type Aula = {
  id: string;
  titulo: string;
  tipo: "video" | "documento";
  formato: FormatoAula;
  arquivoNome: string;
  tamanhoBytes: number;
  duracaoMin?: number;
  /** Endereço do arquivo. Na demonstração, só existe para arquivos enviados nesta sessão. */
  url?: string;
  /** Vídeo hospedado no YouTube ou Vimeo: endereço do player (embed). */
  videoUrl?: string;
  /** Documento guardado no banco (caminho no armazenamento "academy"). */
  arquivoPath?: string;
};

export type Trilha = {
  id: string;
  titulo: string;
  subtitulo: string;
  criadoEm: string;
  capaHue: number;
  aulas: Aula[];
};

/** Aulas concluídas por usuário: { usuarioId: [aulaId, ...] } */
export type Progresso = Record<string, string[]>;

// ---------- Marketing ----------

export type ArquivoMarca = {
  nome: string;
  url: string;
  tamanhoBytes: number;
  largura: number;
  altura: number;
  enviadoEm: string;
  /** null = não foi possível verificar */
  transparente: boolean | null;
  /** Caminho no armazenamento "marca" (login real). */
  path?: string;
};

// ---------- Ajuda ----------

export type Chamado = {
  id: string;
  imobiliariaId: string;
  autorId: string;
  /** Nome de quem abriu (usado nos chamados de outras imobiliárias). */
  autorNome?: string;
  assunto: string;
  categoria: string;
  mensagem: string;
  criadoEm: string;
  status: "aberto" | "em_andamento" | "resolvido";
  /** Resposta da equipe Frankkia. */
  resposta?: string;
};

// ---------- Painel Frankkia (plataforma) ----------

export type PlanoNome = Imobiliaria["plano"];

export type ClienteStatus = "ativa" | "teste" | "pagamento" | "suspensa" | "aguardando";

/**
 * Imobiliária cliente vista pelo painel Frankkia.
 * Só dados de conta e volumes de uso — nunca leads, imóveis, vendas ou outros dados internos.
 */
export type Cliente = {
  id: string;
  nome: string;
  cidade: string;
  cnpj: string;
  plano: PlanoNome;
  status: ClienteStatus;
  clienteDesde: string;
  ultimoAcesso?: string;
  adminNome: string;
  adminEmail: string;
  /** Teste grátis: fim do período (conta a partir do 1º acesso do administrador) e duração combinada. */
  testeAte?: string;
  testeDias?: number;
  /** Vagas em uso (corretores ativos + convites). */
  corretores: number;
  /** Quantidade de ações por módulo nos últimos 30 dias. */
  uso: { negocios: number; performance: number; academy: number; marketing: number };
};

/**
 * Pedido de upgrade de plano: o administrador escolhe o plano e paga (Stripe);
 * com o pagamento confirmado, a Frankkia libera o novo plano.
 */
export type PedidoUpgrade = {
  id: string;
  imobiliariaId: string;
  planoAtual: PlanoNome;
  planoNovo: PlanoNome;
  valorMensal: number;
  criadoEm: string;
  /** aguardando = ainda não pagou; pendente = PIX/boleto em compensação */
  pagamento: "aguardando" | "pendente" | "confirmado" | "cancelado";
  metodo?: "cartao" | "pix" | "boleto";
  pagoEm?: string;
  liberado: boolean;
  liberadoEm?: string;
  /** Referência do pagamento (na versão real, o id da sessão da Stripe) */
  referencia: string;
};

export type ErroSistema = {
  id: string;
  mensagem: string;
  local: string;
  ocorrencias: number;
  imobiliarias: number;
  primeiraVez: string;
  ultimaVez: string;
  status: "novo" | "investigando" | "corrigido";
  /** "capturado" = erro real que aconteceu nesta sessão. */
  origem: "exemplo" | "capturado";
};

export type EtapaLead = "novo" | "contato" | "visita" | "proposta" | "fechado" | "perdido";

export type Lead = {
  id: string;
  corretorId: string;
  nome: string;
  telefone: string;
  origem: string;
  interesse: string;
  etapa: EtapaLead;
  criadoEm: string; // data ISO
  /** Um item por passo de CHECKLIST_LEAD. Lead "atendido" = pelo menos um passo marcado. */
  checklist: boolean[];
  visitaEm?: string;
  observacoes?: string;
};

/** Proprietário pertence ao corretor que o cadastrou (o administrador vê todos). */
export type Proprietario = {
  id: string;
  corretorId: string;
  nome: string;
  whatsapp: string; // só números, com DDI + DDD (ex.: 5511999998888)
};

/** Apartamento = edifício residencial (a unidade — apto, cobertura, studio — fica na captação). */
export type CategoriaImovel = "Apartamento" | "Casa" | "Sala comercial" | "Loja" | "Galpão" | "Terreno";

export type Endereco = {
  /** Tipo e nome do logradouro (ex.: Av. Senador Lemos) */
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
};

/**
 * IMÓVEL = o lugar físico (um edifício, uma casa, um galpão...).
 * É cadastrado uma vez e reaproveitado em várias captações ao longo do tempo.
 */
export type Imovel = {
  id: string;
  categoria: CategoriaImovel;
  /** Nome do edifício/condomínio (opcional para casas, galpões, terrenos) */
  nome?: string;
  endereco: Endereco;
  criadoEm: string;
  /** CEP (só números) e posição no mapa. */
  cep?: string;
  lat?: number;
  lng?: number;
};

export type Finalidade = "venda" | "locacao";

/**
 * CAPTAÇÃO = uma oferta de um imóvel (unidade, valor, finalidade, proprietário, corretor captador).
 * Locação: `valor` é o aluguel mensal.
 */
export type Captacao = {
  id: string;
  /** Código único do imóvel em todo o sistema (ex.: FK-7Q3M2X), para busca interna e no portal. */
  codigo?: string;
  corretorId: string;
  proprietarioId: string;
  imovelId: string;
  /** Ex.: "Apto 302", "Sala 1204" */
  unidade?: string;
  finalidade: Finalidade;
  valor: number;
  areaM2: number;
  status: "ativa" | "vendida" | "alugada";
  captadoEm: string;
  /** Um item por etapa de CHECKLIST_CAPTACAO (documentação e preparo do imóvel). */
  checklistCaptacao: boolean[];
  /** Um item por ação de CHECKLIST_MARKETING (divulgação). */
  checklistMarketing: boolean[];
};

/** Quem participa de uma transação e quanto recebe (% dos honorários). */
export type Participante = {
  tipo: "corretor" | "parceiro";
  refId: string;
  pct: number;
};

/**
 * TRANSAÇÃO = venda ou locação registrada pelo administrador.
 * Honorários = valor × honorariosPct. Cada participante recebe a sua % dos honorários;
 * o que sobra fica com a imobiliária.
 * Venda gera VGV; locação gera volume de locação; a parte de cada corretor gera o VGC dele.
 */
export type Transacao = {
  id: string;
  tipo: Finalidade;
  captacaoId: string;
  valor: number;
  honorariosPct: number;
  data: string;
  /** Comprador ou locatário */
  cliente?: string;
  participantes: Participante[];
};

/** Fechamento informado pelo corretor, aguardando o administrador registrar. */
export type FechamentoInformado = {
  id: string;
  corretorId: string;
  captacaoId: string;
  tipo: Finalidade;
  valor: number;
  data: string;
  observacao?: string;
  criadoEm: string;
  status: "pendente" | "registrado" | "descartado";
};

// ---------- Interessados (pedidos de apresentação) e links de demonstração ----------

export type StatusInteressado = "novo" | "em_contato" | "demo_liberada" | "cliente" | "descartado";

/** Dono de imobiliária que pediu uma apresentação pelo site. Só a equipe Frankkia vê. */
export type Interessado = {
  id: string;
  nome: string;
  imobiliaria: string;
  email: string;
  /** Só números, com 55 (ex.: 5511987654321). */
  telefone: string;
  equipe?: string;
  mensagem?: string;
  origem: "site" | "login" | "pagina";
  status: StatusInteressado;
  observacao?: string;
  criadoEm: string;
};

/** Link de demonstração liberado pela Frankkia (abre /demo/<token> até a data de validade). */
export type AcessoDemo = {
  id: string;
  interessadoId?: string;
  nome: string;
  token: string;
  expiraEm: string;
  revogado: boolean;
  usos: number;
  ultimoUso?: string;
  criadoEm: string;
};

// ---------- Portal: anúncio de cada captação ----------

export type FotoAnuncio = { id: string; url: string; chave: string; ordem: number };

/** Anúncio público de uma captação (fase 1: edição no painel; as páginas públicas vêm na fase 2). */
export type Anuncio = {
  captacaoId: string;
  titulo: string;
  descricao: string;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  condominio?: number;
  iptu?: number;
  caracteristicas: string[];
  publicado: boolean;
  publicadoEm?: string;
  /** Endereço da página pública: frankkia.com/imovel/<slug> */
  slug?: string;
  fotos: FotoAnuncio[];
};
