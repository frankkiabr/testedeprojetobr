import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, CalendarCheck, ChevronRight, House, MapPin, Users } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import type { CorretorPublico, ImobiliariaPublica } from "./api";
import { Surge } from "./anim";
import { BotaoCompartilhar, ImoveisComFiltro } from "./Filtros";
import { REDES } from "@/lib/redes";
import { creciTexto, dataPorExtenso, FotoPessoa, linkWhats, numeroWhats, PortalShell, SeloCreci, Trilha } from "./ui";

const imoveis = (n: number) => `${n} ${n === 1 ? "imóvel" : "imóveis"}`;
const COMPARTILHAR_ESCURO = "!border-ink !bg-ink !text-bg hover:!bg-ink/85";

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

/** Cartão de informação do topo (azul claro, como nos portais). */
function Info({ icone, rotulo, valor, acao }: CartaoInfo) {
  return (
    <div className="flex min-w-0 flex-col justify-center rounded-2xl bg-accent-soft px-4 py-3 text-ink">
      <p className="flex items-center gap-2 text-xs text-ink/75">
        {icone} {rotulo}
      </p>
      <p className="mt-0.5 truncate font-display text-base font-bold sm:text-lg">{valor}</p>
      {acao}
    </div>
  );
}
type CartaoInfo = { icone: ReactNode; rotulo: string; valor: string; acao?: ReactNode };

const verImoveis = (
  <a href="#imoveis" className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-accent-deep hover:underline">
    Ver imóveis <ChevronRight className="size-4" />
  </a>
);

/** Cidades onde há imóveis anunciados ("Belém - PA" ou "Belém - PA e mais 2"). */
function atuaEm(anuncios: { cidade: string; uf: string }[]) {
  const cidades = [...new Set(anuncios.map((a) => `${a.cidade} - ${a.uf}`))];
  if (!cidades.length) return "";
  return cidades.length === 1 ? cidades[0] : `${cidades[0]} e mais ${cidades.length - 1}`;
}

/**
 * Topo das páginas do corretor e da imobiliária, em fundo claro: nome e profissão; a foto (ou logo) com quatro
 * cartões azul-claros (imóveis anunciados, na Frankkia desde, CRECI e onde atua); à direita, WhatsApp, compartilhar
 * e as redes sociais.
 */
function Topo({ titulo, linha, foto, cartoes, acoes, redes }: {
  titulo: string;
  linha: string;
  foto: ReactNode;
  cartoes: CartaoInfo[];
  acoes: ReactNode;
  redes?: ReactNode[];
}) {
  return (
    <Surge y={16}>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{titulo}</h1>
      <p className="mt-1 text-sm text-muted">{linha}</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
          <div className="h-full min-h-[6.5rem] overflow-hidden rounded-2xl bg-accent-soft sm:aspect-[4/5] sm:h-auto">{foto}</div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {cartoes.map((c) => (
              <Info key={c.rotulo} {...c} />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 lg:px-4">
          <div className="flex w-full flex-wrap justify-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{acoes}</div>
          {!!redes?.length && <div className="flex flex-wrap justify-center gap-2">{redes}</div>}
        </div>
      </div>
    </Surge>
  );
}

/** Foto grande (ou iniciais) para o topo. */
function FotoGrande({ nome, foto }: { nome: string; foto: string | null }) {
  if (foto) return <img src={foto} alt={nome} className="size-full object-cover" />;
  return (
    <div className="grid size-full place-items-center">
      <FotoPessoa p={{ nome, foto: null }} className="size-20 text-2xl" />
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
        linha={c.imobiliaria.solo ? "Corretor de imóveis" : `Corretor de imóveis · ${c.imobiliaria.nome}`}
        foto={<FotoGrande nome={c.nome} foto={c.foto} />}
        cartoes={[
          { icone: <House className="size-4 text-accent" />, rotulo: "Imóveis anunciados", valor: imoveis(c.anuncios.length), acao: verImoveis },
          ...(c.creci
            ? [{ icone: <BadgeCheck className="size-4 text-accent" />, rotulo: "CRECI", valor: creciTexto(c).replace("CRECI ", ""), acao: c.creci_verificado ? <div className="mt-1"><SeloCreci c={c} /></div> : undefined }]
            : []),
          ...(c.desde ? [{ icone: <CalendarCheck className="size-4 text-accent" />, rotulo: "Na Frankkia desde", valor: dataPorExtenso(c.desde) }] : []),
          ...(atuaEm(c.anuncios) ? [{ icone: <MapPin className="size-4 text-accent" />, rotulo: "Atua em", valor: atuaEm(c.anuncios) }] : []),
        ]}
        acoes={
          <>
            <BotaoWhats tel={c.telefone} texto={`Olá, ${c.nome.split(" ")[0]}! Vi seus imóveis no portal.`} />
            <BotaoCompartilhar titulo={c.nome} texto={`Imóveis de ${c.nome}`} className={COMPARTILHAR_ESCURO} />
          </>
        }
        redes={redes.map(({ chave, nome, Icone }) => (
          <a
            key={chave}
            href={c.redes![chave]}
            target="_blank"
            rel="noreferrer"
            aria-label={nome}
            title={nome}
            className="grid size-10 place-items-center rounded-full bg-ink text-bg transition hover:-translate-y-0.5 hover:bg-ink/85"
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
    <div className="grid size-full place-items-center border border-line bg-white p-3">
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
        linha={i.solo ? "Corretor de imóveis" : "Imobiliária"}
        foto={foto}
        cartoes={[
          { icone: <House className="size-4 text-accent" />, rotulo: "Imóveis anunciados", valor: imoveis(i.anuncios.length), acao: verImoveis },
          i.creci_j
            ? { icone: <BadgeCheck className="size-4 text-accent" />, rotulo: "CRECI-J", valor: i.creci_j }
            : { icone: <Users className="size-4 text-accent" />, rotulo: "Corretores", valor: String(Math.max(i.corretores.length, 1)) },
          ...(i.desde ? [{ icone: <CalendarCheck className="size-4 text-accent" />, rotulo: "Na Frankkia desde", valor: dataPorExtenso(i.desde) }] : []),
          ...(atuaEm(i.anuncios) ? [{ icone: <MapPin className="size-4 text-accent" />, rotulo: "Atua em", valor: atuaEm(i.anuncios) }] : []),
        ]}
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
