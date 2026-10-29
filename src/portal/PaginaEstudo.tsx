import { BedDouble, Car, Printer, Ruler } from "lucide-react";
import type { EstudoPublico } from "./api";
import { creciTexto, FotoPessoa } from "./ui";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { Logo } from "@/components/ui";
import { calcularValores } from "@/lib/estudo-calculo";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

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

/**
 * APRESENTAÇÃO DO ESTUDO DE MERCADO para o proprietário (/estudo/<token>).
 * Mostra só os valores marcados como "mostrar na apresentação" e as amostras usadas no cálculo.
 */
export default function PaginaEstudo({ e }: { e: EstudoPublico }) {
  const r = valoresDoEstudo(e);
  const loc = e.finalidade === "locacao";
  const fmt = (n: number) => (loc ? `${brl(n)}/mês` : brl(n));
  const local = [e.bairro, e.cidade && `${e.cidade}${e.uf ? ` - ${e.uf}` : ""}`].filter(Boolean).join(", ");
  const cards = r
    ? [
        e.mostrar_improvavel && { rotulo: "Valor máximo (pouco provável)", valor: r.improvavel, cls: "bg-rose-50 text-rose-700 ring-rose-200", txt: "Teto do que o mercado tem pedido por imóveis parecidos." },
        e.mostrar_mercado && { rotulo: "Valor de mercado", valor: r.mercado, cls: "bg-accent text-white ring-accent shadow-lift", txt: "Faixa realista para vender em um prazo normal." },
        e.mostrar_urgencia && { rotulo: loc ? "Para alugar com urgência" : "Para vender com urgência", valor: r.urgencia, cls: "bg-verified-soft text-verified ring-verified/30", txt: "Valor para atrair propostas rapidamente." },
      ].filter((c): c is { rotulo: string; valor: number; cls: string; txt: string } => !!c)
    : [];
  const zap = e.corretor.telefone ? `https://wa.me/${e.corretor.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, ${e.corretor.nome.split(" ")[0]}! Vi o estudo de mercado do meu imóvel.`)}` : null;

  return (
    <div className="min-h-screen bg-canvas/50 text-ink print:bg-white">
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {e.imobiliaria.logo ? (
              <img src={e.imobiliaria.logo} alt={e.imobiliaria.nome} className="h-9 w-auto max-w-[9rem] object-contain" />
            ) : e.imobiliaria.solo ? (
              <FotoPessoa p={{ nome: e.corretor.nome, foto: e.corretor.foto }} className="size-9 text-sm" />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display font-semibold text-accent">
                {e.imobiliaria.nome.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="truncate font-display text-lg font-semibold tracking-tight">
              {e.imobiliaria.solo && !e.imobiliaria.logo ? e.corretor.nome : e.imobiliaria.nome}
            </span>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-semibold transition hover:bg-canvas print:hidden"
          >
            <Printer className="size-4" /> <span className="hidden sm:inline">Imprimir ou salvar PDF</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        <section>
          <p className="type-eyebrow text-accent">Estudo de mercado</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {e.categoria} {loc ? "para locação" : "à venda"}
            {e.bairro ? ` em ${e.bairro}` : ""}
          </h1>
          <p className="mt-2 text-muted">
            {[e.logradouro, local].filter(Boolean).join(" · ")} · atualizado em {new Date(e.atualizado_em).toLocaleDateString("pt-BR")}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            <li className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1.5 ring-1 ring-line">
              <Ruler className="size-4 text-accent" /> {e.area} m² privativos
            </li>
            {e.quartos ? (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1.5 ring-1 ring-line">
                <BedDouble className="size-4 text-accent" /> {e.quartos} dormitórios{e.suites ? ` (${e.suites} suítes)` : ""}
              </li>
            ) : null}
            {e.vagas ? (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1.5 ring-1 ring-line">
                <Car className="size-4 text-accent" /> {e.vagas} vagas
              </li>
            ) : null}
          </ul>
        </section>

        {r && cards.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-3">
            {cards.map((c) => (
              <div key={c.rotulo} className={`rounded-3xl p-6 ring-1 ${c.cls}`}>
                <p className="text-sm font-semibold opacity-90">{c.rotulo}</p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{fmt(c.valor)}</p>
                <p className="mt-1 text-sm opacity-80">{brl(c.valor / e.area)}/m²</p>
                <p className="mt-3 text-sm opacity-80">{c.txt}</p>
              </div>
            ))}
          </section>
        ) : (
          <p className="rounded-3xl bg-bg p-6 text-muted ring-1 ring-line">O corretor ainda está finalizando os valores deste estudo.</p>
        )}

        {e.amostras.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-semibold tracking-tight">Imóveis comparados</h2>
            <p className="mt-1 text-sm text-muted">
              {e.amostras.length} {e.amostras.length === 1 ? "imóvel parecido" : "imóveis parecidos"} na região
              {r ? `, com preço médio de ${brl(r.m2)}/m²` : ""}.
            </p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {e.amostras.map((s, i) => (
                <li key={i} className="overflow-hidden rounded-3xl bg-bg ring-1 ring-line">
                  {s.foto ? (
                    <img src={s.foto} alt="" className="aspect-[16/10] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid aspect-[16/10] place-items-center bg-canvas font-display text-3xl font-semibold text-subtle">#{i + 1}</div>
                  )}
                  <div className="p-4">
                    <p className="font-display text-lg font-semibold">{fmt(s.valor)}</p>
                    <p className="text-sm text-muted">
                      {[`${s.area} m²`, `${brl(s.valor / s.area)}/m²`, s.quartos && `${s.quartos} dorm.`, s.vagas && `${s.vagas} vagas`].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 truncate text-xs text-subtle">
                      {[s.bairro, s.origem === "vendido" ? (loc ? "Alugado" : "Vendido") : "Anunciado"].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-3xl bg-bg p-6 text-sm text-muted ring-1 ring-line">
          <p className="font-semibold text-ink">Como chegamos a estes valores</p>
          <p className="mt-1">
            Calculamos o preço médio do metro quadrado dos imóveis comparados e multiplicamos pela área privativa do seu imóvel. Os valores consideram
            ajustes de mercado definidos pelo corretor responsável. É uma referência para a sua decisão, e não um laudo de avaliação.
          </p>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-bg sm:flex-row sm:items-center">
          <FotoPessoa p={{ nome: e.corretor.nome, foto: e.corretor.foto }} className="size-16 text-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-bg/60">Estudo preparado por</p>
            <p className="font-display text-xl font-semibold">{e.corretor.nome}</p>
            <p className="text-sm text-bg/70">
              {[creciTexto(e.corretor), !e.imobiliaria.solo && e.imobiliaria.nome, e.imobiliaria.creci_j && `CRECI-J ${e.imobiliaria.creci_j}`].filter(Boolean).join(" · ")}
            </p>
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

        <p className="flex items-center justify-center gap-2 text-xs text-subtle">
          Feito com <Logo className="text-sm text-muted" />
        </p>
      </main>
    </div>
  );
}
