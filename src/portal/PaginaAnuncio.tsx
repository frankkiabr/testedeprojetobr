import { ehDoCondominio, LANCAMENTOS, pluralTipo, rotuloTipo } from "@/lib/imovel";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Bath, BedDouble, CalendarCheck, Car, Check, ChevronDown, ExternalLink, House, MapPin, Ruler } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { Simulador } from "@/components/Simulador";
import { enviarContato, type AnuncioPublico } from "./api";
import { Galeria } from "./Galeria";
import { BotaoCompartilhar } from "./Filtros";
import { Surge } from "./anim";
import {
  area,
  brl,
  creciTexto,
  dataPorExtenso,
  slugCidade,
  Trilha,
  FotoPessoa,
  GradeImoveis,
  linkWhats,
  numeroWhats,
  PortalShell,
  preco,
  telefoneBonito,
} from "./ui";

const rotuloUnidade = (categoria: string) => (categoria === "Sala comercial" || categoria === "Consultório" ? "Sala" : "Apto");

export function enderecoAnuncio(a: AnuncioPublico) {
  const unidade = a.unidade ? ` · ${rotuloUnidade(a.categoria)} ${a.unidade}` : "";
  return `${a.logradouro}, ${a.numero}${unidade} - ${a.bairro}, ${a.cidade} - ${a.uf}`;
}

function trilhaDoAnuncio(a: AnuncioPublico) {
  const venda = a.finalidade === "venda";
  const negocio = `negocio=${venda ? "comprar" : "alugar"}`;
  const cidade = `/imoveis/${slugCidade(a.cidade, a.uf)}`;
  const tipo = `${negocio}&tipo=${encodeURIComponent(a.categoria)}`;
  return [
    { rotulo: "Início", href: "/" },
    { rotulo: "Imóveis", href: "/imoveis" },
    { rotulo: venda ? "Venda" : "Aluguel", href: `/imoveis?${negocio}` },
    { rotulo: a.uf, href: `/imoveis?${negocio}&uf=${a.uf}` },
    { rotulo: `${pluralTipo(a.categoria)} ${venda ? "à venda" : "para alugar"} em ${a.cidade}`, href: `${cidade}?${tipo}` },
    { rotulo: a.bairro, href: `${cidade}?${tipo}&bairro=${encodeURIComponent(a.bairro)}` },
  ];
}

/** Características em duas abas, como nos portais: do imóvel e do condomínio. */
function Caracteristicas({ a }: { a: AnuncioPublico }) {
  const doImovel = [
    area(a.area),
    a.quartos != null && `${a.quartos} ${a.quartos === 1 ? "quarto" : "quartos"}`,
    a.suites ? `${a.suites} ${a.suites === 1 ? "suíte" : "suítes"}` : "",
    a.banheiros != null && `${a.banheiros} ${a.banheiros === 1 ? "banheiro" : "banheiros"}`,
    a.vagas != null && `${a.vagas} ${a.vagas === 1 ? "vaga" : "vagas"}`,
    a.lancamento && `Imóvel novo · ${LANCAMENTOS.find((l) => l.valor === a.lancamento)?.rotulo ?? ""}`,
    ...a.caracteristicas.filter((c) => !ehDoCondominio(c)),
  ].filter(Boolean) as string[];
  const doCondominio = [
    a.condominio ? `Condomínio ${brl(a.condominio)}/mês` : "",
    ...a.caracteristicas.filter(ehDoCondominio),
  ].filter(Boolean);
  const abas = [
    { id: "imovel", rotulo: "Imóvel", itens: doImovel },
    { id: "condominio", rotulo: "Condomínio", itens: doCondominio },
  ].filter((x) => x.itens.length);
  const [aba, setAba] = useState(abas[0]?.id ?? "imovel");
  const [tudo, setTudo] = useState(false);
  const atual = abas.find((x) => x.id === aba) ?? abas[0];
  if (!atual) return null;
  const LIMITE = 8;
  const itens = tudo ? atual.itens : atual.itens.slice(0, LIMITE);
  return (
    <Surge className="rounded-3xl border border-line p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold">Características</h2>
      <div className="mt-3 flex border-b border-line">
        {abas.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => {
              setAba(x.id);
              setTudo(false);
            }}
            className={`flex-1 border-b-2 pb-3 text-sm font-semibold transition ${atual.id === x.id ? "border-accent text-accent" : "border-transparent text-ink hover:text-accent"}`}
          >
            {x.rotulo}
          </button>
        ))}
      </div>
      <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {itens.map((c) => (
          <li key={c} className="flex items-center gap-2 text-sm">
            <Check className="size-4 shrink-0 text-verified" />
            {c}
          </li>
        ))}
      </ul>
      {atual.itens.length > LIMITE && (
        <button type="button" onClick={() => setTudo((x) => !x)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
          {tudo ? "Mostrar menos" : `Mostrar mais (${atual.itens.length - LIMITE})`}
          <ChevronDown className={`size-4 transition ${tudo ? "rotate-180" : ""}`} />
        </button>
      )}
    </Surge>
  );
}

/** Selo do anunciante: quantos imóveis anuncia e desde quando está na Frankkia. */
function Fichas({ imoveis, desde }: { imoveis?: number; desde?: string }) {
  if (imoveis == null && !desde) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {imoveis != null && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold">
          <House className="size-3.5 text-accent" /> {imoveis} {imoveis === 1 ? "imóvel" : "imóveis"}
        </span>
      )}
      {desde && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold">
          <CalendarCheck className="size-3.5 text-accent" /> Anunciando desde {dataPorExtenso(desde)}
        </span>
      )}
    </div>
  );
}

export default function PaginaAnuncio({ a, url }: { a: AnuncioPublico; url: string }) {
  const whats = numeroWhats(a.corretor.telefone);
  const msg = `Olá! Tenho interesse no imóvel ${a.codigo} (${a.titulo}). ${url}`;
  const itens = [
    { icon: Ruler, texto: area(a.area) },
    a.quartos
      ? {
          icon: BedDouble,
          texto: `${a.quartos} ${a.quartos === 1 ? "quarto" : "quartos"}${a.suites ? ` (${a.suites} ${a.suites === 1 ? "suíte" : "suítes"})` : ""}`,
        }
      : null,
    a.banheiros
      ? { icon: Bath, texto: `${a.banheiros} ${a.banheiros === 1 ? "banheiro" : "banheiros"}` }
      : null,
    a.vagas ? { icon: Car, texto: `${a.vagas} ${a.vagas === 1 ? "vaga" : "vagas"}` } : null,
  ].filter(Boolean) as { icon: typeof Ruler; texto: string }[];

  return (
    <PortalShell imob={a.imobiliaria} corretor={a.corretor}>
      <Trilha itens={trilhaDoAnuncio(a)} />
      <Surge y={16}>
        <Galeria fotos={a.fotos.map((f) => f.url)} titulo={a.titulo} />
      </Surge>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-8">
          <Surge delay={0.1}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent">
                {a.finalidade === "venda" ? "Venda" : "Aluguel"}
              </span>
              <span className="rounded-full bg-canvas px-2.5 py-1 font-medium text-muted">
                {rotuloTipo(a.categoria)}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-muted">
                Cód.{" "}
                <span className="font-mono font-semibold tracking-wide text-ink">{a.codigo}</span>
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {a.titulo}
            </h1>
            <p className="mt-2 flex items-start gap-2 text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>
                {a.edificio && <span className="font-semibold text-ink">{a.edificio} · </span>}
                {enderecoAnuncio(a)}
              </span>
            </p>
          </Surge>

          <div className="flex flex-wrap gap-3">
            {itens.map(({ icon: Icon, texto }, k) => (
              <Surge key={texto} delay={0.15 + k * 0.06} y={16}>
                <span className="flex items-center gap-2 rounded-2xl border border-line px-4 py-3 text-sm font-medium">
                  <Icon className="size-4 text-accent" />
                  {texto}
                </span>
              </Surge>
            ))}
          </div>

          {a.descricao && (
            <Surge>
              <h2 className="font-display text-lg font-semibold">Sobre o imóvel</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{a.descricao}</p>
            </Surge>
          )}

          <Caracteristicas a={a} />

          <Surge>
            <h2 className="font-display text-lg font-semibold">Localização</h2>
            {/* Google Maps: pelo ponto marcado no cadastro ou, sem ele, pelo endereço */}
            <iframe
              title="Mapa do imóvel"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="mt-3 h-72 w-full rounded-3xl border border-line"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(a.lat != null && a.lng != null ? `${a.lat},${a.lng}` : [`${a.logradouro}, ${a.numero}`, a.bairro, `${a.cidade} - ${a.uf}`, a.cep].filter(Boolean).join(", "))}&z=16&hl=pt-BR&output=embed`}
            />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoAnuncio(a))}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent"
            >
              <ExternalLink className="size-4" /> Abrir no Google Maps
            </a>
          </Surge>

          {a.finalidade === "venda" && (
            <Surge>
              <h2 className="font-display text-lg font-semibold">Simule o financiamento</h2>
              <p className="mt-1 text-sm text-muted">Parcelas estimadas nos sistemas SAC e Price para este imóvel.</p>
              <div className="mt-4 rounded-3xl border border-line p-5">
                <Simulador
                  valorInicial={a.valor}
                  fixo
                  acao={(resumo) => {
                    const tel = numeroWhats(a.corretor.telefone);
                    return tel ? (
                      <a
                        href={linkWhats(tel, `Olá, ${a.corretor.nome.split(" ")[0]}! Vi o imóvel ${a.titulo} (Cód. ${a.codigo}) e fiz esta simulação:

${resumo}

Pode me ajudar com o financiamento?`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25d366] px-5 text-sm font-semibold text-white transition hover:brightness-95"
                      >
                        <WhatsAppIcon className="size-4" /> Falar com o corretor sobre o financiamento
                      </a>
                    ) : null;
                  }}
                />
              </div>
            </Surge>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Surge delay={0.2} className="space-y-5 rounded-3xl border border-line p-5 shadow-soft">
            <div>
              <p className="text-sm text-muted">
                {a.finalidade === "venda" ? "Valor de venda" : "Aluguel"}
              </p>
              <p className="font-display text-3xl font-semibold tracking-tight">
                {preco(a.finalidade, a.valor)}
              </p>
              {(a.condominio || a.iptu) && (
                <div className="mt-2 space-y-0.5 text-sm text-muted">
                  {!!a.condominio && <p>Condomínio {brl(a.condominio)}/mês</p>}
                  {!!a.iptu && <p>IPTU {brl(a.iptu)}/ano</p>}
                </div>
              )}
            </div>

            <Link
              to="/corretor/$slug"
              params={{ slug: a.corretor.slug ?? "" }}
              preload="intent"
              disabled={!a.corretor.slug}
              className="group block rounded-2xl border border-line p-3.5 transition hover:border-line-strong"
            >
              <div className="flex items-center gap-3">
                <FotoPessoa p={a.corretor} className="size-14" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <span className="truncate underline-offset-4 group-hover:underline">{a.corretor.nome}</span>
                    {a.corretor.creci_verificado && <BadgeCheck className="size-4 shrink-0 text-accent" aria-label="CRECI verificado"><title>CRECI verificado pela Frankkia</title></BadgeCheck>}
                  </p>
                  <p className="text-xs text-muted">{creciTexto(a.corretor)}</p>
                </div>
              </div>
              <Fichas imoveis={a.corretor.imoveis} desde={a.corretor.desde} />
            </Link>

            {/* Corretor de imobiliária: mostra a imobiliária e leva aos outros imóveis dela */}
            {!a.imobiliaria.solo && a.imobiliaria.slug && (
              <Link
                to="/imobiliaria/$slug"
                params={{ slug: a.imobiliaria.slug }}
                preload="intent"
                className="group flex items-center gap-3 rounded-2xl bg-canvas p-3 transition hover:bg-canvas-deep"
              >
                {a.imobiliaria.logo ? (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-bg p-1.5">
                    <img
                      src={a.imobiliaria.logo}
                      alt={a.imobiliaria.nome}
                      className="max-h-full max-w-full object-contain"
                    />
                  </span>
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft font-display font-semibold text-accent">
                    {a.imobiliaria.nome.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.imobiliaria.nome}</p>
                  <p className="text-xs text-muted">
                    {a.imobiliaria.creci_j ? `CRECI-J ${a.imobiliaria.creci_j} · ` : ""}
                    {a.imobiliaria.imoveis != null ? `Ver os ${a.imobiliaria.imoveis} imóveis` : "Ver todos os imóveis"}
                  </p>
                  {a.imobiliaria.desde && <p className="text-xs text-muted">Na Frankkia desde {dataPorExtenso(a.imobiliaria.desde)}</p>}
                </div>
                <ArrowRight className="size-4 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            )}

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
            {whats && (
              <p className="-mt-3 text-center text-xs text-muted">
                {telefoneBonito(a.corretor.telefone)}
              </p>
            )}

            <BotaoCompartilhar
              titulo={a.titulo}
              texto={`${a.titulo} · ${preco(a.finalidade, a.valor)} (Cód. ${a.codigo})`}
              className="w-full"
            />

            <FormContato slug={a.slug} codigo={a.codigo} />
          </Surge>
        </aside>
      </div>

      {!!a.relacionados?.length && (
        <section className="mt-16">
          <Surge className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">
              {a.imobiliaria.solo
                ? `Outros imóveis de ${a.corretor.nome.split(" ")[0]}`
                : `Outros imóveis da ${a.imobiliaria.nome}`}
            </h2>
            {a.imobiliaria.solo
              ? a.corretor.slug && (
                  <Link
                    to="/corretor/$slug"
                    params={{ slug: a.corretor.slug }}
                    preload="intent"
                    className="text-sm font-semibold text-accent"
                  >
                    Ver todos
                  </Link>
                )
              : a.imobiliaria.slug && (
                  <Link
                    to="/imobiliaria/$slug"
                    params={{ slug: a.imobiliaria.slug }}
                    preload="intent"
                    className="text-sm font-semibold text-accent"
                  >
                    Ver todos
                  </Link>
                )}
          </Surge>
          <GradeImoveis anuncios={a.relacionados} />
        </section>
      )}
    </PortalShell>
  );
}

function FormContato({ slug, codigo }: { slug: string; codigo: string }) {
  const [f, setF] = useState({
    nome: "",
    telefone: "",
    email: "",
    mensagem: `Olá! Gostaria de mais informações sobre o imóvel ${codigo}.`,
    site: "",
  });
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  const campo =
    "h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-sm outline-none transition focus:border-accent";
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
      <input
        className={campo}
        placeholder="Seu nome"
        value={f.nome}
        onChange={(e) => setF({ ...f, nome: e.target.value })}
        required
        minLength={2}
        maxLength={120}
      />
      <input
        className={campo}
        placeholder="WhatsApp com DDD"
        inputMode="tel"
        value={f.telefone}
        onChange={(e) =>
          setF({ ...f, telefone: e.target.value.replace(/[^\d()\s-]/g, "").slice(0, 16) })
        }
        required
      />
      <input
        className={campo}
        placeholder="E-mail (opcional)"
        type="email"
        value={f.email}
        onChange={(e) => setF({ ...f, email: e.target.value })}
        maxLength={160}
      />
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
      <p className="text-center text-[0.6875rem] text-subtle">
        Seus dados vão só para o corretor deste imóvel. Veja a{" "}
        <a
          href="/privacidade"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-muted"
        >
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
}
