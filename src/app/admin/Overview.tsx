import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertOctagon, ArrowRight, Building2, CreditCard, Gauge, Hourglass, LifeBuoy, Rocket, TrendingUp, Users, WifiOff } from "lucide-react";
import { lastMonths } from "@/data/queries";
import {
  clienteNome,
  diasSemAcesso,
  errosSistema,
  listaClientes,
  metricasPlataforma,
  mrrSerie,
  pagante,
  pedidosUpgrade,
  PLANOS,
  todosChamados,
} from "@/data/platform";
import { useStore } from "@/data/store";
import type { Cliente, PlanoNome } from "@/data/types";
import { brl, greeting, int, pct, relTime } from "@/lib/format";
import { useSession } from "../session";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { AnimatedNumber, Avatar, Badge, Card, CardHeader, Delta, PageHeader, stagger } from "../kit";
import { LineArea } from "../charts";
import { UsoSupabase } from "./UsoSupabase";

function Kpi({ label, icon: Icon, value, format, children }: { label: string; icon: typeof Users; value: number; format: (n: number) => string; children?: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-sm text-muted">
        {label}
        <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-[2rem] font-semibold leading-none tracking-tight">
        <AnimatedNumber value={value} format={format} />
      </p>
      <div className="mt-3 text-xs text-muted">{children}</div>
    </Card>
  );
}

function AttentionGroup({ icon: Icon, tone, title, items, hint }: { icon: typeof Users; tone: string; title: string; items: Cliente[]; hint: (c: Cliente) => string }) {
  const navigate = useNavigate();
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold text-muted">
        <span className={`grid size-6 place-items-center rounded-full ${tone}`}>
          <Icon className="size-3.5" />
        </span>
        {title} · {items.length}
      </p>
      <ul>
        {items.slice(0, 3).map((c) => (
          <li key={c.id}>
            <button
              onClick={() => navigate(`/admin/imobiliarias?id=${c.id}`)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-canvas"
            >
              <span className="truncate font-medium">{c.nome}</span>
              <span className="shrink-0 text-xs text-muted">{hint(c)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminOverview() {
  useStore();
  const m = metricasPlataforma();
  const months = lastMonths(6);
  const serie = mrrSerie(months);
  const prev = serie[serie.length - 2]?.value ?? 0;
  const cs = listaClientes();

  const porPlano = (Object.keys(PLANOS) as PlanoNome[]).map((p) => {
    const lista = cs.filter((c) => c.plano === p && pagante(c));
    return { plano: p, n: lista.length, receita: lista.length * PLANOS[p].preco };
  });
  const maxPlano = Math.max(...porPlano.map((p) => p.n), 1);

  const usoTotal = cs.reduce(
    (s, c) => ({
      negocios: s.negocios + c.uso.negocios,
      performance: s.performance + c.uso.performance,
      academy: s.academy + c.uso.academy,
      marketing: s.marketing + c.uso.marketing,
    }),
    { negocios: 0, performance: 0, academy: 0, marketing: 0 },
  );
  const modulos = [
    { nome: "Negócios", v: usoTotal.negocios },
    { nome: "Performance", v: usoTotal.performance },
    { nome: "Academy", v: usoTotal.academy },
    { nome: "Marketing", v: usoTotal.marketing },
  ].sort((a, b) => b.v - a.v);
  const maxUso = Math.max(...modulos.map((x) => x.v), 1);

  const pagamento = cs.filter((c) => c.status === "pagamento");
  const inativas = cs.filter((c) => c.status === "ativa" && (diasSemAcesso(c) ?? 0) >= 14);
  const cheias = cs.filter((c) => pagante(c) && !PLANOS[c.plano].solo && c.corretores / PLANOS[c.plano].limite >= 0.9);
  const aguardando = cs.filter((c) => c.status === "aguardando");
  const chamadosAbertos = todosChamados().filter((c) => c.status !== "resolvido");
  const errosNovos = errosSistema.filter((e) => e.status !== "corrigido");
  const upgradesPagos = pedidosUpgrade.filter((p) => p.pagamento === "confirmado" && !p.liberado);
  const { user } = useSession();

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader
          title={`${greeting()}, ${user.nome.split(" ")[0]}`}
          subtitle="Como a Frankkia está indo em todas as contas."
          foto={<Avatar user={user} className="size-12 translate-y-0.5 bg-ink text-base text-bg sm:size-14 sm:translate-y-1 sm:text-lg" />}
        />
      </motion.div>

      {upgradesPagos.length > 0 && (
        <motion.div {...stagger(1)}>
          <Link
            to="/admin/upgrades"
            className="group flex flex-col gap-3 rounded-3xl bg-linear-to-r from-accent to-accent-deep p-5 text-white sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/15">
                <Rocket className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">
                  {upgradesPagos.length} {upgradesPagos.length === 1 ? "upgrade pago aguardando liberação" : "upgrades pagos aguardando liberação"}
                </span>
                <span className="block text-sm text-white/75">{upgradesPagos.map((p) => `${clienteNome(p.imobiliariaId)} → ${p.planoNovo}`).join(" · ")}</span>
              </span>
            </span>
            <span className="inline-flex h-10 items-center gap-2 self-start rounded-full bg-white px-4 text-sm font-semibold text-accent-deep sm:self-center">
              Liberar <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          <Kpi key="mrr" label="Receita mensal (MRR)" icon={TrendingUp} value={m.mrr} format={brl}>
            <Delta current={m.mrr} previous={prev} />
          </Kpi>,
          <Kpi key="imob" label="Imobiliárias pagantes" icon={Building2} value={m.ativas} format={int}>
            {m.clientes} no total · {m.teste} em teste
          </Kpi>,
          <Kpi key="users" label="Usuários na plataforma" icon={Users} value={m.usuarios} format={int}>
            Administradores e corretores
          </Kpi>,
          <Kpi key="ocup" label="Ocupação média das vagas" icon={Gauge} value={m.ocupacao * 100} format={(n) => pct(Math.round(n))}>
            Vagas usadas nos planos pagos
          </Kpi>,
        ].map((k, i) => (
          <motion.div key={k.key} {...stagger(1 + i)}>
            {k}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <motion.div {...stagger(5)}>
          <Card className="h-full">
            <CardHeader title="Evolução da receita mensal" subtitle="Soma dos planos das contas pagantes." />
            <div className="px-5 pb-6 pt-6 sm:px-6">
              <LineArea data={serie} format={brl} />
            </div>
          </Card>
        </motion.div>

        <motion.div {...stagger(6)}>
          <Card className="h-full">
            <CardHeader title="Imobiliárias por plano" subtitle="Somente pagantes." />
            <ul className="space-y-5 px-6 pb-6 pt-6">
              {porPlano.map((p, i) => (
                <li key={p.plano}>
                  <div className="mb-2 flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{p.plano}</span>
                    <span className="text-muted">
                      <span className="font-semibold text-ink">{p.n}</span> · {brl(p.receita)}/mês
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-canvas-deep">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      style={{ opacity: 0.55 + i * 0.22 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.n / maxPlano) * 100}%` }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: EASE_OUT_EXPO }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <motion.div {...stagger(7)}>
          <Card className="h-full">
            <CardHeader title="Precisa de atenção" subtitle="Clique para abrir a imobiliária." />
            <div className="space-y-4 px-3 pb-5 pt-4">
              <AttentionGroup icon={CreditCard} tone="bg-amber-100 text-amber-800" title="Pagamento pendente" items={pagamento} hint={() => "verificar cobrança"} />
              <AttentionGroup icon={WifiOff} tone="bg-rose-100 text-rose-700" title="Sem acesso há 14+ dias" items={inativas} hint={(c) => `${diasSemAcesso(c)} dias`} />
              <AttentionGroup
                icon={Gauge}
                tone="bg-accent-soft text-accent"
                title="Perto do limite (oportunidade de upgrade)"
                items={cheias}
                hint={(c) => `${c.corretores}/${PLANOS[c.plano].limite} vagas`}
              />
              <AttentionGroup icon={Hourglass} tone="bg-canvas-deep text-muted" title="Aguardando primeiro acesso" items={aguardando} hint={(c) => relTime(c.clienteDesde)} />
            </div>
          </Card>
        </motion.div>

        <motion.div {...stagger(8)} className="space-y-6">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <LifeBuoy className="size-4 text-accent" /> Chamados em aberto
                </span>
              }
              action={
                <Link to="/admin/chamados" className="text-sm font-semibold text-accent">
                  Ver todos
                </Link>
              }
            />
            <ul className="mt-3 px-3 pb-4">
              {chamadosAbertos.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link to={`/admin/chamados?id=${c.id}`} className="block rounded-xl px-3 py-2.5 hover:bg-canvas">
                    <p className="truncate text-sm font-semibold">{c.assunto}</p>
                    <p className="truncate text-xs text-muted">
                      {clienteNome(c.imobiliariaId)} · {relTime(c.criadoEm)}
                    </p>
                  </Link>
                </li>
              ))}
              {!chamadosAbertos.length && <p className="px-3 py-2 text-sm text-muted">Nenhum chamado em aberto.</p>}
            </ul>
          </Card>
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <AlertOctagon className="size-4 text-rose-600" /> Erros não resolvidos
                </span>
              }
              action={
                <Link to="/admin/erros" className="text-sm font-semibold text-accent">
                  Ver todos
                </Link>
              }
            />
            <ul className="mt-3 px-3 pb-4">
              {errosNovos.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.mensagem}</p>
                    <p className="text-xs text-muted">
                      {e.local} · {e.imobiliarias} {e.imobiliarias === 1 ? "imobiliária" : "imobiliárias"}
                    </p>
                  </div>
                  <Badge tone={e.status === "novo" ? "danger" : "warn"}>{e.status === "novo" ? "Novo" : "Investigando"}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        <motion.div {...stagger(9)}>
          <Card className="h-full">
            <CardHeader title="Módulos mais usados" subtitle="Ações nos últimos 30 dias, somando todas as contas." />
            <ul className="space-y-4 px-6 pb-6 pt-6">
              {modulos.map((x, i) => (
                <li key={x.nome}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium">{x.nome}</span>
                    <span className="text-muted">{int(x.v)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas-deep">
                    <motion.div
                      className="h-full rounded-full bg-ink"
                      initial={{ width: 0 }}
                      animate={{ width: `${(x.v / maxUso) * 100}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: EASE_OUT_EXPO }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/admin/imobiliarias" className="mx-6 mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
              Ver contas <ArrowRight className="size-4" />
            </Link>
          </Card>
        </motion.div>
      </div>

      <motion.div {...stagger(10)}>
        <UsoSupabase />
      </motion.div>
    </div>
  );
}
