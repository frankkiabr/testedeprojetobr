import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, ChevronRight, House } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import type { CorretorPublico, ImobiliariaPublica } from "./api";
import { Surge } from "./anim";
import { BotaoCompartilhar, ImoveisComFiltro } from "./Filtros";
import { REDES } from "@/lib/redes";
import { creciTexto, dataPorExtenso, FotoPessoa, linkWhats, numeroWhats, PortalShell, SeloCreci, Trilha } from "./ui";

const imoveis = (n: number) => `${n} ${n === 1 ? "imóvel" : "imóveis"}`;
const COMPARTILHAR_ESCURO = "!border-white/25 !bg-transparent !text-bg hover:!bg-white/10";

function BotaoWhats({ tel, texto }: { tel: string | null; texto: string }) {
  const n = numeroWhats(tel);
  if (!n) return null;
  return (
    <a
      href={linkWhats(n, texto)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25d366] px-5 text-sm font-semibold text-white transition hover:brightness-95"
    >
      <WhatsAppIcon className="size-4" /> WhatsApp
    </a>
  );
}

/** Ilustração padrão do lado direito do topo (prédios e árvores, nas cores da Frankkia). */
function Ilustracao() {
  return (
    <svg viewBox="0 0 420 300" className="h-full w-full" aria-hidden>
      <g fill="#ffffff" opacity="0.07">
        <rect x="40" y="70" width="90" height="230" rx="4" />
        <rect x="150" y="20" width="110" height="280" rx="4" />
        <rect x="280" y="95" width="100" height="205" rx="4" />
      </g>
      <g fill="#ffffff" opacity="0.16">
        {[0, 1, 2, 3, 4, 5, 6].map((l) =>
          [0, 1, 2].map((c) => <rect key={`a${l}${c}`} x={168 + c * 30} y={45 + l * 34} width="16" height="14" rx="2" />),
        )}
        {[0, 1, 2, 3, 4, 5].map((l) => [0, 1].map((c) => <rect key={`b${l}${c}`} x={58 + c * 32} y={92 + l * 34} width="16" height="14" rx="2" />))}
        {[0, 1, 2, 3, 4].map((l) => [0, 1].map((c) => <rect key={`c${l}${c}`} x={300 + c * 36} y={118 + l * 34} width="18" height="14" rx="2" />))}
      </g>
      {/* árvores */}
      <g>
        <rect x="27" y="232" width="6" height="68" fill="#ffffff" opacity="0.25" />
        <ellipse cx="30" cy="215" rx="28" ry="40" fill="#2f5bea" opacity="0.9" />
        <ellipse cx="30" cy="190" rx="20" ry="28" fill="#4f7bff" />
        <rect x="389" y="226" width="6" height="74" fill="#ffffff" opacity="0.25" />
        <ellipse cx="392" cy="208" rx="26" ry="42" fill="#2f5bea" opacity="0.9" />
        <ellipse cx="392" cy="182" rx="18" ry="28" fill="#4f7bff" />
      </g>
      {/* casinha */}
      <g transform="translate(205 222)">
        <path d="M0 30 L32 4 L64 30 V78 H0 Z" fill="#e8eeff" />
        <path d="M-6 32 L32 0 L70 32" fill="none" stroke="#2f5bea" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="24" y="48" width="16" height="30" rx="2" fill="#2f5bea" />
      </g>
      <rect x="0" y="296" width="420" height="4" rx="2" fill="#ffffff" opacity="0.2" />
    </svg>
  );
}

/** Cartão de informação do topo (azul claro, como nos portais). */
function Info({ icone, rotulo, valor, acao }: { icone: ReactNode; rotulo: string; valor: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col justify-center rounded-2xl bg-accent-soft p-5 text-ink">
      <p className="flex items-center gap-2 text-sm text-ink/75">
        {icone} {rotulo}
      </p>
      <p className="mt-1 font-display text-xl font-bold">{valor}</p>
      {acao}
    </div>
  );
}

const verImoveis = (
  <a href="#imoveis" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent-deep hover:underline">
    Ver imóveis <ChevronRight className="size-4" />
  </a>
);

/**
 * Topo das páginas do corretor e da imobiliária: azul-escuro, nome em destaque, a foto (ou logo) grande à esquerda,
 * dois cartões (imóveis anunciados e desde quando está na Frankkia) e uma ilustração à direita.
 */
function Topo({ titulo, linha, selo, foto, total, desde, extra, acoes }: {
  titulo: string;
  linha: string;
  selo?: ReactNode;
  foto: ReactNode;
  total: number;
  desde?: string;
  extra?: ReactNode;
  acoes: ReactNode;
}) {
  return (
    <Surge y={16} className="overflow-hidden rounded-3xl bg-ink p-6 text-bg sm:p-8">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{titulo}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-bg/70">
        {linha}
        {selo}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[15rem_15rem_minmax(0,1fr)]">
        <div className="aspect-[335/375] overflow-hidden rounded-2xl bg-white/10">{foto}</div>
        <div className="flex flex-col gap-4">
          <Info icone={<House className="size-4 text-accent" />} rotulo="Imóveis anunciados" valor={imoveis(total)} acao={verImoveis} />
          {desde && <Info icone={<CalendarCheck className="size-4 text-accent" />} rotulo="Na Frankkia desde" valor={dataPorExtenso(desde)} />}
        </div>
        <div className="hidden items-end lg:flex">
          <Ilustracao />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {acoes}
        {extra}
      </div>
    </Surge>
  );
}

/** Foto grande (ou iniciais) para o topo. */
function FotoGrande({ nome, foto }: { nome: string; foto: string | null }) {
  if (foto) return <img src={foto} alt={nome} className="size-full object-cover" />;
  return (
    <div className="grid size-full place-items-center">
      <FotoPessoa p={{ nome, foto: null }} className="size-28 text-4xl" />
    </div>
  );
}

/** Página pública do corretor: quem é e os imóveis que ele anuncia. */
export function PaginaCorretor({ c }: { c: CorretorPublico }) {
  const redes = REDES.filter((r) => c.redes?.[r.chave]);
  return (
    <PortalShell imob={c.imobiliaria} corretor={c}>
      <Trilha
        itens={[
          { rotulo: "Início", href: "/" },
          { rotulo: "Imóveis", href: "/imoveis" },
          ...(!c.imobiliaria.solo && c.imobiliaria.slug ? [{ rotulo: c.imobiliaria.nome, href: `/imobiliaria/${c.imobiliaria.slug}` }] : []),
          { rotulo: c.nome },
        ]}
      />
      <Topo
        titulo={c.nome}
        linha={[creciTexto(c), c.imobiliaria.solo ? "Corretor de imóveis" : c.imobiliaria.nome].filter(Boolean).join(" · ")}
        selo={c.creci_verificado ? <SeloCreci c={c} /> : null}
        foto={<FotoGrande nome={c.nome} foto={c.foto} />}
        total={c.anuncios.length}
        desde={c.desde}
        acoes={
          <>
            <BotaoWhats tel={c.telefone} texto={`Olá, ${c.nome.split(" ")[0]}! Vi seus imóveis no portal.`} />
            <BotaoCompartilhar titulo={c.nome} texto={`Imóveis de ${c.nome}`} className={COMPARTILHAR_ESCURO} />
          </>
        }
        extra={redes.map(({ chave, nome, Icone }) => (
          <a
            key={chave}
            href={c.redes![chave]}
            target="_blank"
            rel="noreferrer"
            aria-label={nome}
            title={nome}
            className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-bg transition hover:-translate-y-0.5 hover:bg-white/20"
          >
            <Icone className="size-4" />
          </a>
        ))}
      />
      <Surge delay={0.1}>
        <h2 id="imoveis" className="mb-4 mt-10 scroll-mt-24 font-display text-xl font-semibold">
          Imóveis
        </h2>
      </Surge>
      <ImoveisComFiltro anuncios={c.anuncios} />
    </PortalShell>
  );
}

/** Página pública da imobiliária: imóveis anunciados e a equipe. */
export function PaginaImobiliaria({ i }: { i: ImobiliariaPublica }) {
  // Solo: a "imobiliária" é o próprio corretor, então aparece a foto dele (ou as iniciais)
  const foto = i.solo ? (
    <FotoGrande nome={i.corretores[0]?.nome ?? i.nome} foto={i.corretores[0]?.foto ?? null} />
  ) : i.logo ? (
    <div className="grid size-full place-items-center bg-white p-6">
      <img src={i.logo} alt={i.nome} className="max-h-full max-w-full object-contain" />
    </div>
  ) : (
    <FotoGrande nome={i.nome} foto={null} />
  );
  return (
    <PortalShell imob={i}>
      <Trilha itens={[{ rotulo: "Início", href: "/" }, { rotulo: "Imóveis", href: "/imoveis" }, { rotulo: i.nome }]} />
      <Topo
        titulo={i.nome}
        linha={[i.creci_j ? `CRECI-J ${i.creci_j}` : "", i.cidade, !i.solo && i.corretores.length ? `${i.corretores.length} ${i.corretores.length === 1 ? "corretor" : "corretores"}` : ""]
          .filter(Boolean)
          .join(" · ")}
        foto={foto}
        total={i.anuncios.length}
        desde={i.desde}
        acoes={
          <>
            <BotaoWhats tel={i.telefone} texto={`Olá! Vi os imóveis da ${i.nome} no portal.`} />
            <BotaoCompartilhar titulo={i.nome} texto={`Imóveis da ${i.nome}`} className={COMPARTILHAR_ESCURO} />
          </>
        }
      />

      <Surge delay={0.1}>
        <h2 id="imoveis" className="mb-4 mt-10 scroll-mt-24 font-display text-xl font-semibold">
          Imóveis
        </h2>
      </Surge>
      <ImoveisComFiltro anuncios={i.anuncios} />

      {!i.solo && i.corretores.length > 0 && (
        <>
          <Surge>
            <h2 className="mb-4 mt-12 font-display text-xl font-semibold">Corretores</h2>
          </Surge>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {i.corretores.map((p, k) => (
              <Surge key={p.slug} delay={(k % 3) * 0.08}>
                <Link
                  to="/corretor/$slug"
                  params={{ slug: p.slug ?? "" }}
                  preload="intent"
                  className="flex items-center gap-3 rounded-2xl border border-line p-4 transition hover:border-line-strong hover:bg-canvas"
                >
                  <FotoPessoa p={p} className="size-12" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.nome}</p>
                    <p className="text-xs text-muted">{creciTexto(p)}</p>
                    {p.creci_verificado && <div className="mt-1"><SeloCreci c={p} /></div>}
                  </div>
                </Link>
              </Surge>
            ))}
          </div>
        </>
      )}
    </PortalShell>
  );
}
