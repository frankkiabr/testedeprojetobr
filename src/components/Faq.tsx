import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { faq, site } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";

/** Perguntas frequentes: a primeira já vem aberta; + abre e vira X para fechar. Sem itens, usa as da home. */
export function Faq({ itens = faq.items, className = "pt-28 sm:pt-40" }: { itens?: readonly { q: string; a: string }[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="duvidas" className={className}>
      <div className="mx-auto grid w-full max-w-[70rem] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-16">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <p className="type-eyebrow text-accent">{faq.eyebrow}</p>
          <h2 className="type-title mt-3">{faq.title}</h2>
          <p className="mt-4 text-muted">
            {faq.text}{" "}
            <a href={`mailto:${site.email}`} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              {site.email}
            </a>
            .
          </p>
        </motion.header>

        <ul>
          {itens.map((it, i) => {
            const isOpen = open === i;
            return (
              <motion.li
                key={it.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: EASE_OUT_EXPO }}
                className="border-t border-line last:border-b"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="font-display text-lg font-medium tracking-tight transition-colors group-hover:text-accent sm:text-xl">
                    {it.q}
                  </span>
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color,rotate] duration-500 ease-out-expo ${
                      isOpen ? "rotate-45 border-ink bg-ink text-bg" : "border-line-strong"
                    }`}
                  >
                    <Plus className="size-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[40rem] pb-7 pr-14 leading-relaxed text-muted">{it.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
