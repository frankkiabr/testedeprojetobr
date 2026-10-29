import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ecosystem, hero } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Asterisk, Scaled } from "./ui";
import { Dashboard, DASHBOARD_SIZE } from "./mockups/Dashboard";

/** Máquina de escrever: digita, pausa, apaga e passa para a próxima frase. */
function useTypewriter(phrases: string[], start: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!start) return;
    let i = 0;
    let len = 0;
    let deleting = false;
    let timer: number;
    const tick = () => {
      const full = phrases[i % phrases.length];
      len += deleting ? -1 : 1;
      setText(full.slice(0, len));
      let delay = deleting ? 28 : 55;
      if (!deleting && len === full.length) {
        deleting = true;
        delay = 2000;
      } else if (deleting && len === 0) {
        deleting = false;
        i++;
        delay = 350;
      }
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, 200);
    return () => clearTimeout(timer);
  }, [phrases, start]);
  return text;
}

export function Word({ children, i }: { children: React.ReactNode; i: number }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.08em] align-top">
      <motion.span
        className="inline-block"
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: EASE_OUT_EXPO }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Underline() {
  return (
    <svg
      viewBox="0 0 240 20"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -bottom-[0.12em] left-[-2%] h-[0.22em] w-[104%] overflow-visible text-accent"
      aria-hidden
    >
      <motion.path
        d="M3 12C40 3 70 4 98 11s58 8 84 1 44-6 55-2"
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: 0.8, ease: EASE_OUT_EXPO }}
      />
    </svg>
  );
}

export function Hero() {
  const [ready, setReady] = useState(false);
  const typed = useTypewriter(hero.typed, ready);
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame, { once: true, margin: "-10%" });
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "start 0.25"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1100);
    return () => clearTimeout(id);
  }, []);

  return (
    <section id="top" className="pt-36 sm:pt-44">
      <div className="mx-auto w-full max-w-[60rem] px-5 text-center sm:px-8">
        <h1 className="type-hero">
          {hero.title.map((w, i) =>
            i === hero.highlight ? (
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
          transition={{ duration: 0.8, delay: 0.7, ease: EASE_OUT_EXPO }}
          className="mx-auto mt-8 min-h-[5.25rem] max-w-[36rem] text-base leading-relaxed text-muted sm:min-h-[3.5rem] sm:text-lg"
        >
          {hero.lead}{" "}
          <span className="font-medium text-ink">
            {typed}
            <span className="animate-blink font-light text-accent">|</span>
          </span>
        </motion.p>

      </div>

      {/* Painel demonstrativo */}
      <div className="mx-auto mt-14 w-full max-w-[72rem] px-4 sm:mt-20 sm:px-8 [perspective:1600px]">
        <motion.div
          ref={frame}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.9, ease: EASE_OUT_EXPO }}
          style={{ rotateX, scale, transformOrigin: "50% 0%" }}
          className="rounded-[20px] bg-linear-to-b from-accent-soft to-canvas p-1.5 shadow-lift ring-1 ring-line sm:rounded-[34px] sm:p-3"
        >
          <Scaled width={DASHBOARD_SIZE.width} height={DASHBOARD_SIZE.height} className="rounded-[16px] sm:rounded-[26px]">
            <Dashboard active={inView} />
          </Scaled>
        </motion.div>
        <p className="mt-4 text-center text-xs text-subtle">Interface demonstrativa com dados ilustrativos.</p>
      </div>

      <FaixaModulos />
    </section>
  );
}

/** Faixa infinita com os módulos da plataforma (home e páginas por público). */
export function FaixaModulos() {
  const chips = [...ecosystem.modules, ...ecosystem.modules, ...ecosystem.modules, ...ecosystem.modules];
  return (
    <>
      {/* Faixa infinita com os módulos */}
      <div className="mt-10 sm:mt-14">
        <div className="group relative overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <ul className="flex w-max animate-marquee items-center gap-5 pr-5 [animation-duration:45s] group-hover:[animation-play-state:paused] sm:gap-6 sm:pr-6">
            {chips.map(({ name, icon: Icon }, i) => (
              <li key={i} aria-hidden={i >= ecosystem.modules.length} className="flex items-center gap-5 sm:gap-6">
                <span className="inline-flex h-14 items-center gap-3 rounded-full border border-line-strong bg-bg pl-2 pr-6 font-display text-lg font-medium tracking-tight shadow-soft">
                  <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
                    <Icon className="size-5" />
                  </span>
                  {name}
                </span>
                <Asterisk className="size-5" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
