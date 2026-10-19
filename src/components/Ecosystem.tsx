import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { ecosystem, type Module, type Pill, type Segment } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { LogoMark } from "./ui";

type Token = { word: string } | Pill;

function tokenize(segments: Segment[]): Token[] {
  return segments.flatMap<Token>((s) =>
    typeof s === "string" ? s.split(/\s+/).filter(Boolean).map((word) => ({ word })) : [s],
  );
}

/** Cada palavra sai do cinza claro para a cor da tinta conforme a rolagem. */
function RevealWord({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block">
      {children}
    </motion.span>
  );
}

function PillIcon({ kind, progress, range }: { kind: Pill["pill"]; progress: MotionValue<number>; range: [number, number] }) {
  const scale = useTransform(progress, range, [0.4, 1]);
  const opacity = useTransform(progress, range, [0, 1]);
  const inner = {
    logo: <LogoMark className="size-full text-[0.55em]" />,
    arrow: (
      <span className="grid size-full place-items-center rounded-full bg-ink text-bg">
        <ArrowRight className="size-[0.5em]" strokeWidth={2.5} />
      </span>
    ),
    modules: (
      <span className="flex size-full items-center justify-center gap-[0.04em] rounded-full bg-bg">
        {["#2f5bea", "#0f1a33", "#8fa9ff"].map((c) => (
          <span key={c} className="size-[0.16em] rounded-full" style={{ background: c }} />
        ))}
      </span>
    ),
    chart: (
      <span className="grid size-full place-items-center rounded-full bg-accent-soft text-accent">
        <TrendingUp className="size-[0.5em]" strokeWidth={2.5} />
      </span>
    ),
  }[kind];
  return (
    <span className="mx-[0.04em] inline-flex h-[0.86em] -translate-y-[0.05em] align-middle">
      <motion.span style={{ scale, opacity }} className="block aspect-square h-full rounded-full shadow-pill">
        {inner}
      </motion.span>
    </span>
  );
}

function ModuleList({ modules }: { modules: Module[] }) {
  return (
    <div className="relative isolate">
      <ul>
        {modules.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.li
              key={m.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: EASE_OUT_EXPO }}
              className="border-t border-line last:border-b"
            >
              <div
                className="group relative isolate grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 py-5 sm:gap-8 sm:py-7"
              >
                <span className="absolute inset-0 -z-10 origin-bottom scale-y-0 rounded-2xl bg-canvas transition-transform duration-500 ease-out-expo group-hover:scale-y-100" />
                <span className="flex items-center">
                  <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent sm:hidden">
                    <Icon className="size-5" />
                  </span>
                  <span className="hidden w-10 pl-3 font-mono text-xs text-muted sm:block">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="type-index block truncate transition-transform duration-500 ease-out-expo group-hover:translate-x-2">
                  {m.name}
                </span>
                <span className="flex items-center gap-6 pr-1 sm:pr-3">
                  <span className="hidden font-mono text-xs text-muted sm:block">Frankkia {m.name}</span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong transition-[background-color,color,border-color] duration-500 ease-out-expo group-hover:border-accent group-hover:bg-accent group-hover:text-white">
                    <Icon className="size-[1.1rem]" />
                  </span>
                </span>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

export function Ecosystem() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const tokens = tokenize(ecosystem.statement);
  const n = tokens.length;

  return (
    <section id="ecossistema" className="pt-28 sm:pt-40">
      <div className="mx-auto w-full max-w-[78rem] px-5 sm:px-8">
        <h2 className="type-eyebrow text-center text-accent">{ecosystem.eyebrow}</h2>
        <p ref={ref} className="type-statement mt-6 text-center">
          {tokens.map((tok, i) => {
            const range: [number, number] = [i / n, Math.min(1, (i + 1.5) / n)];
            return (
              <span key={i}>
                {"word" in tok ? (
                  <RevealWord progress={scrollYProgress} range={range}>
                    {tok.word}
                  </RevealWord>
                ) : (
                  <PillIcon kind={tok.pill} progress={scrollYProgress} range={range} />
                )}{" "}
              </span>
            );
          })}
        </p>
      </div>

      <div className="mx-auto mt-20 w-full max-w-[70rem] px-5 sm:mt-28 sm:px-8">
        <h3 className="type-eyebrow mb-6 text-accent sm:mb-8">{ecosystem.listTitle}</h3>
        <ModuleList modules={ecosystem.modules} />
      </div>
    </section>
  );
}
