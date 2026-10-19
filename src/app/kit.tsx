/** Peças visuais reutilizadas em todas as telas internas. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import type { Usuario } from "@/data/types";

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-3xl border border-line bg-bg ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
      <div className="min-w-0">
        <h3 className="font-display text-[1.0625rem] font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-[2rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Número que anima do valor anterior até o novo. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const c = animate(from.current, value, {
      duration: 1.1,
      ease: EASE_OUT_EXPO,
      onUpdate: (n) => {
        from.current = n;
        setV(n);
      },
    });
    return () => c.stop();
  }, [value]);
  return <>{format(v)}</>;
}

/** Variação percentual vs. período anterior. */
export function Delta({ current, previous }: { current: number; previous: number }) {
  if (!previous) return <span className="text-xs text-subtle">sem base no mês anterior</span>;
  const d = ((current - previous) / previous) * 100;
  const up = d >= 0;
  return (
    <span className="text-xs text-muted">
      <span className={`inline-flex items-center font-semibold ${up ? "text-verified" : "text-rose-600"}`}>
        {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
        {Math.abs(d).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
      </span>{" "}
      vs. mês anterior
    </span>
  );
}

const AVATAR_COLORS = [
  "bg-accent-soft text-accent-deep",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-sky-100 text-sky-800",
];

export function Avatar({ user, className = "size-9 text-xs" }: { user: Pick<Usuario, "id" | "iniciais">; className?: string }) {
  const n = [...user.id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${AVATAR_COLORS[n % AVATAR_COLORS.length]} ${className}`}>
      {user.iniciais}
    </span>
  );
}

export function Select({
  value,
  onChange,
  options,
  icon,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: ReactNode;
  label: string;
}) {
  return (
    <label className="relative inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-bg pl-3 text-sm font-medium transition-colors hover:border-ink/30">
      {icon && <span className="text-muted">{icon}</span>}
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full cursor-pointer appearance-none bg-transparent pr-9 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted" />
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  id,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  id: string;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-full bg-canvas p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`relative rounded-full font-medium transition-colors ${size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} ${
            value === o.value ? "text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-0 rounded-full bg-bg shadow-pill"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, className = "", tone = "accent" }: { value: number; className?: string; tone?: "accent" | "verified" }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-canvas-deep ${className}`}>
      <motion.div
        className={`h-full rounded-full ${tone === "accent" ? "bg-accent" : "bg-verified"}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      />
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "verified" | "warn" | "danger" }) {
  const tones = {
    neutral: "bg-canvas text-muted",
    accent: "bg-accent-soft text-accent-deep",
    verified: "bg-verified-soft text-verified",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold ${tones[tone]}`}>{children}</span>;
}

/** Entrada escalonada dos blocos de uma página. */
export const stagger = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: 0.05 + i * 0.06, ease: EASE_OUT_EXPO },
});
