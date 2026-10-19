/** Gráficos leves em SVG/HTML, sem bibliotecas externas. */
import { useState } from "react";
import { motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/scroll";

type Point = { label: string; value: number };

/** Linha com área preenchida e tooltip ao passar o mouse. */
export function LineArea({ data, format, height = 220 }: { data: Point[]; format: (v: number) => string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1) * 1.15;
  const pts = data.map((d, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * 100 : 50,
    y: 100 - (d.value / max) * 100,
  }));
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
  const area = `${line} L100 100 L0 100 Z`;
  const key = data.map((d) => d.value).join("-");

  return (
    <div>
      <div className="relative" style={{ height }}>
        {[25, 50, 75].map((y) => (
          <div key={y} className="absolute inset-x-0 border-t border-dashed border-line" style={{ top: `${y}%` }} />
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <motion.path key={`a-${key}`} d={area} fill="#2f5bea" initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} transition={{ duration: 0.8, delay: 0.5 }} />
          <motion.path
            key={`l-${key}`}
            d={line}
            fill="none"
            stroke="#2f5bea"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.3, ease: EASE_OUT_EXPO }}
          />
        </svg>
        {pts.map((_, i) => (
          <div key={i} className="absolute top-0 h-full" style={{ left: `${(i / data.length) * 100}%`, width: `${100 / data.length}%` }}>
            <button
              aria-label={`${data[i].label}: ${format(data[i].value)}`}
              className="absolute inset-0"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          </div>
        ))}
        {pts.map((p, i) => (
          <motion.span
            key={`d-${i}-${key}`}
            className={`pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-sm ${
              hover === i || i === pts.length - 1 ? "opacity-100" : "opacity-0"
            } transition-opacity`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 + i * 0.05 }}
          />
        ))}
        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-xs text-bg shadow-float"
            style={{ left: `${Math.min(92, Math.max(8, pts[hover].x))}%`, top: `${pts[hover].y}%` }}
          >
            <span className="block text-bg/60">{data[hover].label}</span>
            <span className="font-semibold">{format(data[hover].value)}</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Barras agrupadas (ex.: leads cadastrados × atendidos). */
export function GroupedBars({
  data,
  labels,
  height = 200,
}: {
  data: { label: string; a: number; b: number }[];
  labels: [string, string];
  height?: number;
}) {
  const max = Math.max(...data.flatMap((d) => [d.a, d.b]), 1);
  return (
    <div>
      <div className="flex items-end justify-between gap-3" style={{ height }}>
        {data.map((d, i) => (
          <div key={d.label} className="group flex h-full flex-1 items-end justify-center gap-1.5">
            {[d.a, d.b].map((v, k) => (
              <div key={k} className="relative flex h-full w-full max-w-[22px] items-end">
                <motion.div
                  className={`w-full rounded-t-lg ${k === 0 ? "bg-accent-soft" : "bg-accent"}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / max) * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.06 + k * 0.05, ease: EASE_OUT_EXPO }}
                />
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 text-[0.6875rem] font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                  {v}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between gap-3 text-xs text-muted">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-5 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-xs bg-accent-soft" />
          {labels[0]}
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-xs bg-accent" />
          {labels[1]}
        </span>
      </div>
    </div>
  );
}

/** Anel de progresso (ex.: meta alcançada). */
export function Ring({ value, size = 132 }: { value: number; size?: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="-rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e7ebf2" strokeWidth="12" />
      <motion.circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="#2f5bea"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - v) }}
        transition={{ duration: 1.3, ease: EASE_OUT_EXPO }}
      />
    </svg>
  );
}
