import { motion } from "framer-motion";
import { BarChart3, Check, Headset, Megaphone, SearchCheck } from "lucide-react";
import { blocos } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";

const ICONES = [Headset, SearchCheck, Megaphone, BarChart3];

/** "Tudo incluso": as funções da Frankkia em 4 blocos, sem cara de produtos vendidos à parte. */
export function Blocos() {
  return (
    <section id="tudo-incluso" className="pt-28 sm:pt-40">
      <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="max-w-[44rem]"
        >
          <p className="type-eyebrow text-accent">{blocos.eyebrow}</p>
          <h2 className="type-title mt-3">{blocos.title}</h2>
          <p className="mt-4 text-muted">{blocos.text}</p>
        </motion.header>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {blocos.items.map((b, i) => {
            const Icone = ICONES[i];
            return (
              <motion.li
                key={b.titulo}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: EASE_OUT_EXPO }}
                className="rounded-panel bg-canvas p-6"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-accent text-white">
                  <Icone className="size-5" />
                </span>
                <h3 className="type-subtitle mt-5">{b.titulo}</h3>
                <ul className="mt-4 space-y-2.5">
                  {b.itens.map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      {t}
                    </li>
                  ))}
                </ul>
              </motion.li>
            );
          })}
        </ul>

        <p className="mt-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent">
            <Check className="size-4" /> {blocos.selo}
          </span>
        </p>
      </div>
    </section>
  );
}
