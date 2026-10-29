import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { contato, pricing, publicos } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { linkWhatsApp } from "@/lib/whatsapp";
import { PaginaSimples } from "@/components/PaginaSimples";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { FaixaModulos, Underline, Word } from "@/components/Hero";
import { Faq } from "@/components/Faq";
import { Scaled } from "@/components/ui";
import { Dashboard, DASHBOARD_SIZE } from "@/components/mockups/Dashboard";
import { FEATURE_SIZE, FeatureMock } from "@/components/mockups/Features";

const aparecer = (i = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-8%" },
  transition: { duration: 0.8, delay: i * 0.06, ease: EASE_OUT_EXPO },
});

/** Painel demonstrativo inclinado que se endireita com a rolagem (igual ao da home). */
function Painel({ corretor }: { corretor: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame, { once: true, margin: "-10%" });
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "start 0.25"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const tam = corretor ? FEATURE_SIZE : DASHBOARD_SIZE;
  return (
    <div className={`mx-auto mt-14 w-full px-4 sm:mt-20 sm:px-8 [perspective:1600px] ${corretor ? "max-w-[52rem]" : "max-w-[72rem]"}`}>
      <motion.div
        ref={frame}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.9, ease: EASE_OUT_EXPO }}
        style={{ rotateX, scale, transformOrigin: "50% 0%" }}
        className="rounded-[20px] bg-linear-to-b from-accent-soft to-canvas p-1.5 shadow-lift ring-1 ring-line sm:rounded-[34px] sm:p-3"
      >
        <Scaled width={tam.width} height={tam.height} className="rounded-[16px] sm:rounded-[26px]">
          {corretor ? <FeatureMock k="leads" active={inView} /> : <Dashboard active={inView} />}
        </Scaled>
      </motion.div>
      <p className="mt-4 text-center text-xs text-subtle">Interface demonstrativa com dados ilustrativos.</p>
    </div>
  );
}

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
  const palavras = p.title.split(" ");

  return (
    <PaginaSimples titulo={p.titulo} largura="max-w-5xl" livre>
      {/* Banner: título palavra por palavra, chamada e o painel demonstrativo */}
      <section className="pt-16 sm:pt-24">
        <div className="mx-auto w-full max-w-[60rem] px-5 text-center sm:px-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="inline-flex rounded-full bg-accent-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent"
          >
            {p.eyebrow}
          </motion.p>
          <h1 className="type-hero mt-6">
            {palavras.map((w, i) =>
              i === p.destaque ? (
                <span key={i}>
                  <span className="relative inline-block">
                    <Word i={i}>{w}</Word>
                    <Underline />
                  </span>{" "}
                </span>
              ) : (
                <span key={i}>
                  <Word i={i}>{w}</Word>{" "}
                </span>
              ),
            )}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT_EXPO }}
            className="mx-auto mt-8 max-w-[38rem] text-base leading-relaxed text-muted sm:text-lg"
          >
            {p.text}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease: EASE_OUT_EXPO }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Link
              to={cadastro}
              className="group/button inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-white transition-[background-color,transform] hover:bg-accent-deep active:scale-[0.98]"
            >
              {p.cta.label} <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
            </Link>
            <a href={zap} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong px-6 font-semibold transition hover:bg-canvas">
              <WhatsAppIcon className="size-5 text-[#25d366]" /> Falar no WhatsApp
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9, ease: EASE_OUT_EXPO }}
            className="mt-4 text-sm text-muted"
          >
            {solo
              ? "Plano Solo · 7 dias grátis, sem cartão. A conta fica pronta na hora."
              : `Teste imediato nos planos ${pricing.plans.filter((x) => !pricing.conversa.includes(x.name)).map((x) => x.name).join(" e ")} · 7 dias grátis, sem cartão.`}
          </motion.p>
        </div>
        <Painel corretor={solo} />
        <FaixaModulos />
      </section>

      <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
        <section className="pt-24 sm:pt-32">
          <motion.div {...aparecer()}>
            <p className="type-eyebrow text-accent">Hoje</p>
            <h2 className="type-title mt-3">O que atrapalha.</h2>
          </motion.div>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {p.dores.map((d, i) => (
              <motion.li key={d.t} {...aparecer(i + 1)} className="rounded-[1.75rem] bg-ink p-6 text-bg shadow-lift">
                <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-rose-300">
                  <X className="size-5" />
                </span>
                <p className="mt-5 font-display text-lg font-semibold tracking-tight">{d.t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-bg/70">{d.d}</p>
              </motion.li>
            ))}
          </ul>
        </section>

        <section className="pt-24 sm:pt-32">
          <motion.div {...aparecer()}>
            <p className="type-eyebrow text-accent">Com a Frankkia</p>
            <h2 className="type-title mt-3">O que você ganha.</h2>
          </motion.div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {p.recursos.map((r, i) => (
              <motion.li key={r.t} {...aparecer(i % 2)} className="flex gap-4 rounded-[1.75rem] border border-line p-5 transition-shadow hover:shadow-soft">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <Check className="size-5" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight">{r.t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{r.d}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>

        <section className="pt-24 sm:pt-32">
          <motion.div {...aparecer()}>
            <p className="type-eyebrow text-accent">Planos</p>
            <h2 className="type-title mt-3">{solo ? "Um plano, só para você." : "Do tamanho da sua equipe."}</h2>
          </motion.div>
          <div className={`mt-8 grid gap-4 ${solo ? "max-w-md" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
            {planos.map((pl, i) => (
              <motion.div
                key={pl.name}
                {...aparecer(i)}
                className={`flex flex-col rounded-[1.75rem] p-6 transition-transform hover:-translate-y-1 ${pl.highlight ? "bg-ink text-bg shadow-lift" : "border border-line"}`}
              >
                <p className="font-display text-lg font-semibold">{pl.name}</p>
                <p className={`text-sm ${pl.highlight ? "text-bg/70" : "text-muted"}`}>{pl.seats}</p>
                <p className="mt-5 font-display text-3xl font-semibold tracking-tight">
                  <span className={`text-base ${pl.highlight ? "text-bg/60" : "text-muted"}`}>R$ </span>
                  {pl.price}
                  <span className={`text-base ${pl.highlight ? "text-bg/60" : "text-muted"}`}>/mês</span>
                </p>
                <p className={`mt-2 text-sm ${pl.highlight ? "text-bg/70" : "text-muted"}`}>{pl.anuncios}</p>
                <span className="flex-1" />
                {pricing.conversa.includes(pl.name) ? (
                  <>
                    <a
                      href={linkWhatsApp(`Olá, ${contato.primeiroNome}! Quero conhecer o plano ${pl.name} da Frankkia.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.98] ${
                        pl.highlight ? "bg-accent text-white hover:bg-accent-deep" : "border border-line-strong hover:bg-canvas"
                      }`}
                    >
                      <WhatsAppIcon className="size-4" /> {pricing.ctaConversa}
                    </a>
                    <Link to={`/cadastro?plano=${encodeURIComponent(pl.name)}`} className={`mt-3 text-center text-xs underline-offset-4 hover:underline ${pl.highlight ? "text-bg/60" : "text-muted"}`}>
                      ou comece um teste grátis
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/cadastro?plano=${encodeURIComponent(pl.name)}`}
                      className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.98] ${
                        pl.highlight ? "bg-accent text-white hover:bg-accent-deep" : "border border-line-strong hover:bg-canvas"
                      }`}
                    >
                      Testar grátis por 7 dias
                    </Link>
                    <p className={`mt-3 text-center text-xs ${pl.highlight ? "text-bg/60" : "text-muted"}`}>Começa na hora, sem cartão</p>
                  </>
                )}
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            {solo
              ? "7 dias grátis, sem cartão: a conta fica pronta na hora."
              : `Teste grátis imediato de 7 dias, sem cartão, nos planos ${pricing.plans.filter((x) => !pricing.conversa.includes(x.name)).map((x) => x.name).join(" e ")}. Para ${pricing.conversa.join(" e ")}, a gente conversa antes para preparar a sua equipe.`}{" "}
            No plano anual, 12 meses pelo preço de 10.{" "}
            <a href="/#planos" className="font-semibold text-accent">
              Ver todos os planos
            </a>
          </p>
        </section>
      </div>

      <Faq itens={p.faq} />

      <div className="mx-auto w-full max-w-[70rem] px-5 pt-24 sm:px-8 sm:pt-32">
        <motion.section {...aparecer()} className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-ink p-8 text-bg sm:flex-row sm:items-center sm:p-10">
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
      </div>
    </PaginaSimples>
  );
}
