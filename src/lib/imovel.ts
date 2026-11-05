/**
 * Tipos de imóvel e características no padrão dos portais (VivaReal/ZAP), usados no cadastro, no anúncio e nos
 * filtros do portal. O valor guardado no banco é curto; o rótulo é o que o cliente vê (igual ao dos portais).
 * Ao mudar esta lista, atualize também o check de `imoveis.categoria` e `TIPOS` em supabase/functions/_shared/vrsync.ts.
 */
export type GrupoImovel = "Residencial" | "Comercial";

export const TIPOS_IMOVEL: { valor: string; rotulo: string; plural: string; grupo: GrupoImovel }[] = [
  { valor: "Apartamento", rotulo: "Apartamento", plural: "Apartamentos", grupo: "Residencial" },
  { valor: "Casa", rotulo: "Casa", plural: "Casas", grupo: "Residencial" },
  { valor: "Casa de condomínio", rotulo: "Casa de Condomínio", plural: "Casas de Condomínio", grupo: "Residencial" },
  { valor: "Chácara", rotulo: "Chácara", plural: "Chácaras", grupo: "Residencial" },
  { valor: "Cobertura", rotulo: "Cobertura", plural: "Coberturas", grupo: "Residencial" },
  { valor: "Flat", rotulo: "Flat", plural: "Flats", grupo: "Residencial" },
  { valor: "Kitnet", rotulo: "Kitnet/Conjugado", plural: "Kitnets/Conjugados", grupo: "Residencial" },
  { valor: "Terreno", rotulo: "Lote/Terreno", plural: "Lotes/Terrenos", grupo: "Residencial" },
  { valor: "Sobrado", rotulo: "Sobrado", plural: "Sobrados", grupo: "Residencial" },
  { valor: "Edifício residencial", rotulo: "Edifício Residencial", plural: "Edifícios Residenciais", grupo: "Residencial" },
  { valor: "Fazenda/Sítio", rotulo: "Fazenda/Sítios/Chácaras", plural: "Fazendas/Sítios/Chácaras", grupo: "Residencial" },
  { valor: "Consultório", rotulo: "Consultório", plural: "Consultórios", grupo: "Comercial" },
  { valor: "Galpão", rotulo: "Galpão/Depósito/Armazém", plural: "Galpões/Depósitos/Armazéns", grupo: "Comercial" },
  { valor: "Imóvel comercial", rotulo: "Imóvel Comercial", plural: "Imóveis Comerciais", grupo: "Comercial" },
  { valor: "Terreno comercial", rotulo: "Lote/Terreno", plural: "Lotes/Terrenos comerciais", grupo: "Comercial" },
  { valor: "Loja", rotulo: "Ponto Comercial/Loja/Box", plural: "Pontos Comerciais/Lojas/Boxes", grupo: "Comercial" },
  { valor: "Sala comercial", rotulo: "Sala/Conjunto", plural: "Salas/Conjuntos", grupo: "Comercial" },
  { valor: "Prédio inteiro", rotulo: "Prédio/Edifício Inteiro", plural: "Prédios/Edifícios Inteiros", grupo: "Comercial" },
];

/** Rótulo do tipo para o cliente (ex.: "Kitnet" → "Kitnet/Conjugado"). */
export const rotuloTipo = (valor: string) => TIPOS_IMOVEL.find((t) => t.valor === valor)?.rotulo ?? valor;

/** Plural do tipo (ex.: "Apartamentos"), para "Apartamentos à venda em Belém". */
export const pluralTipo = (valor: string) => TIPOS_IMOVEL.find((t) => t.valor === valor)?.plural ?? valor;

/** Tipos com número de unidade (apartamento, sala...). */
export const TIPOS_COM_UNIDADE = ["Apartamento", "Cobertura", "Flat", "Kitnet", "Sala comercial", "Consultório"];
export const unidadeEhSala = (categoria: string) => categoria === "Sala comercial" || categoria === "Consultório";

/**
 * Características do anúncio, em grupos (referência: iList/REMAX e portais). Os textos antigos continuam valendo.
 * `principal`: aparece direto no anúncio e nos filtros do portal; os outros grupos ficam em "Mais características".
 * "Lazer e esporte", "Condomínio" e "Segurança" são do prédio (ficha do Endereço e aba Condomínio do anúncio).
 */
export const GRUPOS_CARACTERISTICAS: { titulo: string; itens: string[]; principal?: boolean }[] = [
  {
    titulo: "Características do imóvel",
    principal: true,
    itens: [
      "Aceita pets", "Ar-condicionado", "Ar-condicionado central", "Armários planejados", "Armários na cozinha", "Banheira", "Hidromassagem",
      "Lareira", "Mobiliado", "Sem mobília", "Aquecimento solar", "Chuveiro a gás", "Ventilador de teto", "Janelas grandes",
      "Fechadura digital", "Automação residencial", "Registro de água individual", "Registro de gás individual", "Churrasqueira na varanda",
      "Mais de um andar", "Reformado", "Precisa de reforma", "Vista para o mar",
    ],
  },
  {
    titulo: "Ambientes",
    itens: [
      "Ambientes integrados", "Área de serviço", "Biblioteca", "Closet", "Cozinha americana", "Cozinha gourmet", "Cozinha grande",
      "Dependência de empregada", "Depósito", "Despensa", "Edícula", "Casa de caseiro", "Escritório", "Hall de entrada", "Home theater",
      "Lavabo", "Mezanino", "Quintal", "Sala de jantar", "Sótão", "Terraço", "Varanda / sacada", "Varanda gourmet",
    ],
  },
  {
    titulo: "Lazer e esporte",
    principal: true,
    itens: [
      "Academia", "Brinquedoteca", "Churrasqueira", "Cinema", "Espaço de beleza", "Espaço gourmet", "Jardim", "Área verde", "Piscina",
      "Piscina semiolímpica", "Pista de cooper", "Playground", "Quadra de areia", "Quadra de futebol", "Quadra de squash", "Quadra de tênis",
      "Quadra poliesportiva", "Salão de festas", "Salão de jogos",
    ],
  },
  {
    titulo: "Condomínio",
    principal: true,
    itens: [
      "Acesso para deficientes", "Bicicletário", "Coleta seletiva", "Condomínio sustentável", "Coworking", "Elevador",
      "Estacionamento para visitantes", "Garagem no subsolo", "Lavanderia", "Manobrista", "Recepção", "Sala de reunião", "Sauna", "Spa",
      "Vaga para motos", "Zelador", "Acesso à praia",
    ],
  },
  {
    titulo: "Segurança",
    principal: true,
    itens: ["Condomínio fechado", "Portão eletrônico", "Portaria 24h", "Câmeras de segurança", "Guarita blindada", "Ronda / vigilância", "Sistema de alarme", "Interfone"],
  },
  {
    titulo: "Infraestrutura",
    itens: [
      "Cabeamento estruturado", "Carregador para carro elétrico", "Energia solar", "Gerador de energia", "Poço artesiano", "Caixa d'água",
      "Lava-louças", "Lavadora e secadora", "Internet", "TV a cabo",
    ],
  },
  {
    titulo: "Construção e acabamento",
    itens: [
      "Construção nova", "Construção antiga", "Moderno", "Contemporâneo", "Casa de vila", "Imóvel tombado (histórico)", "Inacabado",
      "Fachada em cerâmica", "Fachada em pastilha", "Fachada em pedra", "Tijolo aparente", "Concreto aparente", "Madeira", "Pré-fabricado",
    ],
  },
  {
    titulo: "Sol e vista",
    itens: ["Sol da manhã (nascente)", "Sol da tarde (poente)", "Face norte", "Face sul", "Vista livre", "Vista panorâmica", "Vista para o rio", "Vista para lago", "Vista para a serra"],
  },
  {
    titulo: "Localização",
    itens: [
      "Área residencial", "Centro da cidade", "Rua tranquila", "Rua movimentada", "Rua asfaltada", "Beira-mar", "Próximo ao metrô",
      "Perto de ônibus", "Perto de transporte público", "Perto de escolas", "Perto de hospital", "Perto de shopping", "Perto de comércio",
      "Perto de parque / praça", "Perto do aeroporto", "Perto da rodovia",
    ],
  },
  {
    titulo: "Negociação",
    principal: true,
    itens: ["Aceita financiamento", "Aceita permuta", "Primeiro proprietário", "Ideal para investimento", "Não aceita sublocação"],
  },
];
export const CARACTERISTICAS = GRUPOS_CARACTERISTICAS.flatMap((g) => g.itens);

/** No anúncio, as características ficam em duas abas: do imóvel e do condomínio (lazer, áreas comuns e segurança). */
const DO_CONDOMINIO = new Set(GRUPOS_CARACTERISTICAS.filter((g) => ["Lazer e esporte", "Condomínio", "Segurança"].includes(g.titulo)).flatMap((g) => g.itens));
export const ehDoCondominio = (c: string) => DO_CONDOMINIO.has(c);

/** "Imóvel novo" (lançamento): fase da obra. */
export type Lancamento = "na_planta" | "em_construcao" | "pronto";
export const LANCAMENTOS: { valor: Lancamento; rotulo: string }[] = [
  { valor: "na_planta", rotulo: "Na planta" },
  { valor: "em_construcao", rotulo: "Em construção" },
  { valor: "pronto", rotulo: "Pronto para morar" },
];
