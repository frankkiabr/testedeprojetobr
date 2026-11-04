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

/**
 * Marca escrita: "Frankkia" (F maiúsculo, sem ponto). Com `icone`, a casa com brilho vem logo à esquerda do nome,
 * na mesma proporção do menu da home (casa 18 px, espaço 6 px, nome 16 px). Menus superiores usam `text-base`.
 */
/** Logotipo: símbolo (balão com "Fr") + nome "Frankkia" no desenho oficial (public/marca/nova). O nome segue a cor do texto. */
export function Logo({ className = "", icone, animado }: { className?: string; icone?: CorIcone; animado?: AnimacaoIcone }) {
  return (
    <span className={`inline-flex items-center gap-[0.4em] font-display font-semibold tracking-tight ${className}`}>
      {icone && <IconeMarca cor={icone} animado={animado} className="size-[1.2em]" />}
      <span
        role="img"
        aria-label="Frankkia"
        className="inline-block h-[0.8em] w-[3.875em] bg-current"
        style={{ WebkitMask: NOME_MASCARA, mask: NOME_MASCARA }}
      />
    </span>
  );
}
const NOME_MASCARA = "url(/marca/nova/nome-escuro.webp) center / contain no-repeat";

/** Balão com o "Fr" vazado (mesmo desenho de public/marca/nova). */
const BALAO =
  "M259 10H1741Q1961 10 1961 230V1489Q1961 1709 1741 1709H1339L1150 1862Q1000 1975 850 1862L658 1709H259Q39 1709 39 1489V230Q39 10 259 10Z";
const LETRAS_FR =
  "M475 466H1123V662H700V801H1082V986H700V1275H475Z M1160 650H1378V775C1420 690 1490 640 1577 640V870C1460 870 1378 920 1378 1081V1275H1160Z";

type CorIcone = "azul" | "escuro" | "branco";
/** true = sem animação contínua (mantido por compatibilidade); "carregando" = pulsa, para telas de espera. */
type AnimacaoIcone = boolean | "carregando";
const COR_ICONE: Record<CorIcone, string> = { azul: "text-accent", escuro: "text-ink", branco: "text-white" };

/** Ícone da marca: balão de fala com "Fr" vazado. Toma a cor do texto (azul, escuro ou branco). */
export function IconeMarca({ cor = "azul", animado = false, className = "" }: { cor?: CorIcone; animado?: AnimacaoIcone; className?: string }) {
  return (
    <svg
      viewBox="0 0 2000 1936"
      className={`shrink-0 ${COR_ICONE[cor]} ${animado === "carregando" ? "animate-pulse" : ""} ${className}`}
      aria-hidden="true"
    >
      <path fill="currentColor" fillRule="evenodd" d={`${BALAO} ${LETRAS_FR}`} />
    </svg>
  );
}

/** Marca d'água das fotos do anúncio: balão branco com "Fr" vazado, no centro e meio transparente. Vai dentro de um pai `relative`. */
export function MarcaDagua({ className = "w-[16%]" }: { className?: string }) {
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
      <IconeMarca cor="branco" className={`aspect-square h-auto max-w-28 opacity-60 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] ${className}`} />
    </span>
  );
}

/** Símbolo da marca em azul (balão com "Fr"). */
export function LogoMark({ className = "" }: { className?: string }) {
  return <IconeMarca cor="azul" className={className} />;
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
