import { useEffect, useLayoutEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from "react";
import { animate } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/scroll";

/** Botão em pílula usado no hero, na navegação, nos planos e no rodapé. */
export function Button({
  variant = "dark",
  size = "lg",
  icon,
  trailing,
  children,
  className = "",
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "dark" | "light" | "outline" | "ghost" | "accent";
  size?: "sm" | "lg";
  icon?: ReactNode;
  trailing?: ReactNode;
}) {
  const variants = {
    dark: "bg-ink text-bg hover:bg-ink/85",
    light: "bg-bg text-ink hover:bg-bg/90",
    accent: "bg-accent text-white hover:bg-accent-deep",
    outline: "border border-line-strong bg-bg text-ink hover:border-ink/30 hover:bg-canvas",
    ghost: "text-bg hover:bg-bg/15",
  };
  const sizes = { sm: "h-9 px-4 text-sm", lg: "h-12 px-6 text-[0.9375rem]" };
  return (
    <a
      className={`group/button inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon && <span className="text-[1.15em]">{icon}</span>}
      <span>{children}</span>
      {trailing && <span className="text-[1.1em] transition-transform duration-200">{trailing}</span>}
    </a>
  );
}

/** Marca escrita: "frankkia" (sem ponto). */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      frankkia
    </span>
  );
}

/** Símbolo redondo com o "f". */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent font-display font-bold leading-none text-white ${className}`}
    >
      f
    </span>
  );
}

/**
 * Desenha o conteúdo num tamanho fixo (width × height) e o escala para caber na largura disponível.
 * Assim os mockups ficam idênticos em qualquer tela.
 */
export function Scaled({ width, height, children, className = "" }: { width: number; height: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current!;
    setScale(el.clientWidth / width);
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={ref} className={`relative w-full overflow-hidden ${className}`} style={{ height: height * scale }}>
      <div className="absolute left-0 top-0" style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

/** Número que conta do zero até o valor quando `start` vira true. */
export function CountUp({
  to,
  start,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  to: number;
  start: boolean;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    const c = animate(0, to, { duration: 1.6, ease: EASE_OUT_EXPO, onUpdate: setV });
    return () => c.stop();
  }, [start, to]);
  return (
    <>
      {prefix}
      {v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
}

export function Asterisk({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`inline-block text-accent ${className}`} aria-hidden>
      <path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
