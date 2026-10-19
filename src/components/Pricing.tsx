import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { pricing } from "@/content";
import { useNavigate } from "react-router-dom";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Button } from "./ui";

export function Pricing() {
  const navigate = useNavigate();
  return (
    <section id="planos" className="pt-28 sm:pt-40">
      <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="mx-auto max-w-[44rem] text-center"
        >
          <p className="type-eyebrow text-accent">{pricing.eyebrow}</p>
          <h2 className="type-title mt-3">{pricing.title}</h2>
          <p className="mx-auto mt-4 max-w-[34rem] text-muted sm:text-lg">{pricing.text}</p>
        </motion.header>

        <ul className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-3">
          {pricing.plans.map((p, i) => {
            const dark = !!p.highlight;
            return (
              <motion.li
                key={p.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.9, delay: i * 0.1, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -6 }}
                className={`relative flex flex-col overflow-hidden rounded-[2rem] p-7 sm:p-8 ${
                  dark ? "bg-ink text-bg shadow-lift" : "border border-line bg-bg"
                }`}
              >
                {dark && (
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,rgb(47_91_234/0.45),transparent_70%)]" />
                )}
                <div className="relative">
                  <p className="type-subtitle">{p.name}</p>
                  <p className={`mt-2 flex items-center gap-2 text-sm ${dark ? "text-bg/65" : "text-muted"}`}>
                    <Users className="size-4" />
                    {p.seats}
                  </p>
                  <p className="mt-8 flex items-start gap-1.5">
                    <span className={`mt-2 text-lg font-medium ${dark ? "text-bg/70" : "text-muted"}`}>R$</span>
                    <span className="font-display text-[3.5rem] font-medium leading-none tracking-[-0.04em]">{p.price}</span>
                    <span className={`mt-auto pb-1.5 text-sm ${dark ? "text-bg/60" : "text-muted"}`}>/mês</span>
                  </p>
                  <div className={`my-8 h-px ${dark ? "bg-white/10" : "bg-line"}`} />
                  <Button
                    href={`/apresentacao?equipe=${encodeURIComponent(p.seats)}`}
                    variant={dark ? "accent" : "outline"}
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      // Já chega na página de captura com o tamanho de equipe deste plano escolhido
                      navigate(`/apresentacao?equipe=${encodeURIComponent(p.seats)}`);
                    }}
                    trailing={<ArrowRight className="size-[1em] group-hover/button:translate-x-0.5" />}
                  >
                    {pricing.cta}
                  </Button>
                </div>
              </motion.li>
            );
          })}
        </ul>
        <p className="mt-6 text-center text-xs text-subtle">{pricing.note}</p>
      </div>
    </section>
  );
}
