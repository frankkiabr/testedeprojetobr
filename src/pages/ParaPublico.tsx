import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { contato, pricing, publicos } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { linkWhatsApp } from "@/lib/whatsapp";
import { PaginaSimples } from "@/components/PaginaSimples";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

const aparecer = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-10%" },
  transition: { duration: 0.8, ease: EASE_OUT_EXPO },
};

/** PÁGINAS POR PÚBLICO: /para-imobiliarias e /para-corretores (textos em `publicos`, src/content.ts). */
export default function ParaPublico({ publico }: { publico: "imobiliarias" | "corretores" }) {
  const p = publicos[publico];
  const solo = publico === "corretores";
  const planos = solo ? [{ ...pricing.solo, highlight: true }] : pricing.plans;
  const cadastro = `/cadastro?plano=${encodeURIComponent(p.cta.plano)}`;
  const zap = linkWhatsApp(
    solo
      ? `Olá, ${contato.primeiroNome}! Sou corretor autônomo e quero conhecer a Frankkia.`
      : `Olá, ${contato.primeiroNome}! Tenho uma imobiliária e quero conhecer a Frankkia.`,
  );

  return (
    <PaginaSimples titulo={p.titulo} largura="max-w-5xl">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}>
        <p className="type-eyebrow text-accent">{p.eyebrow}</p>
        <h1 className="type-title mt-3 max-w-3xl">{p.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{p.text}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={cadastro}
            className="group/button inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-white transition-[background-color,transform] hover:bg-accent-deep active:scale-[0.98]"
          >
            {p.cta.label} <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
          </Link>
          <a href={zap} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong px-6 font-semibold transition hover:bg-canvas">
            <WhatsAppIcon className="size-5 text-[#25d366]" /> Falar no WhatsApp
          </a>
        </div>
      </motion.section>

      <motion.section {...aparecer} className="mt-20">
        <p className="type-eyebrow text-accent">Hoje</p>
        <h2 className="type-title mt-3">O que atrapalha.</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {p.dores.map((d) => (
            <li key={d.t} className="rounded-[1.75rem] border border-line bg-canvas/60 p-6">
              <span className="grid size-10 place-items-center rounded-2xl bg-bg text-rose-600 shadow-soft">
                <X className="size-5" />
              </span>
              <p className="mt-5 font-display text-lg font-semibold tracking-tight">{d.t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{d.d}</p>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section {...aparecer} className="mt-20">
        <p className="type-eyebrow text-accent">Com a Frankkia</p>
        <h2 className="type-title mt-3">O que você ganha.</h2>
        <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {p.recursos.map((r) => (
            <li key={r.t} className="flex gap-3">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-semibold">{r.t}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{r.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section {...aparecer} className="mt-20">
        <p className="type-eyebrow text-accent">Planos</p>
        <h2 className="type-title mt-3">{solo ? "Um plano, só para você." : "Do tamanho da sua equipe."}</h2>
        <div className={`mt-8 grid gap-4 ${solo ? "max-w-md" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          {planos.map((pl) => (
            <div key={pl.name} className={`flex flex-col rounded-[1.75rem] p-6 ${pl.highlight ? "bg-ink text-bg" : "border border-line"}`}>
              <p className="font-display text-lg font-semibold">{pl.name}</p>
              <p className={`text-sm ${pl.highlight ? "text-bg/70" : "text-muted"}`}>{pl.seats}</p>
              <p className="mt-5 font-display text-3xl font-semibold tracking-tight">
                <span className={`text-base ${pl.highlight ? "text-bg/60" : "text-muted"}`}>R$ </span>
                {pl.price}
                <span className={`text-base ${pl.highlight ? "text-bg/60" : "text-muted"}`}>/mês</span>
              </p>
              <p className={`mt-2 text-sm ${pl.highlight ? "text-bg/70" : "text-muted"}`}>{pl.anuncios}</p>
              <Link
                to={`/cadastro?plano=${encodeURIComponent(pl.name)}`}
                className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.98] ${
                  pl.highlight ? "bg-accent text-white hover:bg-accent-deep" : "border border-line-strong hover:bg-canvas"
                }`}
              >
                Testar grátis
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          7 dias grátis, sem cartão. No plano anual, 12 meses pelo preço de 10.{" "}
          <a href="/#planos" className="font-semibold text-accent">
            Ver todos os planos
          </a>
        </p>
      </motion.section>

      <motion.section {...aparecer} className="mt-20">
        <p className="type-eyebrow text-accent">Dúvidas</p>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {p.faq.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="font-display text-lg font-semibold tracking-tight">{f.q}</dt>
              <dd className="mt-1.5 leading-relaxed text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </motion.section>

      <motion.section {...aparecer} className="mt-20 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-ink p-8 text-bg sm:flex-row sm:items-center sm:p-10">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight">Quer ver por dentro?</p>
          <p className="mt-1.5 text-bg/70">Crie a conta e teste por 7 dias, ou fale com {contato.responsavel} pelo WhatsApp.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a href={zap} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-5 font-semibold transition hover:bg-white/10">
            <WhatsAppIcon className="size-5" /> WhatsApp
          </a>
          <Link to={cadastro} className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-white transition hover:bg-accent-deep active:scale-[0.98]">
            {p.cta.label}
          </Link>
        </div>
      </motion.section>
    </PaginaSimples>
  );
}
