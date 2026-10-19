import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { features } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Asterisk, Scaled } from "./ui";
import { FEATURE_SIZE, FeatureMock } from "./mockups/Features";

/** Texto gigante preso no meio da tela, deslizando na horizontal conforme a rolagem. */
function GiantMarquee({ text, target }: { text: string; target: React.RefObject<HTMLElement | null> }) {
  const { scrollYProgress } = useScroll({ target, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  return (
    <div className="pointer-events-none sticky top-[calc(50vh-6rem)] z-0 h-0 select-none">
      <div className="absolute left-1/2 top-0 w-screen -translate-x-1/2 overflow-hidden">
        <motion.p style={{ x }} className="type-giant flex items-center text-ink">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="flex items-center">
              {text}
              <Asterisk className="mx-[0.25em] size-[0.55em]" />
            </span>
          ))}
        </motion.p>
      </div>
    </div>
  );
}

function FeatureCard({ item, index }: { item: (typeof features.items)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  return (
    <motion.li
      initial={{ opacity: 0, y: 80, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      className={`sm:w-[72%] ${index % 2 ? "sm:ml-auto" : ""}`}
    >
      <div ref={ref} className="group relative overflow-hidden rounded-panel bg-canvas shadow-lift">
        <div className="transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.03]">
          <Scaled width={FEATURE_SIZE.width} height={FEATURE_SIZE.height}>
            <FeatureMock k={item.key} active={inView} />
          </Scaled>
        </div>
        <span className="absolute bottom-4 left-4 flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-full bg-ink/85 py-2 pl-4 pr-2 text-bg backdrop-blur-md">
          <span className="type-eyebrow truncate">
            {item.title}
            <span className="hidden sm:inline"> · {item.tag}</span>
          </span>
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 text-sm transition-transform duration-500 ease-out-expo group-hover:-rotate-45">
            <ArrowRight className="size-3.5" />
          </span>
        </span>
      </div>
      <div className="mt-5 flex items-baseline gap-4 rounded-2xl bg-bg/90 px-1 py-1 backdrop-blur-xs">
        <span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3 className="type-subtitle">{item.title}</h3>
          <p className="mt-1.5 max-w-[30rem] text-muted">{item.text}</p>
        </div>
      </div>
    </motion.li>
  );
}

export function Features() {
  const stage = useRef<HTMLDivElement>(null);
  return (
    <section id="funcoes" className="pt-28 sm:pt-40">
      <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="max-w-[44rem]"
        >
          <p className="type-eyebrow text-accent">{features.eyebrow}</p>
          <h2 className="type-title mt-3">{features.title}</h2>
        </motion.header>
      </div>

      <div ref={stage} className="relative mt-6 overflow-clip sm:mt-10">
        <GiantMarquee text={features.giant} target={stage} />
        <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
          <ul className="relative z-10 space-y-16 py-[12vh] sm:space-y-28">
            {features.items.map((it, i) => (
              <FeatureCard key={it.key} item={it} index={i} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
