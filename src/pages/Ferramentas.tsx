import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Info, Search } from "lucide-react";
import { comissao } from "@/lib/financiamento";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { lerMoeda, lerPct, mascaraMoeda, reaisCentavos } from "@/lib/moeda";
import { PaginaSimples } from "@/components/PaginaSimples";
import { Simulador } from "@/components/Simulador";

const entrar = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE_OUT_EXPO } };
const campo =
  "h-11 w-full rounded-xl border border-line-strong bg-bg px-3.5 text-sm outline-hidden transition placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10";

function Chamada({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-ink p-8 text-bg sm:flex-row sm:items-center sm:p-10">
      <div>
        <p className="font-display text-2xl font-semibold tracking-tight">{titulo}</p>
        <p className="mt-1.5 text-bg/70">{texto}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <a href="/imoveis" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-5 font-semibold transition hover:bg-white/10">
          <Search className="size-4" /> Ver imóveis
        </a>
        <Link
          to="/para-corretores"
          className="group/button inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-white transition-[background-color,transform] hover:bg-accent-deep active:scale-[0.98]"
        >
          Sou corretor <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

/** SIMULADOR DE FINANCIAMENTO público (/simulador-de-financiamento). */
export function SimuladorFinanciamento() {
  return (
    <PaginaSimples titulo="Simulador de financiamento imobiliário" rotulo="Simulador de financiamento">
      <motion.section {...entrar}>
        <p className="type-eyebrow text-accent">Grátis e sem cadastro</p>
        <h1 className="type-title mt-3">Simulador de financiamento imobiliário</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Veja quanto fica a parcela nos sistemas SAC e Price, a renda que os bancos costumam pedir e quanto separar para ITBI e cartório.
        </p>
      </motion.section>
      <motion.section {...entrar} transition={{ ...entrar.transition, delay: 0.1 }} className="mt-10 rounded-[2rem] border border-line p-5 shadow-soft sm:p-8">
        <Simulador valorInicial={500000} />
      </motion.section>
      <section className="mt-16 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">SAC ou Price?</h2>
          <p className="mt-2 leading-relaxed text-muted">
            No <strong className="text-ink">SAC</strong>, a dívida é paga em partes iguais todo mês e os juros incidem sobre o que falta: a parcela
            começa mais alta e diminui. No total, paga-se menos juros. Na <strong className="text-ink">Price</strong>, a parcela é a mesma do início
            ao fim, o que facilita o planejamento, mas o total de juros é maior.
          </p>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Como o cálculo é feito</h2>
          <p className="mt-2 leading-relaxed text-muted">
            A taxa anual é convertida em taxa mensal equivalente e aplicada sobre o valor financiado (imóvel menos entrada). A renda sugerida considera
            a primeira parcela em até 30% da renda familiar. Seguros, tarifas e TR variam por banco e não entram na conta.
          </p>
        </div>
      </section>
      <Chamada titulo="Encontrou o imóvel certo?" texto="Veja os imóveis anunciados por corretores e imobiliárias no portal da Frankkia." />
    </PaginaSimples>
  );
}

const DIVISOES = [
  { v: 100, rotulo: "Venda só minha" },
  { v: 50, rotulo: "Parceria 50/50" },
  { v: 60, rotulo: "Minha parte: 60%" },
  { v: 40, rotulo: "Minha parte: 40%" },
];

/** CALCULADORA DE COMISSÃO pública (/calculadora-de-comissao). */
export function CalculadoraComissao() {
  const [valor, setValor] = useState("500.000,00");
  const [pct, setPct] = useState("6");
  const [parte, setParte] = useState(100);
  const [repasse, setRepasse] = useState("0");
  const r = useMemo(() => comissao({ valor: lerMoeda(valor), pct: lerPct(pct), minhaParte: parte, repassePct: lerPct(repasse) }), [valor, pct, parte, repasse]);

  return (
    <PaginaSimples titulo="Calculadora de comissão de corretor" rotulo="Calculadora de comissão">
      <motion.section {...entrar}>
        <p className="type-eyebrow text-accent">Grátis e sem cadastro</p>
        <h1 className="type-title mt-3">Calculadora de comissão de corretor</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Calcule os honorários de uma venda, a divisão em parceria e quanto fica com você depois do repasse à imobiliária.
        </p>
      </motion.section>

      <motion.section
        {...entrar}
        transition={{ ...entrar.transition, delay: 0.1 }}
        className="mt-10 grid gap-8 rounded-[2rem] border border-line p-5 shadow-soft sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Valor da venda</span>
            <input className={campo} inputMode="numeric" value={valor} onChange={(e) => setValor(mascaraMoeda(e.target.value))} placeholder="0,00" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Comissão combinada (%)</span>
            <input className={campo} inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value.replace(/[^\d,]/g, ""))} />
            <span className="mt-1 block text-xs text-subtle">A que está na autorização de venda. Em geral, de 5% a 6% em imóveis urbanos.</span>
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted">Divisão da venda</span>
            <div className="grid grid-cols-2 gap-2">
              {DIVISOES.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => setParte(d.v)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${parte === d.v ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink/40"}`}
                >
                  {d.rotulo}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Repasse à imobiliária (% da sua parte)</span>
            <input className={campo} inputMode="decimal" value={repasse} onChange={(e) => setRepasse(e.target.value.replace(/[^\d,]/g, ""))} />
            <span className="mt-1 block text-xs text-subtle">Corretor autônomo: 0%.</span>
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-3xl bg-accent p-6 text-white">
            <p className="text-sm font-semibold text-white/80">Fica com você</p>
            <p className="mt-1 font-display text-4xl font-semibold tracking-tight">{reaisCentavos(r.voce)}</p>
            <p className="mt-1 text-sm text-white/80">valor bruto, antes de impostos</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Comissão total da venda", reaisCentavos(r.total)],
              ["Parte do parceiro", reaisCentavos(r.parceiro)],
              ["Sua parte da venda", reaisCentavos(r.daVenda)],
              ["Repasse à imobiliária", reaisCentavos(r.repasse)],
            ].map(([t, x]) => (
              <div key={t} className="rounded-2xl bg-canvas p-3.5">
                <dt className="text-xs text-muted">{t}</dt>
                <dd className="mt-0.5 font-semibold">{x}</dd>
              </div>
            ))}
          </dl>
          <p className="flex gap-2 text-xs leading-relaxed text-subtle">
            <Info className="mt-0.5 size-3.5 shrink-0" />O imposto depende de como você recebe (pessoa física, MEI ou empresa). Confirme com o seu
            contador.
          </p>
        </div>
      </motion.section>

      <Chamada titulo="Controle todas as suas comissões" texto="Na Frankkia, cada venda registrada já calcula VGV, honorários e a comissão de cada participante." />
    </PaginaSimples>
  );
}
