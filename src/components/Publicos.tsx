import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { publicos } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";

const ICONES = [Building2, UserRound];

/** Logo abaixo do topo da home: leva cada visitante à página do seu caso (imobiliária ou corretor autônomo). */
export function Publicos() {
  const s = publicos.seletor;
  return (
    <section id="para-quem" className="pt-24 sm:pt-32">
      <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        >
          <p className="type-eyebrow text-accent">{s.eyebrow}</p>
          <h2 className="type-title mt-3">{s.title}</h2>
        </motion.div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {s.cards.map((c, i) => {
            const Icone = ICONES[i];
            return (
              <motion.div
                key={c.to}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8, delay: 0.08 * i, ease: EASE_OUT_EXPO }}
              >
                <Link
                  to={c.to}
                  className={`group flex h-full flex-col rounded-[2rem] p-7 transition-shadow hover:shadow-lift sm:p-8 ${i === 0 ? "bg-ink text-bg" : "border border-line bg-canvas/60"}`}
                >
                  <span className={`grid size-12 place-items-center rounded-2xl ${i === 0 ? "bg-white/10 text-white" : "bg-bg text-accent shadow-soft"}`}>
                    <Icone className="size-6" />
                  </span>
                  <p className="mt-6 font-display text-2xl font-semibold tracking-tight">{c.titulo}</p>
                  <p className={`mt-2 leading-relaxed ${i === 0 ? "text-bg/70" : "text-muted"}`}>{c.texto}</p>
                  <span className={`mt-6 inline-flex items-center gap-2 font-semibold ${i === 0 ? "text-white" : "text-accent"}`}>
                    Ver como funciona <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
