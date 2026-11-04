import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { ecosystem, type Pill, type Segment } from "@/content";
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

    </section>
  );
}
