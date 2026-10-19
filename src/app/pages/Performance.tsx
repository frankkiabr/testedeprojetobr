import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeDollarSign, Calendar, Coins, Home, KeyRound, Lock, UserCheck, Users, UserRound } from "lucide-react";
import { corretores } from "@/data/demo";
import {
  lastMonths,
  metrics,
  previousMonth,
  ranking,
  RANKING_LABELS,
  series,
  type RankingKind,
  type Scope,
  pessoa,
} from "@/data/queries";
import { useStore } from "@/data/store";
import { brlCompact, int, pct } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useSession } from "../session";
import { AnimatedNumber, Avatar, Card, CardHeader, Delta, PageHeader, Segmented, Select, stagger } from "../kit";
import { GroupedBars, LineArea, Ring } from "../charts";

function Kpi({
  label,
  icon: Icon,
  value,
  previous,
  format,
  hint,
  private: priv,
}: {
  label: string;
  icon: typeof Home;
  value: number;
  previous: number;
  format: (n: number) => string;
  hint?: string;
  private?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="flex items-center gap-1.5">
          {label}
          {priv && (
            <span title="Visível só para você e o administrador">
              <Lock className="size-3.5 text-subtle" />
            </span>
          )}
        </span>
        <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-[2rem] font-semibold leading-none tracking-tight">
        <AnimatedNumber value={value} format={format} />
      </p>
      <div className="mt-3">{hint ? <span className="text-xs text-muted">{hint}</span> : <Delta current={value} previous={previous} />}</div>
    </Card>
  );
}

const MEDALS = ["bg-amber-300 text-amber-950", "bg-slate-200 text-slate-800", "bg-orange-200 text-orange-900"];

function Rankings({ month, highlight, kinds }: { month: string; highlight?: string; kinds: RankingKind[] }) {
  const [kind, setKind] = useState<RankingKind>("vgv");
  const rows = ranking(kind, month);
  const max = Math.max(...rows.map((r) => r.value), 1);
  const fmt = kind === "vgv" || kind === "vgc" ? brlCompact : int;
  const { role } = useSession();

  return (
    <Card>
      <CardHeader
        title="Ranking da equipe"
        subtitle={kind === "vgc" ? "Comissões: visível apenas para o administrador." : "Quem mais se destacou no mês."}
      />
      <div className="mt-4 overflow-x-auto px-5 sm:px-6">
        <Segmented id="ranking" size="sm" value={kind} onChange={setKind} options={kinds.map((k) => ({ value: k, label: RANKING_LABELS[k] }))} />
      </div>
      <ol className="mt-3 px-2 pb-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((r, i) => {
            const me = r.user.id === highlight;
            return (
              <motion.li
                layout
                key={r.user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ layout: { duration: 0.5, ease: EASE_OUT_EXPO } }}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 sm:px-4 ${me ? "bg-accent-soft" : ""}`}
              >
                <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold ${i < 3 ? MEDALS[i] : "text-muted"}`}>
                  {i + 1}
                </span>
                <Avatar user={r.user} className="size-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {r.user.nome}
                    {me && role === "corretor" && <span className="ml-1.5 text-xs font-semibold text-accent">(você)</span>}
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
                    <motion.div
                      className={`h-full rounded-full ${me ? "bg-accent" : "bg-ink/70"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.value / max) * 100}%` }}
                      transition={{ duration: 0.9, delay: i * 0.03, ease: EASE_OUT_EXPO }}
                    />
                  </div>
                </div>
                <span className="w-24 text-right text-sm font-semibold tabular-nums">{fmt(r.value)}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </Card>
  );
}

export default function Performance() {
  useStore();
  const { role, user } = useSession();
  const isAdmin = role === "admin";
  const months = lastMonths(6);
  const [month, setMonth] = useState(months[months.length - 1].key);
  const [filter, setFilter] = useState(""); // "" = toda a equipe

  const scope: Scope = isAdmin ? (filter ? { corretorId: filter } : {}) : { corretorId: user.id };
  const m = metrics(scope, month);
  const p = metrics(scope, previousMonth(month));
  const s = series(scope);
  const who = scope.corretorId ? pessoa(scope.corretorId) : null;
  const monthLabel = months.find((x) => x.key === month)!.long;

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader
          title="Performance"
          subtitle={
            isAdmin
              ? who
                ? `Resultados de ${who.nome} em ${monthLabel.toLowerCase()}.`
                : `Resultados de toda a equipe em ${monthLabel.toLowerCase()}.`
              : `Seus resultados em ${monthLabel.toLowerCase()}.`
          }
          actions={
            <>
              {isAdmin && (
                <Select
                  label="Corretor"
                  icon={filter ? <UserRound className="size-4" /> : <Users className="size-4" />}
                  value={filter}
                  onChange={setFilter}
                  options={[{ value: "", label: "Toda a equipe" }, ...corretores.map((c) => ({ value: c.id, label: c.nome }))]}
                />
              )}
              <Select
                label="Mês"
                icon={<Calendar className="size-4" />}
                value={month}
                onChange={setMonth}
                options={[...months].reverse().map((x) => ({ value: x.key, label: x.long }))}
              />
            </>
          }
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          <Kpi key="vgv" label="VGV (vendas)" icon={BadgeDollarSign} value={m.vgv} previous={p.vgv} format={brlCompact} />,
          <Kpi key="loc" label="Volume de locação" icon={KeyRound} value={m.volLocacao} previous={p.volLocacao} format={(n) => `${brlCompact(n)}/mês`} />,
          <Kpi key="vgc" label="VGC (comissão)" icon={Coins} value={m.vgc} previous={p.vgc} format={brlCompact} private />,
          <Kpi key="cap" label="Captações" icon={Home} value={m.captados} previous={p.captados} format={int} />,
          <Kpi key="vend" label="Imóveis vendidos" icon={BadgeDollarSign} value={m.vendidos} previous={p.vendidos} format={int} />,
          <Kpi key="alug" label="Imóveis alugados" icon={KeyRound} value={m.alugados} previous={p.alugados} format={int} />,
          <Kpi key="leads" label="Leads cadastrados" icon={Users} value={m.leads} previous={p.leads} format={int} />,
          <Kpi
            key="taxa"
            label="Leads atendidos"
            icon={UserCheck}
            value={m.atendidos}
            previous={p.atendidos}
            format={int}
            hint={`${pct(m.taxa)} dos leads cadastrados`}
          />,
        ].map((k, i) => (
          <motion.div key={k.key} {...stagger(1 + i)}>
            {k}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <motion.div {...stagger(7)}>
          <Card className="h-full">
            <CardHeader title="Evolução do VGV" subtitle="Últimos 6 meses." />
            <div className="px-5 pb-6 pt-6 sm:px-6">
              <LineArea data={s.map((x) => ({ label: x.short, value: x.vgv }))} format={brlCompact} />
            </div>
          </Card>
        </motion.div>

        <motion.div {...stagger(8)}>
          <Card className="flex h-full flex-col">
            <CardHeader title="Meta do mês" subtitle={who ? `Meta individual de ${who.nome.split(" ")[0]}.` : isAdmin ? "Meta da imobiliária." : "Sua meta individual."} />
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-6 pt-4">
              <div className="relative">
                <Ring value={m.metaPct / 100} size={160} />
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="font-display text-3xl font-semibold tracking-tight">
                      <AnimatedNumber value={m.metaPct} format={(n) => pct(Math.round(n))} />
                    </p>
                    <p className="text-xs text-muted">alcançado</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-muted">
                <span className="font-semibold text-ink">{brlCompact(m.vgv)}</span> de {brlCompact(m.meta)}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <motion.div {...stagger(9)}>
          <Card className="h-full">
            <CardHeader title="Leads cadastrados × atendidos" subtitle="Atendido = ao menos um passo do checklist marcado." />
            <div className="px-5 pb-6 pt-10 sm:px-6">
              <GroupedBars data={s.map((x) => ({ label: x.short, a: x.leads, b: x.atendidos }))} labels={["Cadastrados", "Atendidos"]} />
            </div>
          </Card>
        </motion.div>

        <motion.div {...stagger(10)}>
          <Rankings
            month={month}
            highlight={isAdmin ? filter || undefined : user.id}
            kinds={isAdmin ? ["vgv", "alugados", "captados", "atendidos", "vgc"] : ["vgv", "alugados", "captados", "atendidos"]}
          />
        </motion.div>
      </div>
    </div>
  );
}
