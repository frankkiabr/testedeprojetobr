import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bath, BadgeCheck, BedDouble, Car, ChevronRight, MapPin, Menu, Ruler, X } from "lucide-react";
import { Logo, LogoMark } from "@/components/ui";
import { EntradaPagina, Surge } from "./anim";
import type { CartaoAnuncio, CorretorResumo, Finalidade, ImobResumo } from "./api";

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const preco = (finalidade: Finalidade, valor: number) =>
  finalidade === "venda" ? brl(valor) : `${brl(valor)}/mês`;
export const area = (m2: number) =>
  `${m2.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m²`;

/** Telefone guardado só com números → número do WhatsApp com o 55 do Brasil. */
export function numeroWhats(tel?: string | null) {
  const n = (tel ?? "").replace(/\D/g, "");
  if (!n) return null;
  return n.length <= 11 ? `55${n}` : n;
}
export function telefoneBonito(tel?: string | null) {
  const n = numeroWhats(tel);
  if (!n) return "";
  const d = n.slice(2);
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}
/** Endereço da página da cidade no portal: "Belém", "PA" → "belem-pa". */
export const slugCidade = (cidade: string, uf: string) =>
  `${cidade} ${uf}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Cidades com imóveis anunciados (para os atalhos "Imóveis por cidade"), da que tem mais para a que tem menos. */
export function cidadesDe(anuncios: { cidade: string; uf: string }[]) {
  const mapa = new Map<string, { cidade: string; uf: string; slug: string; total: number }>();
  for (const a of anuncios) {
    const slug = slugCidade(a.cidade, a.uf);
    const c = mapa.get(slug) ?? { cidade: a.cidade, uf: a.uf, slug, total: 0 };
    c.total++;
    mapa.set(slug, c);
  }
  return [...mapa.values()].sort(
    (a, b) => b.total - a.total || a.cidade.localeCompare(b.cidade, "pt-BR"),
  );
}

/** Atalhos "Imóveis por cidade" (links para /imoveis/<cidade>), úteis para o cliente e para o Google. */
export function CidadesComImoveis({ anuncios }: { anuncios: { cidade: string; uf: string }[] }) {
  const cidades = cidadesDe(anuncios);
  if (!cidades.length) return null;
  return (
    <nav aria-label="Imóveis por cidade" className="mt-14 border-t border-line pt-8">
      <p className="text-sm font-semibold">Imóveis por cidade</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {cidades.map((c) => (
          <li key={c.slug}>
            <Link
              to="/imoveis/$cidade"
              params={{ cidade: c.slug }}
              preload="intent"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm transition hover:border-line-strong hover:bg-canvas"
            >
              {c.cidade} - {c.uf} <span className="text-subtle">{c.total}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const linkWhats = (tel: string, texto: string) =>
  `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;

export const creciTexto = (c: { creci: string | null; creci_uf: string | null }) =>
  c.creci ? `CRECI ${c.creci}${c.creci_uf ? `-${c.creci_uf}` : ""}` : "";

/** "30 de outubro de 2026" (sempre no horário de Brasília, para o servidor e o navegador escreverem igual). */
export const dataPorExtenso = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

export type ItemTrilha = { rotulo: string; href?: string };

/**
 * Trilha de navegação (breadcrumb): Início › Imóveis › Belém - PA › ...
 * Também vai em formato que o Google entende (BreadcrumbList), para aparecer no resultado da busca.
 */
export function Trilha({ itens, className = "" }: { itens: ItemTrilha[]; className?: string }) {
  const site = "https://frankkia.com";
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((t, k) => ({ "@type": "ListItem", position: k + 1, name: t.rotulo, ...(t.href ? { item: site + t.href } : {}) })),
  };
  return (
    <nav aria-label="Você está em" className={`mb-5 ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {itens.map((t, k) => (
          <li key={k} className="flex min-w-0 items-center gap-1.5">
            {k > 0 && <ChevronRight className="size-3.5 shrink-0 text-subtle" />}
            {t.href && k < itens.length - 1 ? (
              <a href={t.href} className="truncate font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                {t.rotulo}
              </a>
            ) : (
              <span aria-current={k === itens.length - 1 ? "page" : undefined} className="truncate text-muted">
                {t.rotulo}
              </span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </nav>
  );
}

/** Selo "CRECI verificado": a Frankkia conferiu o número no site do CRECI do estado. */
export function SeloCreci({ c }: { c: { creci_verificado?: boolean } }) {
  if (!c.creci_verificado) return null;
  return (
    <span
      title="A Frankkia conferiu este CRECI no site do conselho regional"
      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
    >
      <BadgeCheck className="size-3.5" /> CRECI verificado
    </span>
  );
}

/** Moldura das páginas do portal: topo com a imobiliária (ou a Frankkia) e rodapé simples. */
/** Menu do portal: leva de volta ao site da Frankkia. */
const MENU_PORTAL = [
  { href: "/", label: "Início" },
  { href: "/#planos", label: "Planos" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/sobre", label: "Sobre" },
];

export function PortalShell({
  imob,
  corretor,
  rotulo,
  children,
}: {
  imob?: ImobResumo | null;
  /** No plano Solo sem logo, o topo mostra a foto e o nome do corretor no lugar da inicial. */
  corretor?: Pick<CorretorResumo, "nome" | "foto" | "slug"> | null;
  /** Nome da seção ao lado da marca Frankkia (ex.: "Imóveis"). */
  rotulo?: string;
  children: ReactNode;
}) {
  // Trocou de página dentro do portal: volta ao topo e anima a entrada
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
    setMenu(false);
  }, [caminho]);
  const fotoDoCorretor = !!imob?.solo && !imob.logo && !!corretor;
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          {fotoDoCorretor && corretor ? (
            <Link
              to="/corretor/$slug"
              params={{ slug: corretor.slug ?? "" }}
              preload="intent"
              disabled={!corretor.slug}
              className="flex min-w-0 items-center gap-3"
            >
              <FotoPessoa p={corretor} className="size-9 text-sm" />
              <span className="truncate font-display text-lg font-semibold tracking-tight">{corretor.nome}</span>
            </Link>
          ) : imob ? (
            <Link
              to="/imobiliaria/$slug"
              params={{ slug: imob.slug ?? "" }}
              preload="intent"
              disabled={!imob.slug}
              className="flex min-w-0 items-center gap-3"
            >
              {imob.logo ? (
                <img
                  src={imob.logo}
                  alt={imob.nome}
                  className="h-9 w-auto max-w-[9rem] object-contain"
                />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display font-semibold text-accent">
                  {imob.nome.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="truncate font-display text-lg font-semibold tracking-tight">
                {imob.nome}
              </span>
            </Link>
          ) : (
            <a href="/" className="flex items-center gap-2">
              <LogoMark className="size-8 text-lg" />
              <Logo className="text-xl" />
              {rotulo && <span className="ml-1 text-sm font-medium text-muted">{rotulo}</span>}
            </a>
          )}
          <nav className="hidden shrink-0 items-center gap-1 sm:flex">
            {MENU_PORTAL.map((m) => (
              <a
                key={m.href}
                href={m.href}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition hover:bg-canvas ${caminho === m.href ? "text-accent" : "text-muted hover:text-ink"}`}
              >
                {m.label}
              </a>
            ))}
          </nav>
          <button
            onClick={() => setMenu((v) => !v)}
            aria-label="Menu"
            aria-expanded={menu}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong transition hover:bg-canvas sm:hidden"
          >
            {menu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menu && (
          <nav className="border-t border-line px-4 py-2 sm:hidden">
            {MENU_PORTAL.map((m) => (
              <a key={m.href} href={m.href} className="block rounded-xl px-3 py-3 font-semibold transition hover:bg-canvas">
                {m.label}
              </a>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
        <EntradaPagina key={caminho}>{children}</EntradaPagina>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <span>Anúncios publicados por imobiliárias e corretores credenciados.</span>
          <span className="flex gap-4">
            <a href="/termos" className="hover:text-ink">
              Termos de Uso
            </a>
            <a href="/privacidade" className="hover:text-ink">
              Privacidade
            </a>
          </span>
          <a href="/" className="flex items-center gap-1.5 hover:text-ink">
            Feito com <Logo className="text-base text-ink" />
          </a>
        </div>
      </footer>
    </div>
  );
}

/** Cartão de um anúncio nas listas (página do corretor e da imobiliária). */
export function CartaoImovel({
  a,
  anunciante = false,
}: {
  a: CartaoAnuncio;
  anunciante?: boolean;
}) {
  return (
    <Link
      to="/imovel/$slug"
      params={{ slug: a.slug }}
      preload="intent"
      className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-bg transition hover:border-line-strong hover:shadow-soft"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-canvas">
        {a.capa && (
          <img
            src={a.capa}
            alt={a.titulo}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-bg/95 px-2.5 py-1 text-xs font-semibold shadow-pill">
          {a.finalidade === "venda" ? "Venda" : "Aluguel"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-display text-xl font-semibold tracking-tight">
          {preco(a.finalidade, a.valor)}
        </p>
        <p className="line-clamp-2 text-sm font-medium">{a.titulo}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin className="size-3.5 shrink-0" />
          {a.bairro}, {a.cidade} - {a.uf}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Ruler className="size-3.5" />
            {area(a.area)}
          </span>
          {!!a.quartos && (
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" />
              {a.quartos} {a.quartos === 1 ? "quarto" : "quartos"}
            </span>
          )}
          {!!a.banheiros && (
            <span className="flex items-center gap-1">
              <Bath className="size-3.5" />
              {a.banheiros}
            </span>
          )}
          {!!a.vagas && (
            <span className="flex items-center gap-1">
              <Car className="size-3.5" />
              {a.vagas}
            </span>
          )}
          <span className="ml-auto font-mono text-[0.6875rem] font-semibold tracking-wide text-subtle">
            {a.codigo}
          </span>
        </div>
        {a.corretor && (
          <div className="mt-1 flex items-center gap-2.5 border-t border-line pt-3">
            <FotoPessoa p={a.corretor} className="size-8 text-xs" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-semibold">{a.corretor.nome}</p>
              <p className="truncate text-[0.6875rem] text-muted">
                {[
                  creciTexto(a.corretor),
                  anunciante && a.anunciante !== a.corretor.nome ? a.anunciante : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export function GradeImoveis({
  anuncios,
  anunciante = false,
}: {
  anuncios: CartaoAnuncio[];
  anunciante?: boolean;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {anuncios.map((a, k) => (
        <Surge key={a.slug} delay={(k % 3) * 0.08} className="grid">
          <CartaoImovel a={a} anunciante={anunciante} />
        </Surge>
      ))}
    </div>
  );
}

export function FotoPessoa({
  p,
  className = "size-14",
}: {
  p: Pick<CorretorResumo, "nome" | "foto">;
  className?: string;
}) {
  const iniciais = p.nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return p.foto ? (
    <img src={p.foto} alt={p.nome} className={`shrink-0 rounded-full object-cover ${className}`} />
  ) : (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-display font-semibold text-accent ${className}`}
    >
      {iniciais}
    </span>
  );
}

/** Página não encontrada (anúncio retirado, vendido ou endereço errado). */
/** Banner azul-escuro no topo da busca de imóveis (mesmo estilo do cartão do corretor). */
export function BannerBusca({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <Surge y={16} className="mb-6 flex items-center gap-5 overflow-hidden rounded-3xl bg-ink p-6 text-bg sm:p-8">
      <span className="hidden size-16 shrink-0 place-items-center rounded-2xl bg-white/10 sm:grid">
        <LogoMark className="size-8" />
      </span>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-4xl">{titulo}</h1>
        <p className="mt-1.5 text-sm text-bg/70">{texto}</p>
      </div>
    </Surge>
  );
}

export function NaoEncontrado({ texto, children }: { texto: string; children?: ReactNode }) {
  return (
    <PortalShell>
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="font-display text-2xl font-semibold tracking-tight">Página indisponível</p>
        <p className="mt-2 text-muted">{texto}</p>
        {children}
        <a
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-bg"
        >
          Voltar ao início
        </a>
      </div>
    </PortalShell>
  );
}
