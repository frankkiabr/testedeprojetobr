import { useState } from "react";
import { Bath, BedDouble, Building2, Car, Check, MapPin, Ruler, Sparkles } from "lucide-react";
import { Carrossel } from "@/components/Carrossel";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { enviarContato, type AnuncioPublico } from "./api";
import { area, brl, creciTexto, FotoPessoa, linkWhats, numeroWhats, PortalShell, preco, telefoneBonito } from "./ui";

const rotuloUnidade = (categoria: string) => (categoria === "Sala comercial" ? "Sala" : "Apto");

export function enderecoAnuncio(a: AnuncioPublico) {
  const unidade = a.unidade ? ` · ${rotuloUnidade(a.categoria)} ${a.unidade}` : "";
  return `${a.logradouro}, ${a.numero}${unidade} - ${a.bairro}, ${a.cidade} - ${a.uf}`;
}

export default function PaginaAnuncio({ a, url }: { a: AnuncioPublico; url: string }) {
  const whats = numeroWhats(a.corretor.telefone);
  const msg = `Olá! Tenho interesse no imóvel ${a.codigo} (${a.titulo}). ${url}`;
  const itens = [
    { icon: Ruler, texto: area(a.area) },
    a.quartos ? { icon: BedDouble, texto: `${a.quartos} ${a.quartos === 1 ? "quarto" : "quartos"}${a.suites ? ` (${a.suites} ${a.suites === 1 ? "suíte" : "suítes"})` : ""}` } : null,
    a.banheiros ? { icon: Bath, texto: `${a.banheiros} ${a.banheiros === 1 ? "banheiro" : "banheiros"}` } : null,
    a.vagas ? { icon: Car, texto: `${a.vagas} ${a.vagas === 1 ? "vaga" : "vagas"}` } : null,
  ].filter(Boolean) as { icon: typeof Ruler; texto: string }[];

  return (
    <PortalShell imob={a.imobiliaria}>
      <div className="overflow-hidden rounded-3xl">
        <Carrossel fotos={a.fotos.map((f) => f.url)} className="aspect-[4/3] sm:aspect-[16/9]" />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent">
                {a.finalidade === "venda" ? "Venda" : "Aluguel"}
              </span>
              <span className="rounded-full bg-canvas px-2.5 py-1 font-medium text-muted">{a.categoria}</span>
              <span className="font-mono font-semibold tracking-wide text-subtle">Cód. {a.codigo}</span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{a.titulo}</h1>
            <p className="mt-2 flex items-start gap-2 text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>
                {a.edificio && <span className="font-semibold text-ink">{a.edificio} · </span>}
                {enderecoAnuncio(a)}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {itens.map(({ icon: Icon, texto }) => (
              <span key={texto} className="flex items-center gap-2 rounded-2xl border border-line px-4 py-3 text-sm font-medium">
                <Icon className="size-4 text-accent" />
                {texto}
              </span>
            ))}
          </div>

          {a.descricao && (
            <section>
              <h2 className="font-display text-lg font-semibold">Sobre o imóvel</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{a.descricao}</p>
            </section>
          )}

          {a.caracteristicas.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Sparkles className="size-4 text-accent" /> Características
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {a.caracteristicas.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-verified" />
                    {c}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Building2 className="size-4 text-accent" /> Localização
            </h2>
            {a.lat != null && a.lng != null ? (
              <iframe
                title="Mapa do imóvel"
                loading="lazy"
                className="mt-3 h-72 w-full rounded-3xl border border-line"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${a.lng - 0.006},${a.lat - 0.004},${a.lng + 0.006},${a.lat + 0.004}&layer=mapnik&marker=${a.lat},${a.lng}`}
              />
            ) : null}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoAnuncio(a))}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-accent"
            >
              Abrir no Google Maps
            </a>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-3xl border border-line p-5 shadow-soft">
            <div>
              <p className="text-sm text-muted">{a.finalidade === "venda" ? "Valor de venda" : "Aluguel"}</p>
              <p className="font-display text-3xl font-semibold tracking-tight">{preco(a.finalidade, a.valor)}</p>
              {(a.condominio || a.iptu) && (
                <div className="mt-2 space-y-0.5 text-sm text-muted">
                  {!!a.condominio && <p>Condomínio {brl(a.condominio)}/mês</p>}
                  {!!a.iptu && <p>IPTU {brl(a.iptu)}/ano</p>}
                </div>
              )}
            </div>

            <a href={a.corretor.slug ? `/corretor/${a.corretor.slug}` : undefined} className="flex items-center gap-3">
              <FotoPessoa p={a.corretor} className="size-12" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{a.corretor.nome}</p>
                <p className="text-xs text-muted">{creciTexto(a.corretor)}</p>
              </div>
            </a>

            {whats && (
              <a
                href={linkWhats(whats, msg)}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25d366] font-semibold text-white transition hover:brightness-95"
              >
                <WhatsAppIcon className="size-5" /> Conversar no WhatsApp
              </a>
            )}
            {whats && <p className="-mt-3 text-center text-xs text-muted">{telefoneBonito(a.corretor.telefone)}</p>}

            <FormContato slug={a.slug} codigo={a.codigo} />
          </div>
        </aside>
      </div>
    </PortalShell>
  );
}

function FormContato({ slug, codigo }: { slug: string; codigo: string }) {
  const [f, setF] = useState({ nome: "", telefone: "", email: "", mensagem: `Olá! Gostaria de mais informações sobre o imóvel ${codigo}.`, site: "" });
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  const campo = "h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-sm outline-none transition focus:border-accent";
  const telOk = f.telefone.replace(/\D/g, "").length >= 10;

  if (estado === "ok")
    return (
      <div className="rounded-2xl bg-verified-soft p-4 text-sm">
        <p className="font-semibold text-verified">Mensagem enviada!</p>
        <p className="mt-1 text-muted">O corretor vai falar com você em breve.</p>
      </div>
    );

  return (
    <form
      className="space-y-2.5 border-t border-line pt-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (f.site) return setEstado("ok"); // campo invisível: preenchido só por robôs
        setEstado("enviando");
        setErro("");
        const r = await enviarContato(slug, f);
        if (r) {
          setErro(r);
          setEstado("");
        } else setEstado("ok");
      }}
    >
      <p className="text-sm font-semibold">Ou deixe seu contato</p>
      <input className={campo} placeholder="Seu nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required minLength={2} maxLength={120} />
      <input
        className={campo}
        placeholder="WhatsApp com DDD"
        inputMode="tel"
        value={f.telefone}
        onChange={(e) => setF({ ...f, telefone: e.target.value.replace(/[^\d()\s-]/g, "").slice(0, 16) })}
        required
      />
      <input className={campo} placeholder="E-mail (opcional)" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={160} />
      <textarea
        className={`${campo} h-24 resize-none py-2.5`}
        value={f.mensagem}
        onChange={(e) => setF({ ...f, mensagem: e.target.value })}
        maxLength={1000}
      />
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        value={f.site}
        onChange={(e) => setF({ ...f, site: e.target.value })}
      />
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button
        type="submit"
        disabled={estado === "enviando" || f.nome.trim().length < 2 || !telOk}
        className="h-11 w-full rounded-full bg-ink text-sm font-semibold text-bg transition hover:bg-ink/85 disabled:opacity-40"
      >
        {estado === "enviando" ? "Enviando..." : "Quero mais informações"}
      </button>
      <p className="text-center text-[0.6875rem] text-subtle">Seus dados vão só para o corretor deste imóvel.</p>
    </form>
  );
}
