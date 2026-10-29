// Arquivo dos portais (ZAP Imóveis, VivaReal e OLX) no padrão VRSync do Grupo OLX.
// Documentação: https://developers.grupozap.com/feeds/vrsync/
// Usado pela função feed-portais (gera o XML) e pelo app (mostra o que falta em cada anúncio). Sem APIs do Deno.

export type ImovelPortal = {
  codigo: string;
  finalidade: string;
  valor: number;
  area: number;
  unidade?: string | null;
  categoria: string;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  lat?: number | null;
  lng?: number | null;
  titulo?: string | null;
  descricao?: string | null;
  quartos?: number | null;
  suites?: number | null;
  banheiros?: number | null;
  vagas?: number | null;
  condominio?: number | null;
  iptu?: number | null;
  caracteristicas?: string[] | null;
  destaque?: string | null;
  fotos: string[];
  corretor: { nome: string; email?: string | null; telefone?: string | null };
};

export type DadosFeed = {
  imobiliaria: { nome: string; email?: string | null; telefone?: string | null; logo?: string | null };
  imoveis: ImovelPortal[];
};

/** Categoria da Frankkia → tipo do VRSync. `lote`: a área vai como área total (LotArea), não útil. */
export const TIPOS: Record<string, { tipo: string; uso: "Residential" | "Commercial"; lote?: boolean; quartos?: boolean; banheiros?: boolean }> = {
  Apartamento: { tipo: "Residential / Apartment", uso: "Residential", quartos: true, banheiros: true },
  Casa: { tipo: "Residential / Home", uso: "Residential", quartos: true, banheiros: true },
  "Sala comercial": { tipo: "Commercial / Office", uso: "Commercial", banheiros: true },
  Loja: { tipo: "Commercial / Business", uso: "Commercial" },
  Galpão: { tipo: "Commercial / Industrial", uso: "Commercial", lote: true },
  Terreno: { tipo: "Residential / Land Lot", uso: "Residential", lote: true },
};

/** Características da Frankkia → valores aceitos pelos portais (as que não têm equivalente ficam só na descrição). */
export const FEATURES: Record<string, string> = {
  Piscina: "Pool",
  Churrasqueira: "BBQ",
  Academia: "Gym",
  "Salão de festas": "Party Room",
  Playground: "Playground",
  "Portaria 24h": "Concierge 24h",
  Elevador: "Elevator",
  "Varanda / sacada": "Balcony",
  "Varanda gourmet": "Gourmet Balcony",
  Mobiliado: "Furnished",
  "Ar-condicionado": "Cooling",
  "Armários planejados": "Planned Furniture",
  "Aceita pets": "Pets Allowed",
  Quintal: "Backyard",
  Jardim: "Garden Area",
  "Área de serviço": "Laundry",
  Lareira: "Fireplace",
  "Vista para o mar": "Ocean View",
};

export const FOTOS_MINIMO = 5;

const ESTADOS: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba",
  PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

/** Os portais não aceitam tags HTML na descrição nem no título. */
const semTags = (s?: string | null) => (s ?? "").replace(/<[^>]*>/g, " ").replace(/[ \t]+/g, " ").trim();

/** O que falta para o anúncio ser aceito pelos portais (lista vazia = pronto). */
export function pendenciasPortais(i: ImovelPortal): string[] {
  const p: string[] = [];
  const t = TIPOS[i.categoria];
  if (!t) p.push(`O tipo "${i.categoria}" ainda não é enviado aos portais.`);
  if (i.fotos.length < FOTOS_MINIMO)
    p.push(`Pelo menos ${FOTOS_MINIMO} fotos na versão para portais (tem ${i.fotos.length}). Fotos enviadas antes desta função precisam ser enviadas de novo.`);
  const titulo = semTags(i.titulo);
  if (titulo.length < 10 || titulo.length > 100) p.push("Título com 10 a 100 caracteres.");
  const desc = semTags(i.descricao);
  if (desc.length < 50 || desc.length > 3000) p.push("Descrição com 50 a 3.000 caracteres.");
  if (!(i.cep ?? "").replace(/\D/g, "")) p.push("CEP do imóvel.");
  if (!i.bairro || !i.cidade || !i.uf) p.push("Bairro, cidade e estado.");
  if (!(i.valor > 0)) p.push("Valor do imóvel.");
  if (!(i.area > 0)) p.push("Área do imóvel.");
  if (t?.quartos && i.quartos == null) p.push("Número de quartos.");
  if (t?.banheiros && !i.banheiros) p.push("Número de banheiros.");
  if (!i.corretor.email) p.push("E-mail do corretor responsável.");
  return p;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Texto dentro de CDATA (sem quebrar o "]]>"). */
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
const int = (n: number) => Math.round(n);
const so = (cond: unknown, xml: string) => (cond ? xml : "");

function listing(i: ImovelPortal): string {
  const t = TIPOS[i.categoria]!;
  const venda = i.finalidade !== "locacao";
  const features = [...new Set((i.caracteristicas ?? []).map((c) => FEATURES[c]).filter(Boolean))];
  const tel = (i.corretor.telefone ?? "").replace(/\D/g, "");
  return `    <Listing>
      <ListingID>${esc(i.codigo)}</ListingID>
      <Title>${cdata(semTags(i.titulo))}</Title>
      <TransactionType>${venda ? "For Sale" : "For Rent"}</TransactionType>
      <PublicationType>${esc(i.destaque || "STANDARD")}</PublicationType>
      <Media>
${i.fotos.map((u, k) => `        <Item medium="image"${k === 0 ? ' primary="true"' : ""}>${esc(u)}</Item>`).join("\n")}
      </Media>
      <Details>
        <UsageType>${t.uso}</UsageType>
        <PropertyType>${t.tipo}</PropertyType>
        <Description>${cdata(semTags(i.descricao))}</Description>
        ${venda ? `<ListPrice currency="BRL">${int(i.valor)}</ListPrice>` : `<RentalPrice currency="BRL" period="Monthly">${int(i.valor)}</RentalPrice>`}
        ${so(i.condominio, `<PropertyAdministrationFee currency="BRL">${int(i.condominio ?? 0)}</PropertyAdministrationFee>`)}
        ${so(i.iptu, `<Iptu currency="BRL" period="Yearly">${int(i.iptu ?? 0)}</Iptu>`)}
        ${t.lote ? `<LotArea unit="square metres">${int(i.area)}</LotArea>` : `<LivingArea unit="square metres">${int(i.area)}</LivingArea>`}
        ${so(i.quartos != null, `<Bedrooms>${i.quartos}</Bedrooms>`)}
        ${so(i.banheiros, `<Bathrooms>${i.banheiros}</Bathrooms>`)}
        ${so(i.suites, `<Suites>${i.suites}</Suites>`)}
        ${so(i.vagas, `<Garage type="Parking Space">${i.vagas}</Garage>`)}
        ${so(features.length, `<Features>\n${features.map((f) => `          <Feature>${esc(f)}</Feature>`).join("\n")}\n        </Features>`)}
      </Details>
      <Location displayAddress="All">
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="${esc(i.uf)}">${esc(ESTADOS[(i.uf ?? "").toUpperCase()] ?? i.uf)}</State>
        <City>${esc(i.cidade)}</City>
        <Neighborhood>${esc(i.bairro)}</Neighborhood>
        ${so(i.logradouro, `<Address>${esc(i.logradouro)}</Address>`)}
        ${so(i.numero, `<StreetNumber>${esc(i.numero)}</StreetNumber>`)}
        ${so(i.unidade, `<Complement>${esc(i.unidade)}</Complement>`)}
        <PostalCode>${esc((i.cep ?? "").replace(/\D/g, ""))}</PostalCode>
        ${so(i.lat != null && i.lng != null, `<Latitude>${i.lat}</Latitude>\n        <Longitude>${i.lng}</Longitude>`)}
      </Location>
      <ContactInfo>
        <Name>${esc(i.corretor.nome)}</Name>
        <Email>${esc(i.corretor.email)}</Email>
        ${so(tel, `<Telephone>${esc(tel)}</Telephone>`)}
      </ContactInfo>
    </Listing>`;
}

/** Gera o XML completo. Imóveis com pendências ficam de fora (o app mostra o que falta em cada um). */
export function gerarVRSync(d: DadosFeed, agora = new Date()): { xml: string; enviados: number; fora: number } {
  const ok = d.imoveis.filter((i) => pendenciasPortais(i).length === 0);
  const linhas = (s: string) => s.split("\n").filter((l) => l.trim()).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync http://xml.vivareal.com/vrsync.xsd">
  <Header>
    <Provider>Frankkia</Provider>
    <Email>${esc(d.imobiliaria.email || "frankkiabr@gmail.com")}</Email>
    <ContactName>${esc(d.imobiliaria.nome)}</ContactName>
    <PublishDate>${agora.toISOString().slice(0, 19)}</PublishDate>
    ${so(d.imobiliaria.telefone, `<Telephone>${esc((d.imobiliaria.telefone ?? "").replace(/\D/g, ""))}</Telephone>`)}
  </Header>
  <Listings>
${ok.map((i) => linhas(listing(i))).join("\n")}
  </Listings>
</ListingDataFeed>
`;
  return { xml: linhas(xml) + "\n", enviados: ok.length, fora: d.imoveis.length - ok.length };
}
