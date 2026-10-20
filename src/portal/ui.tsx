import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bath, BedDouble, Car, MapPin, Ruler, Search } from "lucide-react";
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
export const linkWhats = (tel: string, texto: string) =>
  `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;

export const creciTexto = (c: { creci: string | null; creci_uf: string | null }) =>
  c.creci ? `CRECI ${c.creci}${c.creci_uf ? `-${c.creci_uf}` : ""}` : "";

/** Moldura das páginas do portal: topo com a imobiliária (ou a Frankkia) e rodapé simples. */
export function PortalShell({
  imob,
  rotulo,
  children,
}: {
  imob?: ImobResumo | null;
  /** Nome da seção ao lado da marca Frankkia (ex.: "Imóveis"). */
  rotulo?: string;
  children: ReactNode;
}) {
  // Trocou de página dentro do portal: volta ao topo e anima a entrada
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [caminho]);
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          {imob ? (
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
          {caminho !== "/imoveis" && (
            <Link
              to="/imoveis"
              preload="intent"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-semibold transition hover:bg-canvas"
            >
              <Search className="size-4" /> <span className="hidden sm:inline">Buscar imóveis</span>
            </Link>
          )}
        </div>
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
export function NaoEncontrado({ texto }: { texto: string }) {
  return (
    <PortalShell>
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="font-display text-2xl font-semibold tracking-tight">Página indisponível</p>
        <p className="mt-2 text-muted">{texto}</p>
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
