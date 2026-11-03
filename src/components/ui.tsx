import { useEffect, useId, useLayoutEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from "react";
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

/**
 * Marca escrita: "Frankkia" (F maiúsculo, sem ponto). Com `icone`, a casa com brilho vem logo à esquerda do nome,
 * na mesma proporção do menu da home (casa 18 px, espaço 6 px, nome 16 px). Menus superiores usam `text-base`.
 */
export function Logo({ className = "", icone, animado }: { className?: string; icone?: CorIcone; animado?: AnimacaoIcone }) {
  return (
    <span className={`inline-flex items-center gap-[0.375em] font-display font-semibold tracking-tight ${className}`}>
      {icone && <IconeMarca cor={icone} animado={animado} className="size-[1.125em]" />}
      Frankkia
    </span>
  );
}

const CASA = "512,268 770,480 770,780 254,780 254,480";
const BRILHO = "M512 400 Q524 528 648 548 Q524 568 512 696 Q500 568 376 548 Q500 528 512 400 Z";

type CorIcone = "azul" | "escuro" | "branco";
/** true = o brilho pisca e gira a cada 4 s (animação padrão); "carregando" = sem parar, para telas de espera. */
type AnimacaoIcone = boolean | "carregando";
const COR_ICONE: Record<CorIcone, string> = { azul: "text-accent", escuro: "text-ink", branco: "text-white" };

/** Ícone da marca: casa com o brilho vazado (mesmo desenho de public/marca, versões "brilho-vazado"). */
export function IconeMarca({ cor = "azul", animado = false, className = "" }: { cor?: CorIcone; animado?: AnimacaoIcone; className?: string }) {
  const mascara = `brilho-${useId().replace(/:/g, "")}`;
  const animacao = animado === "carregando" ? "marca-brilho-carregando" : animado ? "marca-brilho" : undefined;
  return (
    <svg viewBox="174 186 676 676" className={`shrink-0 ${COR_ICONE[cor]} ${className}`} aria-hidden="true" strokeLinejoin="round">
      <mask id={mascara} maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
        <rect width="1024" height="1024" fill="#fff" />
        <path d={BRILHO} fill="#000" stroke="#000" strokeWidth="22" className={animacao} />
      </mask>
      <polygon points={CASA} fill="currentColor" stroke="currentColor" strokeWidth="160" mask={`url(#${mascara})`} />
    </svg>
  );
}

/** Marca d'água das fotos do anúncio: casa branca com brilho vazado, no centro e meio transparente. Vai dentro de um pai `relative`. */
export function MarcaDagua({ className = "w-[16%]" }: { className?: string }) {
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
      <IconeMarca cor="branco" className={`aspect-square h-auto max-w-28 opacity-60 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] ${className}`} />
    </span>
  );
}

/** Símbolo redondo com a casa e o brilho (mesmo desenho de public/marca). */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent font-display font-bold leading-none text-white ${className}`}
    >
      <svg viewBox="174 186 676 676" className="size-[60%] text-accent" aria-hidden="true" strokeLinejoin="round">
        <polygon points={CASA} fill="#fff" stroke="#fff" strokeWidth="160" />
        <path d={BRILHO} fill="currentColor" stroke="currentColor" strokeWidth="22" />
      </svg>
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
