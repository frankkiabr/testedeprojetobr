import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
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
  const box = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Module | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 30 });
  const sy = useSpring(y, { stiffness: 260, damping: 30 });

  const onMove = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  return (
    <div ref={box} className="relative isolate" onPointerMove={onMove} onPointerLeave={() => setHovered(null)}>
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
                onPointerEnter={() => setHovered(m)}
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

      {/* Prévia que segue o cursor */}
      <motion.div style={{ x: sx, y: sy }} className="pointer-events-none absolute left-0 top-0 z-10 hidden [@media(pointer:fine)]:block">
        <AnimatePresence>
          {hovered && (
            <motion.div
              key="preview"
              initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0, rotate: 6 }}
              transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
              className="-ml-28 -mt-24 h-48 w-56 overflow-hidden rounded-3xl bg-ink shadow-lift"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={hovered.name}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-100%" }}
                  transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                  className="relative flex size-full flex-col justify-between p-5 text-white"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_85%_10%,#2f5bea_0%,transparent_70%)]" />
                  <span className="relative grid size-12 place-items-center rounded-2xl bg-white/15">
                    <hovered.icon className="size-6" />
                  </span>
                  <span className="relative">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">Frankkia</span>
                    <span className="font-display text-2xl font-semibold tracking-tight">{hovered.name}</span>
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
