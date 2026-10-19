import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUp, LogIn } from "lucide-react";
import { nav, site } from "@/content";
import { EASE_OUT_EXPO, scrollToId } from "@/lib/scroll";
import { Logo, LogoMark } from "./ui";

const SECTIONS = ["top", ...nav.map((n) => n.id), "contato"];
const LABELS: Record<string, string> = {
  top: site.name,
  contato: "Demonstração",
  ...Object.fromEntries(nav.map((n) => [n.id, n.label])),
};

function useActiveSection() {
  const [active, setActive] = useState("top");
  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

/** Cantos côncavos que fazem a "ilha" parecer pendurada no topo da tela. */
function Corner({ side }: { side: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`absolute top-0 size-4 text-ink ${side === "left" ? "-left-4" : "-right-4 -scale-x-100"}`}
      aria-hidden
    >
      <path d="M0 0h16v16C16 7.163 8.837 0 0 0Z" fill="currentColor" />
    </svg>
  );
}

export function Navbar() {
  const active = useActiveSection();
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState(false);
  const [desktop, setDesktop] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    const mq = window.matchMedia("(min-width: 56rem)");
    const onMq = () => setDesktop(mq.matches);
    onScroll();
    onMq();
    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const expanded = desktop && (!scrolled || hover);
  const idx = SECTIONS.indexOf(active);
  const next = idx === SECTIONS.length - 1 ? "top" : SECTIONS[idx + 1];

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
      <motion.nav
        layout
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        onHoverStart={() => setHover(true)}
        onHoverEnd={() => setHover(false)}
        className="pointer-events-auto relative bg-ink text-bg shadow-float"
        style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
      >
        <Corner side="left" />
        <Corner side="right" />
        <AnimatePresence mode="popLayout" initial={false}>
          {expanded ? (
            <motion.div
              key="full"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.3 }}
              className="flex h-14 items-center gap-9 pl-2.5 pr-2"
            >
              <a href="#top" onClick={go("top")} className="flex items-center gap-2.5 rounded-full">
                <span className="inline-flex rounded-full ring-1 ring-white/15">
                  <LogoMark className="size-8 text-base" />
                </span>
                <Logo className="whitespace-nowrap text-[1.0625rem]" />
              </a>
              <ul className="flex items-center gap-7">
                {nav.map(({ id, label }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={go(id)}
                      className={`relative py-1 text-sm font-medium transition-colors duration-200 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:text-bg hover:after:scale-x-100 ${
                        active === id ? "text-bg after:scale-x-100" : "text-bg/60"
                      }`}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-1">
                <Link to="/login" className="rounded-full px-3.5 py-2 text-sm font-medium text-bg/70 transition-colors hover:bg-bg/15 hover:text-bg">
                  Entrar
                </Link>
                <a
                  href="#contato"
                  onClick={go("contato")}
                  className="group/button inline-flex h-10 items-center gap-2 rounded-full bg-bg px-4 text-sm font-semibold text-ink transition-transform active:scale-[0.98]"
                >
                  Solicitar demonstração
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover/button:translate-x-0.5" />
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="compact"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.3 }}
              className="flex h-12 items-center gap-3 pl-2 pr-2"
            >
              <LogoMark className="size-7 text-sm" />
              <motion.span
                key={active}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="min-w-[5.5rem] font-display text-sm font-semibold tracking-tight"
              >
                {LABELS[active]}
              </motion.span>
              {!desktop && (
                <Link to="/login" aria-label="Entrar" className="grid size-8 place-items-center rounded-full text-bg/70 hover:bg-bg/15 hover:text-bg">
                  <LogIn className="size-4" />
                </Link>
              )}
              <a
                href={`#${next}`}
                onClick={go(next)}
                aria-label={LABELS[next]}
                className="grid size-8 place-items-center rounded-full bg-bg text-ink transition-transform hover:scale-105"
              >
                {next === "top" ? <ArrowUp className="size-4" /> : <ArrowRight className="size-4" />}
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
}
