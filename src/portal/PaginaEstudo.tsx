import { Bath, BedDouble, Building2, Car, Check, ExternalLink, FileSignature, Handshake, Home, MapPin, Megaphone, Minus, Printer, Ruler, Search, SearchCheck } from "lucide-react";
import type { EstudoPublico } from "./api";
import { creciTexto, FotoPessoa } from "./ui";
import { Surge } from "./anim";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { Logo } from "@/components/ui";
import { calcularValores } from "@/lib/estudo-calculo";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

/** Rótulos das características (os mesmos do formulário do estudo). */
const ROTULOS: Record<string, Record<string, string>> = {
  infraestrutura: { nao: "Não tem", parcial: "Parcial", completa: "Completa" },
  portaria: { nao: "Não tem", parcial: "Parcial", "24h": "24 horas" },
  orientacao_solar: { nascente: "Nascente", poente: "Poente", norte: "Norte", sul: "Sul", mista: "Mista" },
  conservacao: { reformar: "Precisa de reforma", regular: "Regular", bom: "Bom", otimo: "Ótimo", novo: "Novo" },
  mobilia: { nao: "Sem mobília", semi: "Semimobiliado", mobiliado: "Mobiliado" },
};
const rotulo = (campo: string, v?: string | null) => (v ? (ROTULOS[campo]?.[v] ?? v) : null);
/** Valores que indicam ausência ("não tem", "sem mobília"): aparecem sem o check verde. */
const NEGATIVOS = new Set(["Não tem", "Sem mobília", "Não", "Precisa de reforma"]);

/** Mesmo cálculo do estudo no app (src/lib/estudo-calculo.ts). */
export function valoresDoEstudo(e: EstudoPublico) {
  const v = calcularValores({
    amostras: e.amostras,
    area: e.area,
    ajusteImprovavel: e.ajuste_improvavel,
    ajusteMercado: e.ajuste_mercado,
    ajusteUrgencia: e.ajuste_urgencia,
    usarVariaveis: e.usar_variaveis,
    caracteristicas: {
      conservacao: e.conservacao,
      anoConstrucao: e.ano,
      emCondominio: e.em_condominio,
      portaria: e.portaria,
      infraestrutura: e.infraestrutura,
      orientacaoSolar: e.orientacao_solar,
      mobilia: e.mobilia,
      finalidade: e.finalidade,
    },
  });
  return v && { m2: v.m2Medio, improvavel: v.improvavel, mercado: v.mercado, urgencia: v.urgencia };
}

function Titulo({ eyebrow, children, centro, claro }: { eyebrow?: string; children: React.ReactNode; centro?: boolean; claro?: boolean }) {
  return (
    <div className={centro ? "text-center" : ""}>
      <span className={`block h-1.5 w-16 rounded-full bg-accent ${centro ? "mx-auto" : ""} ${claro ? "bg-white/70" : ""}`} />
      {eyebrow && <p className={`type-eyebrow mt-5 ${claro ? "text-white/70" : "text-accent"}`}>{eyebrow}</p>}
      <h2 className={`mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl ${claro ? "text-white" : ""}`}>{children}</h2>
    </div>
  );
}

/**
 * APRESENTAÇÃO DO ESTUDO DE MERCADO para o proprietário (/estudo/<token>).
 * Conta a história do valor: quem fez, por que o preço certo importa, como foi feito, o imóvel, as amostras,
 * a tabela comparativa, os valores e os próximos passos. Mostra só os valores marcados para a apresentação.
 */
export default function PaginaEstudo({ e }: { e: EstudoPublico }) {
  const r = valoresDoEstudo(e);
  const loc = e.finalidade === "locacao";
  const fmt = (n: number) => (loc ? `${brl(n)}/mês` : brl(n));
  const local = [e.bairro, e.cidade && `${e.cidade}${e.uf ? ` - ${e.uf}` : ""}`].filter(Boolean).join(", ");
  const n = e.amostras.length;
  const zap = e.corretor.telefone
    ? `https://wa.me/${e.corretor.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, ${e.corretor.nome.split(" ")[0]}! Vi o estudo de mercado do meu imóvel.`)}`
    : null;
  const marca = e.imobiliaria.solo && !e.imobiliaria.logo ? e.corretor.nome : e.imobiliaria.nome;
  const vender = loc ? "alugar" : "vender";

  const cards = r
    ? [
        e.mostrar_improvavel && { chave: "improvavel", rotulo: "Valor máximo (pouco provável)", valor: r.improvavel, cls: "bg-rose-50 text-rose-700 ring-rose-200", txt: "Teto do que o mercado tem pedido por imóveis parecidos.", pos: 10, marca: loc ? "Locação lenta" : "Venda lenta" },
        e.mostrar_mercado && { chave: "mercado", rotulo: "Valor de mercado", valor: r.mercado, cls: "bg-accent text-white ring-accent shadow-lift", txt: `Faixa realista para ${vender} em um prazo normal.`, pos: 50, marca: "Prazo normal" },
        e.mostrar_urgencia && { chave: "urgencia", rotulo: loc ? "Para alugar com urgência" : "Para vender com urgência", valor: r.urgencia, cls: "bg-verified-soft text-verified ring-verified/30", txt: "Valor para atrair propostas rapidamente.", pos: 90, marca: loc ? "Locação rápida" : "Venda rápida" },
      ].filter((c): c is { chave: string; rotulo: string; valor: number; cls: string; txt: string; pos: number; marca: string } => !!c)
    : [];

  // Tabela: médias das amostras
  const media = (f: (s: EstudoPublico["amostras"][number]) => number) => (n ? e.amostras.reduce((a, s) => a + f(s), 0) / n : 0);
  const mediaValor = media((s) => s.valor);
  const mediaArea = media((s) => s.area);

  const caracteristicas = [
    ["Estado de conservação", rotulo("conservacao", e.conservacao)],
    ["Infraestrutura", rotulo("infraestrutura", e.infraestrutura)],
    ["Portaria", rotulo("portaria", e.portaria)],
    ["Posição solar", rotulo("orientacao_solar", e.orientacao_solar)],
    ["Mobília", rotulo("mobilia", e.mobilia)],
    ["Em condomínio", e.em_condominio == null ? null : e.em_condominio ? "Sim" : "Não"],
  ].filter((x): x is [string, string] => !!x[1]);

  // A apresentação existe para convencer o proprietário: os passos sempre levam à autorização,
  // que é a decisão pedida a ele agora (não refletem o andamento interno do estudo no app).
  const passos = [
    { t: "Visita ao imóvel", icon: Home, feito: true },
    { t: "Estudo de mercado", icon: SearchCheck, feito: true },
    { t: `Autorização de ${loc ? "locação" : "venda"}`, icon: FileSignature, feito: false },
    { t: "Divulgação", icon: Megaphone, feito: false },
    { t: loc ? "Locação" : "Venda", icon: Handshake, feito: false },
  ];
  const atual = 2;

  return (
    <div className="min-h-screen bg-linear-to-b from-canvas/60 to-bg text-ink print:bg-white">
      {/* Barra do topo */}
      <header className="sticky top-3 z-30 mx-auto mt-3 max-w-5xl px-4 sm:px-6 print:static">
        <div className="flex h-16 items-center justify-between gap-4 rounded-full bg-bg/95 px-4 shadow-lift ring-1 ring-line backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {e.imobiliaria.logo ? (
              <img src={e.imobiliaria.logo} alt={e.imobiliaria.nome} className="h-9 w-auto max-w-[8rem] object-contain" />
            ) : e.imobiliaria.solo ? (
              <FotoPessoa p={{ nome: e.corretor.nome, foto: e.corretor.foto }} className="size-9 text-sm" />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display font-semibold text-accent">
                {e.imobiliaria.nome.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="truncate font-display font-semibold tracking-tight">{marca}</span>
          </div>
          <p className="hidden font-display text-lg font-semibold tracking-tight text-accent md:block">Estudo de mercado</p>
          <button
            onClick={() => window.print()}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-deep print:hidden"
          >
            <Printer className="size-4" /> <span className="hidden sm:inline">Salvar PDF</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-4 py-10 sm:space-y-24 sm:px-6">
        {/* Abertura */}
        <Surge y={16}>
          <section className="grid overflow-hidden rounded-[2rem] shadow-lift md:grid-cols-2">
            <div className="relative min-h-64 bg-canvas">
              {e.foto ? (
                <img src={e.foto} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-linear-to-br from-accent-soft to-canvas text-accent">
                  <Building2 className="size-20 opacity-60" />
                </div>
              )}
            </div>
            <div className="bg-accent p-8 text-white sm:p-10">
              <span className="block h-1.5 w-16 rounded-full bg-white/70" />
              <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Olá{e.proprietario ? `, ${e.proprietario}` : ""}.</h1>
              <p className="mt-5 leading-relaxed text-white/85">
                Saber onde o seu imóvel está no mercado é o primeiro passo para {vender} com segurança e no tempo certo. Para isso, preparei um estudo
                com base nas características do seu imóvel e em imóveis parecidos {local ? `em ${local}` : "na região"}.
              </p>
              <p className="mt-4 leading-relaxed text-white/85">
                O objetivo é chegar ao valor certo: o que coloca o seu imóvel em destaque, em vez de deixá-lo parado enquanto os vizinhos são
                {loc ? " alugados" : " vendidos"}.
              </p>
              <p className="mt-6 text-sm text-white/60">
                {e.categoria} {loc ? "para locação" : "à venda"} · atualizado em {new Date(e.atualizado_em).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </section>
        </Surge>

        {/* Quem preparou */}
        <Surge>
          <section className="relative grid items-center gap-6 rounded-[2rem] bg-ink p-8 text-bg sm:grid-cols-[auto_1fr] sm:p-10">
            <FotoPessoa p={{ nome: e.corretor.nome, foto: e.corretor.foto }} className="size-32 text-3xl ring-8 ring-white/10 sm:size-40" />
            <div className="min-w-0">
              <p className="text-sm text-bg/60">Estudo preparado por</p>
              <p className="font-display text-3xl font-semibold tracking-tight">{e.corretor.nome}</p>
              <p className="mt-1 text-sm text-bg/70">
                {["Corretor de imóveis", creciTexto(e.corretor), !e.imobiliaria.solo && e.imobiliaria.nome, e.imobiliaria.creci_j && `CRECI-J ${e.imobiliaria.creci_j}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {e.corretor.bio && (
                <div className="mt-5 rounded-2xl bg-white/10 p-5">
                  <p className="text-sm font-semibold">Um pouco sobre mim</p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-bg/80">{e.corretor.bio}</p>
                </div>
              )}
            </div>
          </section>
        </Surge>

        {/* Preço x tempo */}
        <Surge>
          <section>
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <Titulo eyebrow="Por que o preço importa">Preço certo, {loc ? "locação" : "venda"} mais rápida.</Titulo>
                <p className="mt-5 leading-relaxed text-muted">
                  O tempo para {vender} um imóvel depende muito do preço pedido. Imóveis anunciados acima do valor de mercado demoram mais, recebem
                  menos visitas e, muitas vezes, acabam {loc ? "alugados" : "vendidos"} por menos do que valiam, depois de meses parados.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  `${loc ? "Locação" : "Venda"} em um prazo mais curto`,
                  "Mais interessados e mais visitas",
                  "Propostas melhores e mais firmes",
                  "Corretores motivados a mostrar o imóvel",
                  "Menos descontos na hora de negociar",
                  "Menos custos com o imóvel parado",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-verified-soft text-verified">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-10">
              <div className="mb-2 flex justify-between text-xs font-semibold text-muted">
                <span>Menor tempo de {loc ? "locação" : "venda"}</span>
                <span>Maior tempo de {loc ? "locação" : "venda"} →</span>
              </div>
              <div className="grid grid-cols-4 overflow-hidden rounded-2xl text-white">
                {["Preço de mercado", "+10%", "+20%", "+30%"].map((t, i) => (
                  <div key={t} className="px-3 py-5 text-center font-display text-lg font-semibold sm:text-2xl" style={{ background: `hsl(226 ${80 - i * 8}% ${55 - i * 9}%)` }}>
                    {t}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-muted">Quanto mais ajustado o preço, menor o tempo para {vender}.</p>
            </div>
          </section>
        </Surge>

        {/* Metodologia */}
        <Surge>
          <section className="grid items-center gap-8 rounded-[2rem] bg-accent p-8 text-white sm:p-10 md:grid-cols-[auto_1fr]">
            <span className="grid size-24 place-items-center rounded-3xl bg-white/15 sm:size-32">
              <Search className="size-12 sm:size-16" />
            </span>
            <div>
              <Titulo claro>Como chegamos aos valores</Titulo>
              <p className="mt-4 leading-relaxed text-white/85">
                O estudo usa {n > 0 ? `${n} ${n === 1 ? "imóvel parecido" : "imóveis parecidos"}` : "imóveis parecidos"} com o seu: mesma região, área,
                tipo e características próximas. Calculamos o preço médio do metro quadrado e aplicamos à área do seu imóvel
                {e.usar_variaveis ? ", com ajustes pelas características que mudam o preço (conservação, idade, portaria, infraestrutura...)" : ""}.
              </p>
              <p className="mt-3 text-sm text-white/70">É uma referência para a sua decisão, e não um laudo de avaliação.</p>
            </div>
          </section>
        </Surge>

        {/* O imóvel */}
        <Surge>
          <section className="rounded-[2rem] bg-bg p-6 shadow-lift ring-1 ring-line sm:p-10">
            <Titulo eyebrow="Seu imóvel">Dados principais</Titulo>
            <p className="mt-4 flex items-center gap-2 text-muted">
              <MapPin className="size-4 text-accent" /> {[e.logradouro, local].filter(Boolean).join(" · ") || "Endereço não informado"}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {[
                [Ruler, `${num(e.area)} m² privativos`],
                e.area_terreno && [Ruler, `${num(e.area_terreno)} m² de terreno`],
                e.quartos && [BedDouble, `${e.quartos} ${e.quartos === 1 ? "dormitório" : "dormitórios"}${e.suites ? ` (${e.suites} ${e.suites === 1 ? "suíte" : "suítes"})` : ""}`],
                e.banheiros && [Bath, `${e.banheiros} ${e.banheiros === 1 ? "banheiro" : "banheiros"}`],
                e.vagas && [Car, `${e.vagas} ${e.vagas === 1 ? "vaga" : "vagas"}`],
                e.ano && [Building2, `Construído em ${e.ano}`],
              ]
                .filter((x): x is [typeof Ruler, string] => !!x)
                .map(([Icone, t]) => (
                  <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 font-semibold text-white">
                    <Icone className="size-4" /> {t}
                  </li>
                ))}
            </ul>
            {caracteristicas.length > 0 && (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {caracteristicas.map(([t, v]) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm">
                    {NEGATIVOS.has(v) ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-canvas text-subtle">
                        <Minus className="size-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-verified-soft text-verified">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    )}
                    <span>
                      <span className="text-muted">{t}:</span> <span className="font-semibold">{v}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {e.lat != null && e.lng != null && (
              <div className="mt-8 print:hidden">
                {/* Só para ver: sem cliques, para a rolagem da página não virar zoom do mapa */}
                <iframe
                  title="Localização do imóvel"
                  loading="lazy"
                  tabIndex={-1}
                  className="pointer-events-none h-72 w-full rounded-3xl border border-line"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${e.lng - 0.008},${e.lat - 0.005},${e.lng + 0.008},${e.lat + 0.005}&layer=mapnik&marker=${e.lat},${e.lng}`}
                />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent"
                >
                  <ExternalLink className="size-4" /> Abrir no Google Maps
                </a>
              </div>
            )}
          </section>
        </Surge>

        {/* Amostras */}
        {n > 0 && (
          <Surge>
            <section>
              <Titulo centro eyebrow="Comparativo">
                Imóveis parecidos no mercado
              </Titulo>
              <p className="mt-3 text-center text-muted">
                {n} {n === 1 ? "imóvel" : "imóveis"} na região{r ? `, com preço médio de ${brl(r.m2)}/m²` : ""}.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {e.amostras.map((s, i) => (
                  <li key={i} className="overflow-hidden rounded-3xl bg-bg shadow-soft ring-1 ring-line">
                    {s.foto ? (
                      <img src={s.foto} alt="" className="aspect-[16/10] w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid aspect-[16/10] place-items-center bg-canvas font-display text-3xl font-semibold text-subtle">#{i + 1}</div>
                    )}
                    <div className="p-4">
                      <p className="font-display text-lg font-semibold">{fmt(s.valor)}</p>
                      <p className="text-sm text-muted">
                        {[`${num(s.area)} m²`, `${brl(s.valor / s.area)}/m²`, s.quartos && `${s.quartos} dorm.`, s.vagas && `${s.vagas} vagas`].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-subtle">
                          {[s.bairro, s.origem === "vendido" ? (loc ? "Alugado" : "Vendido") : "Anunciado"].filter(Boolean).join(" · ")}
                        </p>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent print:hidden">
                            Ver anúncio <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </Surge>
        )}

        {/* Tabela comparativa */}
        {n > 0 && (
          <Surge>
            <section className="rounded-[2rem] bg-bg p-6 shadow-lift ring-1 ring-line sm:p-8">
              <Titulo centro>Tabela comparativa</Titulo>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full min-w-[46rem] border-separate border-spacing-y-1.5 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-white">
                      {["Imóvel", "Área", "Dorm.", "Suítes", "Banh.", "Vagas", "Portaria", "Ano", loc ? "Aluguel" : "Preço", "Preço/m²"].map((h, i, arr) => (
                        <th key={h} className={`bg-accent px-3 py-2.5 ${i === 0 ? "rounded-l-full pl-4" : ""} ${i === arr.length - 1 ? "rounded-r-full pr-4 text-right" : ""} ${i >= 8 ? "text-right" : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-accent-soft/70 font-semibold">
                      <td className="rounded-l-2xl px-4 py-3">Seu imóvel</td>
                      <td className="px-3">{num(e.area)} m²</td>
                      <td className="px-3">{e.quartos ?? "—"}</td>
                      <td className="px-3">{e.suites ?? "—"}</td>
                      <td className="px-3">{e.banheiros ?? "—"}</td>
                      <td className="px-3">{e.vagas ?? "—"}</td>
                      <td className="px-3">{rotulo("portaria", e.portaria) ?? "—"}</td>
                      <td className="px-3">{e.ano ?? "—"}</td>
                      <td className="px-3 text-right text-accent">?</td>
                      <td className="rounded-r-2xl px-4 text-right text-accent">?</td>
                    </tr>
                    {e.amostras.map((s, i) => (
                      <tr key={i} className="bg-canvas">
                        <td className="max-w-[14rem] truncate rounded-l-2xl px-4 py-3">{s.endereco || s.bairro || `Amostra ${i + 1}`}</td>
                        <td className="px-3">{num(s.area)} m²</td>
                        <td className="px-3">{s.quartos ?? "—"}</td>
                        <td className="px-3">{s.suites ?? "—"}</td>
                        <td className="px-3">{s.banheiros ?? "—"}</td>
                        <td className="px-3">{s.vagas ?? "—"}</td>
                        <td className="px-3">{rotulo("portaria", s.portaria) ?? "—"}</td>
                        <td className="px-3">{s.ano ?? "—"}</td>
                        <td className="px-3 text-right tabular-nums">{brl(s.valor)}</td>
                        <td className="rounded-r-2xl px-4 text-right tabular-nums">{brl(s.valor / s.area)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold text-white">
                      <td className="rounded-l-full bg-ink px-4 py-3">Média</td>
                      <td className="bg-ink px-3">{num(mediaArea)} m²</td>
                      <td className="bg-ink px-3" colSpan={6} />
                      <td className="bg-ink px-3 text-right tabular-nums">{brl(mediaValor)}</td>
                      <td className="rounded-r-full bg-ink px-4 text-right tabular-nums">{r ? brl(r.m2) : "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Usamos imóveis anunciados nos principais portais e negócios fechados na região, escolhidos por serem parecidos com o seu. Os valores
                anunciados são de responsabilidade de quem anuncia e servem como base para o estudo.
              </p>
            </section>
          </Surge>
        )}

        {/* Resultado */}
        <Surge>
          <section className="rounded-[2rem] bg-bg p-6 shadow-lift ring-1 ring-line sm:p-10">
            <Titulo centro eyebrow="Resultado">
              Valores encontrados
            </Titulo>
            {r && cards.length > 0 ? (
              <>
                <div className={`mt-8 grid gap-4 ${cards.length === 3 ? "md:grid-cols-3" : cards.length === 2 ? "md:grid-cols-2" : "mx-auto max-w-sm"}`}>
                  {cards.map((c) => (
                    <div key={c.chave} className={`rounded-3xl p-6 ring-1 ${c.cls}`}>
                      <p className="text-sm font-semibold opacity-90">{c.rotulo}</p>
                      <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{fmt(c.valor)}</p>
                      <p className="mt-1 text-sm opacity-80">{brl(c.valor / e.area)}/m²</p>
                      <p className="mt-3 text-sm opacity-80">{c.txt}</p>
                    </div>
                  ))}
                </div>
                {/* Régua: do preço alto (venda lenta) ao preço de urgência (venda rápida) */}
                <div className="relative mt-14 pb-2">
                  {cards.map((c) => (
                    <span key={c.chave} className="absolute -top-8 -translate-x-1/2 text-center text-xs font-semibold text-muted" style={{ left: `${c.pos}%` }}>
                      {c.marca}
                      <span className="mx-auto mt-1 block size-0 border-x-[6px] border-t-[7px] border-x-transparent border-t-line-strong" />
                    </span>
                  ))}
                  <div className="h-3 rounded-full bg-linear-to-r from-rose-500 via-amber-400 to-emerald-500" />
                </div>
              </>
            ) : (
              <p className="mt-6 rounded-3xl bg-canvas p-6 text-center text-muted">O corretor ainda está finalizando os valores deste estudo.</p>
            )}
          </section>
        </Surge>

        {/* Próximos passos */}
        <Surge>
          <section>
            <Titulo centro eyebrow="Próximos passos">
              Vamos {vender} o seu imóvel?
            </Titulo>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted">
              O próximo passo é a autorização para eu cuidar da {loc ? "locação" : "venda"} do seu imóvel. Será um prazer acompanhar cada etapa com você.
            </p>
            <ol className="mt-10 grid grid-cols-5 gap-2 sm:gap-4">
              {passos.map((p, i) => {
                const agora = i === atual;
                return (
                  <li key={p.t} className="flex flex-col items-center text-center">
                    <span
                      className={`grid size-12 place-items-center rounded-full sm:size-16 ${
                        agora ? "bg-accent text-white ring-8 ring-accent/15" : p.feito ? "bg-ink text-bg" : "bg-canvas text-subtle"
                      }`}
                    >
                      <p.icon className="size-5 sm:size-7" />
                    </span>
                    <span className={`mt-4 h-1.5 w-full rounded-full ${agora ? "bg-accent" : p.feito ? "bg-ink" : "bg-line"}`} />
                    <span className={`mt-3 text-xs font-semibold sm:text-sm ${agora ? "text-accent" : p.feito ? "" : "text-subtle"}`}>{p.t}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </Surge>

        {/* Contato */}
        <Surge>
          <section className="flex flex-col gap-4 rounded-[2rem] bg-ink p-6 text-bg sm:flex-row sm:items-center sm:p-8">
            <FotoPessoa p={{ nome: e.corretor.nome, foto: e.corretor.foto }} className="size-16 text-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-bg/60">Ficou com alguma dúvida?</p>
              <p className="font-display text-xl font-semibold">Fale com {e.corretor.nome.split(" ")[0]}</p>
              <p className="text-sm text-bg/70">{[creciTexto(e.corretor), !e.imobiliaria.solo && e.imobiliaria.nome].filter(Boolean).join(" · ")}</p>
            </div>
            {zap && (
              <a
                href={zap}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 font-semibold text-white transition hover:brightness-95 print:hidden"
              >
                <WhatsAppIcon className="size-5" /> Falar com o corretor
              </a>
            )}
          </section>
        </Surge>

        <p className="flex items-center justify-center gap-2 text-xs text-subtle">
          Feito com <Logo className="text-sm text-muted" />
        </p>
      </main>
    </div>
  );
}
