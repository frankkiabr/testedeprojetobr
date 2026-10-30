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

/** Características do anúncio, em grupos como nos portais. Os textos antigos continuam valendo. */
export const GRUPOS_CARACTERISTICAS: { titulo: string; itens: string[] }[] = [
  {
    titulo: "Características do imóvel",
    itens: [
      "Aceita pets", "Ar-condicionado", "Armários planejados", "Closet", "Cozinha americana", "Mobiliado", "Varanda / sacada",
      "Varanda gourmet", "Área de serviço", "Quintal", "Lareira", "Aquecimento solar", "Hidromassagem", "Registro de água individual",
      "Registro de gás individual", "Vista para o mar",
    ],
  },
  {
    titulo: "Lazer e esporte",
    itens: [
      "Academia", "Churrasqueira", "Espaço gourmet", "Jardim", "Piscina", "Playground", "Quadra de squash", "Quadra de tênis",
      "Quadra poliesportiva", "Salão de festas", "Salão de jogos",
    ],
  },
  { titulo: "Condomínio", itens: ["Acesso para deficientes", "Bicicletário", "Coworking", "Elevador", "Lavanderia", "Sauna", "Spa"] },
  { titulo: "Segurança", itens: ["Condomínio fechado", "Portão eletrônico", "Portaria 24h", "Câmeras de segurança"] },
  { titulo: "Negociação e região", itens: ["Aceita financiamento", "Aceita permuta", "Próximo ao metrô"] },
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
