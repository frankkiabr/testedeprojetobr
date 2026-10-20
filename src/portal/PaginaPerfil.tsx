import { Link } from "@tanstack/react-router";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import type { CorretorPublico, ImobiliariaPublica } from "./api";
import { Surge } from "./anim";
import { BotaoCompartilhar, ImoveisComFiltro } from "./Filtros";
import { REDES } from "@/lib/redes";
import { creciTexto, FotoPessoa, linkWhats, numeroWhats, PortalShell } from "./ui";

const contagem = (n: number) => `${n} ${n === 1 ? "imóvel anunciado" : "imóveis anunciados"}`;

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

/** Página pública do corretor: quem é e os imóveis que ele anuncia. */
export function PaginaCorretor({ c }: { c: CorretorPublico }) {
  const redes = REDES.filter((r) => c.redes?.[r.chave]);
  return (
    <PortalShell imob={c.imobiliaria}>
      <Surge
        y={16}
        className="flex flex-col gap-5 rounded-3xl bg-canvas p-6 sm:flex-row sm:items-center sm:p-8"
      >
        <FotoPessoa p={c} className="size-20 text-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {c.nome}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {[
              creciTexto(c),
              c.imobiliaria.solo ? "" : c.imobiliaria.nome,
              contagem(c.anuncios.length),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {redes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {redes.map(({ chave, nome, Icone }) => (
                <a
                  key={chave}
                  href={c.redes![chave]}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={nome}
                  title={nome}
                  className="grid size-9 place-items-center rounded-full border border-line bg-bg text-ink transition hover:-translate-y-0.5 hover:border-line-strong"
                >
                  <Icone className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <BotaoWhats
            tel={c.telefone}
            texto={`Olá, ${c.nome.split(" ")[0]}! Vi seus imóveis no portal.`}
          />
          <BotaoCompartilhar titulo={c.nome} texto={`Imóveis de ${c.nome}`} />
        </div>
      </Surge>
      <Surge delay={0.1}>
        <h2 className="mb-4 mt-10 font-display text-xl font-semibold">Imóveis</h2>
      </Surge>
      <ImoveisComFiltro anuncios={c.anuncios} />
    </PortalShell>
  );
}

/** Página pública da imobiliária: imóveis anunciados e a equipe. */
export function PaginaImobiliaria({ i }: { i: ImobiliariaPublica }) {
  return (
    <PortalShell imob={i}>
      <Surge
        y={16}
        className="flex flex-col gap-5 rounded-3xl bg-canvas p-6 sm:flex-row sm:items-center sm:p-8"
      >
        {i.logo && (
          <img src={i.logo} alt={i.nome} className="h-16 w-auto max-w-[12rem] object-contain" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {i.nome}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {[i.cidade, contagem(i.anuncios.length)].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotaoWhats tel={i.telefone} texto={`Olá! Vi os imóveis da ${i.nome} no portal.`} />
          <BotaoCompartilhar titulo={i.nome} texto={`Imóveis da ${i.nome}`} />
        </div>
      </Surge>

      <Surge delay={0.1}>
        <h2 className="mb-4 mt-10 font-display text-xl font-semibold">Imóveis</h2>
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
