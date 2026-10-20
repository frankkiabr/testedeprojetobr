import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Cake,
  Calendar,
  CalendarDays,
  ChevronDown,
  Coins,
  Handshake,
  HelpCircle,
  Home,
  KeyRound,
  LayoutGrid,
  LineChart,
  Megaphone,
  Settings2,
  Users,
} from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { CountUp, Logo } from "../ui";

/**
 * Painel "Performance" exibido no site (dados ilustrativos).
 * Espelha o painel real: mesmo menu, mesmos indicadores (venda + locação), ranking e atalhos.
 * Desenhado em 1100 × 700 e escalado por <Scaled>.
 */
export const DASHBOARD_SIZE = { width: 1100, height: 700 };

const menu = [
  { label: "Visão geral", icon: LayoutGrid },
  { label: "Agenda", icon: CalendarDays },
  { label: "Performance", icon: BarChart3, active: true },
  { label: "Negócios", icon: Briefcase },
  { label: "Estudo de mercado", icon: LineChart },
  { label: "Academy", icon: BookOpen },
  { label: "Marketing", icon: Megaphone },
  { label: "Equipe", icon: Users },
];

const kpis = [
  { label: "VGV (vendas)", icon: BadgeDollarSign, to: 8.42, decimals: 2, prefix: "R$ ", suffix: " mi", delta: "18,4%" },
  { label: "Volume de locação", icon: KeyRound, to: 46.3, decimals: 1, prefix: "R$ ", suffix: " mil/mês", delta: "9,1%" },
  { label: "VGC (comissões)", icon: Coins, to: 252, decimals: 0, prefix: "R$ ", suffix: " mil", delta: "15,7%" },
  { label: "Captações", icon: Home, to: 23, decimals: 0, prefix: "", suffix: "", delta: "12,5%" },
];

const ranking = [
  { pos: 1, initials: "MC", name: "Marina Costa", sub: "6 vendas · 2 locações", value: "R$ 2,10 mi" },
  { pos: 2, initials: "CR", name: "Camila Rocha", sub: "4 vendas · 3 locações", value: "R$ 1,76 mi" },
  { pos: 3, initials: "RL", name: "Rafael Lima", sub: "4 vendas · 1 locação", value: "R$ 1,48 mi" },
];

const atalhos = [
  { label: "4 visitas hoje", sub: "Agenda", icon: CalendarDays, cor: "bg-violet-100 text-violet-700" },
  { label: "2 fechamentos para registrar", sub: "Vendas e locações", icon: Handshake, cor: "bg-amber-100 text-amber-800" },
  { label: "Marina faz aniversário hoje", sub: "Equipe", icon: Cake, cor: "bg-rose-100 text-rose-600" },
];

// Gráfico de linha (VGV dos últimos 6 meses)
const DATA = [34, 41, 38, 52, 49, 63, 58, 70, 66, 78, 74, 90];
const W = 560;
const H = 150;
const pts = DATA.map((v, i) => [(i / (DATA.length - 1)) * W, H - (v / 100) * H] as const);
const LINE = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
const AREA = `${LINE} L${W} ${H} L0 ${H} Z`;
const MONTHS = ["Mai", "Jun", "Jul", "Ago", "Set", "Out"];

export function Dashboard({ active }: { active: boolean }) {
  const last = pts[pts.length - 1];
  return (
    <div className="flex size-full flex-col overflow-hidden rounded-[28px] bg-white text-ink">
      {/* Topo */}
      <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-line px-7">
        <Logo className="text-[28px]" />
        <div className="flex items-center gap-5 text-[13px] text-muted">
          <span>Imobiliária Exemplo</span>
          <span className="relative">
            <Bell className="size-[18px]" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent ring-2 ring-white" />
          </span>
          <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent-deep">GC</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Menu lateral */}
        <aside className="flex w-[190px] shrink-0 flex-col border-r border-line px-3.5 py-5">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Seu universo</p>
          <ul className="mt-3 space-y-0.5">
            {menu.map(({ label, icon: Icon, active: on }) => (
              <li
                key={label}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-[9px] text-[12.5px] ${on ? "bg-accent-soft font-semibold text-accent-deep" : "text-muted"}`}
              >
                <Icon className="size-[16px]" />
                {label}
              </li>
            ))}
          </ul>
          <div className="mt-auto space-y-2">
            <div className="rounded-2xl bg-canvas p-3">
              <div className="flex justify-between text-[10.5px]">
                <span className="font-semibold">Plano Equipe 10</span>
                <span className="text-muted">9 de 10</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
                <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={active ? { width: "90%" } : {}} transition={{ duration: 1.2, delay: 0.5 }} />
              </div>
              <span className="mt-2.5 flex h-7 items-center justify-center rounded-full bg-accent text-[10.5px] font-semibold text-white">Fazer upgrade</span>
            </div>
            {[
              { label: "Configurações", icon: Settings2 },
              { label: "Ajuda", icon: HelpCircle },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-[12.5px] text-muted">
                <Icon className="size-[16px]" />
                {label}
              </div>
            ))}
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 bg-canvas/40 p-6">
          <div className="flex items-end justify-between">
            <div>
              <h4 className="font-display text-[24px] font-semibold tracking-tight">Performance</h4>
              <p className="mt-0.5 text-[12px] text-muted">Resultados de toda a equipe em outubro.</p>
            </div>
            <div className="flex gap-2">
              {[
                { icon: Users, label: "Toda a equipe" },
                { icon: Calendar, label: "Outubro de 2026" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 rounded-xl border border-line-strong bg-white px-3 py-2 text-[12px] font-medium">
                  <Icon className="size-3.5 text-muted" />
                  {label}
                  <ChevronDown className="size-3.5 text-muted" />
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {kpis.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 16 }}
                animate={active ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: EASE_OUT_EXPO }}
                className="rounded-2xl border border-line bg-white p-4"
              >
                <div className="flex items-center justify-between text-[11.5px] text-muted">
                  {k.label}
                  <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-accent">
                    <k.icon className="size-3.5" />
                  </span>
                </div>
                <p className="mt-2.5 whitespace-nowrap font-display text-[26px] font-semibold leading-none tracking-tight">
                  <CountUp to={k.to} start={active} decimals={k.decimals} prefix={k.prefix} />
                  <span className="text-[13px] font-medium text-muted">{k.suffix}</span>
                </p>
                <p className="mt-2.5 text-[10.5px] text-muted">
                  <span className="font-semibold text-verified">↗ {k.delta}</span> vs. mês anterior
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[1.4fr_1fr] gap-3">
            {/* Gráfico */}
            <div className="flex flex-col rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold">Evolução do VGV</p>
                <p className="text-[11px] text-muted">Últimos 6 meses</p>
              </div>
              <div className="relative mt-3 flex-1">
                <svg viewBox={`0 -12 ${W} ${H + 14}`} className="size-full overflow-visible" preserveAspectRatio="none">
                  {[0.25, 0.5, 0.75].map((f) => (
                    <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#e8ebf1" strokeDasharray="6 6" />
                  ))}
                  <motion.path d={AREA} fill="#2f5bea" initial={{ opacity: 0 }} animate={active ? { opacity: 0.14 } : {}} transition={{ duration: 1, delay: 1.1 }} />
                  <motion.path
                    d={LINE}
                    fill="none"
                    stroke="#2f5bea"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={active ? { pathLength: 1 } : {}}
                    transition={{ duration: 1.6, delay: 0.4, ease: EASE_OUT_EXPO }}
                  />
                  <motion.circle
                    cx={last[0]}
                    cy={last[1]}
                    r="6"
                    fill="#2f5bea"
                    initial={{ scale: 0 }}
                    animate={active ? { scale: 1 } : {}}
                    transition={{ delay: 1.6, type: "spring", stiffness: 300, damping: 15 }}
                  />
                </svg>
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                {MONTHS.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>

            {/* Ranking */}
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="text-[13px] font-semibold">Ranking da equipe</p>
              <div className="mt-2.5 inline-flex rounded-full bg-canvas p-0.5 text-[10.5px] font-medium">
                {["VGV", "Locações", "Captações", "Leads atendidos"].map((t, i) => (
                  <span key={t} className={`rounded-full px-2.5 py-1 ${i === 0 ? "bg-white text-ink shadow-pill" : "text-muted"}`}>
                    {t}
                  </span>
                ))}
              </div>
              <ul className="mt-2">
                {ranking.map((r, i) => (
                  <motion.li
                    key={r.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={active ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.6 + i * 0.12, ease: EASE_OUT_EXPO }}
                    className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-0"
                  >
                    <span
                      className={`grid size-5 place-items-center rounded-full text-[10px] font-bold ${
                        ["bg-amber-300 text-amber-950", "bg-slate-200 text-slate-800", "bg-orange-200 text-orange-900"][i]
                      }`}
                    >
                      {r.pos}
                    </span>
                    <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-[10.5px] font-semibold text-accent-deep">{r.initials}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium">{r.name}</span>
                      <span className="block truncate text-[10.5px] text-muted">{r.sub}</span>
                    </span>
                    <span className="text-[12.5px] font-semibold">{r.value}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Atalhos do dia */}
          <div className="grid grid-cols-3 gap-3">
            {atalhos.map(({ label, sub, icon: Icon, cor }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={active ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 1 + i * 0.1, ease: EASE_OUT_EXPO }}
                className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3"
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${cor}`}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold">{label}</span>
                  <span className="block text-[10.5px] text-muted">{sub}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
