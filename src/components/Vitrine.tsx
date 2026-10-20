import { motion } from "framer-motion";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Check,
  MapPin,
  Ruler,
  Search,
  UserRoundPlus,
} from "lucide-react";
import { vitrine } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { WhatsAppIcon } from "./WhatsAppIcon";

/** Mockup animado: anúncio no portal, prévia do link no WhatsApp e o contato chegando como lead. */
function MockAnuncio() {
  const entra = (delay: number, y = 24) => ({
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-15%" },
    transition: { duration: 0.9, delay, ease: EASE_OUT_EXPO },
  });
  return (
    <div className="relative mx-auto w-full max-w-[26rem] pb-20 pt-4 sm:pb-12">
      {/* Página do anúncio */}
      <motion.div
        {...entra(0, 40)}
        className="overflow-hidden rounded-[1.75rem] border border-line bg-bg shadow-lift"
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 rounded-full bg-line-strong" />
            ))}
          </span>
          <span className="flex flex-1 items-center gap-1.5 truncate rounded-full bg-canvas px-3 py-1 font-mono text-[0.625rem] text-muted">
            <Search className="size-3" /> frankkia.com/imovel/apartamento-3-quartos
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1">
          <div className="col-span-2 row-span-2 aspect-[4/3] rounded-l-2xl bg-gradient-to-br from-accent/80 via-accent-deep to-ink" />
          <div className="rounded-tr-2xl bg-gradient-to-br from-accent-soft to-accent/40" />
          <div className="rounded-br-2xl bg-gradient-to-br from-canvas-deep to-accent/30" />
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-center gap-2 text-[0.625rem]">
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">
              Venda
            </span>
            <span className="text-muted">
              Cód. <span className="font-mono font-semibold text-ink">FK-7Q4M2X</span>
            </span>
          </div>
          <p className="font-display text-base font-semibold tracking-tight">
            Apartamento com 3 quartos e varanda
          </p>
          <p className="flex items-center gap-1 text-[0.6875rem] text-muted">
            <MapPin className="size-3 text-accent" /> Umarizal, Belém - PA
          </p>
          <div className="flex gap-3 text-[0.6875rem] text-muted">
            <span className="flex items-center gap-1">
              <Ruler className="size-3" /> 98 m²
            </span>
            <span className="flex items-center gap-1">
              <BedDouble className="size-3" /> 3 quartos
            </span>
            <span className="flex items-center gap-1">
              <Bath className="size-3" /> 2
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="font-display text-xl font-semibold tracking-tight">R$ 680.000</p>
            <span className="flex items-center gap-1.5 rounded-full bg-[#25d366] px-3 py-1.5 text-[0.625rem] font-semibold text-white">
              <WhatsAppIcon className="size-3" /> WhatsApp
            </span>
          </div>
        </div>
      </motion.div>

      {/* Prévia do link no WhatsApp */}
      <motion.div
        {...entra(0.35)}
        className="absolute -left-2 bottom-0 w-[13.5rem] rounded-2xl bg-[#dcf8c6] p-1.5 shadow-float sm:-left-10 sm:-bottom-8"
      >
        <div className="overflow-hidden rounded-xl bg-white/70">
          <div className="h-14 bg-gradient-to-br from-accent/80 to-ink" />
          <div className="p-2">
            <p className="truncate text-[0.625rem] font-semibold text-ink">
              Apartamento com 3 quartos · R$ 680.000
            </p>
            <p className="text-[0.5625rem] text-muted">frankkia.com</p>
          </div>
        </div>
        <p className="px-1.5 pb-0.5 pt-1 text-[0.625rem] text-ink">
          Olha esse que separei pra você 👀
        </p>
      </motion.div>

      {/* Lead chegando no CRM */}
      <motion.div
        {...entra(0.7)}
        className="absolute -right-2 top-0 flex items-center gap-2.5 rounded-2xl border border-line bg-bg px-3 py-2.5 shadow-float sm:-right-8 sm:top-10"
      >
        <span className="grid size-8 place-items-center rounded-full bg-verified-soft text-verified">
          <UserRoundPlus className="size-4" />
        </span>
        <div>
          <p className="text-[0.6875rem] font-semibold">Novo lead pelo portal</p>
          <p className="text-[0.625rem] text-muted">Ana Souza · FK-7Q4M2X</p>
        </div>
      </motion.div>
    </div>
  );
}

/** "Seus imóveis na vitrine": o portal de imóveis como parte do que a imobiliária ganha ao assinar. */
export function Vitrine() {
  return (
    <section id="portal" className="pt-28 sm:pt-40">
      <div className="mx-auto grid w-full max-w-[70rem] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          >
            <p className="type-eyebrow text-accent">{vitrine.eyebrow}</p>
            <h2 className="type-title mt-3">{vitrine.title}</h2>
            <p className="mt-4 max-w-[30rem] text-muted">{vitrine.text}</p>
          </motion.header>
          <ul className="mt-8 space-y-4">
            {vitrine.items.map((it, i) => (
              <motion.li
                key={it.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: EASE_OUT_EXPO }}
                className="flex gap-3"
              >
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <div>
                  <p className="font-semibold">{it.title}</p>
                  <p className="text-sm text-muted">{it.text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT_EXPO }}
            href="/imoveis"
            className="group/button mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-[0.9375rem] font-semibold text-white transition hover:bg-accent-deep active:scale-[0.98]"
          >
            {vitrine.cta}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover/button:translate-x-0.5" />
          </motion.a>
        </div>
        <MockAnuncio />
      </div>
    </section>
  );
}
