import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeDollarSign,
  Cake,
  CalendarClock,
  Home,
  KeyRound,
  Megaphone,
  PartyPopper,
  Plus,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { CHECKLIST_MARKETING, imobiliaria } from "@/data/demo";
import { ehSolo } from "@/data/platform";
import {
  aniversariantes,
  atividades,
  captacaoTitulo,
  corretoresAtivos,
  diasAteAniversario,
  equipeAtiva,
  idadeQueCompleta,
  done,
  lastMonths,
  leadsSemAtendimento,
  marketingPendente,
  metrics,
  position,
  proximosCompromissos,
  ranking,
  type Scope,
  pessoa,
} from "@/data/queries";
import { useStore } from "@/data/store";
import { brlCompact, dateTime, greeting, int, pct, relTime } from "@/lib/format";
import { useSession } from "../session";
import { AnimatedNumber, Avatar, Badge, Card, CardHeader, PageHeader, ProgressBar, stagger } from "../kit";
import { waLink } from "../forms";
import { UpgradeNudge } from "../upgrade";
import { PrimeirosPassos } from "../PrimeirosPassos";

function MiniStat({ label, value, format, hint }: { label: string; value: number; format: (n: number) => string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-canvas p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight">
        <AnimatedNumber value={value} format={format} />
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 pb-6 pt-2 text-sm text-muted sm:px-6">{children}</p>;
}

export default function Overview() {
  useStore();
  const { role, user } = useSession();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const scope: Scope = isAdmin ? {} : { corretorId: user.id };
  const month = lastMonths(1)[0];
  const m = metrics(scope, month.key);

  const semAtendimento = leadsSemAtendimento(scope);
  // Próximos compromissos da Agenda (inclui as visitas marcadas nos leads)
  const proximos = proximosCompromissos(isAdmin ? [user.id, ...corretoresAtivos().map((c) => c.id)] : [user.id], 4);
  const pendentes = marketingPendente(scope);
  const feed = atividades(scope, 7);
  const top = ranking("vgv", month.key)[0];
  const solo = ehSolo(imobiliaria.plano);
  const firstName = user.nome.split(" ")[0];
  const niver = aniversariantes(1);

  return (
    <div className="space-y-6">
      {/* Dono da conta: itens básicos para começar (some quando tudo estiver feito) */}
      <PrimeirosPassos />
      <motion.div {...stagger(0)}>
        <PageHeader
          title={`${greeting()}, ${firstName}`}
          subtitle={
            isAdmin ? `Aqui está o que está acontecendo na ${imobiliaria.nome} hoje.` : "Aqui está o que precisa da sua atenção hoje."
          }
          actions={
            <>
              <button
                onClick={() => navigate("/app/negocios/leads?novo=1")}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-deep active:scale-[0.98]"
              >
                <Plus className="size-4" /> Novo lead
              </button>
              <button
                onClick={() => navigate("/app/negocios/captacoes?novo=1")}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-bg px-4 text-sm font-semibold transition hover:bg-canvas active:scale-[0.98]"
              >
                <Home className="size-4" /> Novo imóvel
              </button>
              <button
                onClick={() => navigate(isAdmin ? "/app/negocios/transacoes?nova=1" : "/app/negocios/transacoes?informar=1")}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-bg px-4 text-sm font-semibold transition hover:bg-canvas active:scale-[0.98]"
              >
                <BadgeDollarSign className="size-4" /> {isAdmin ? "Registrar venda ou locação" : "Informar fechamento"}
              </button>
            </>
          }
        />
      </motion.div>

      {/* Resumo do mês */}
      <motion.div {...stagger(1)}>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[1.0625rem] font-semibold tracking-tight">
              Resumo de {month.long.toLowerCase()}
              <span className="ml-2 text-sm font-normal text-muted">{isAdmin && !solo ? "· toda a equipe" : "· seus números"}</span>
            </h3>
            <Link to="/app/performance" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
              Ver performance <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat label="VGV no mês" value={m.vgv} format={brlCompact} hint={`${pct(m.metaPct)} da meta`} />
            <MiniStat label="Volume de locação" value={m.volLocacao} format={(n) => `${brlCompact(n)}/mês`} hint={`${m.alugados} ${m.alugados === 1 ? "imóvel alugado" : "imóveis alugados"}`} />
            <MiniStat label="Captações" value={m.captados} format={int} hint={`${m.vendidos} ${m.vendidos === 1 ? "venda" : "vendas"} no mês`} />
            <MiniStat label="Leads atendidos" value={m.atendidos} format={int} hint={`de ${m.leads} cadastrados`} />
          </div>
        </Card>
      </motion.div>

      {/* Aniversário do próprio usuário */}
      {diasAteAniversario(user) === 0 && (
        <motion.div {...stagger(1)}>
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-rose-500 via-fuchsia-500 to-accent p-6 text-white">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute size-2 rounded-xs"
                style={{ left: `${(i * 7.3) % 100}%`, top: -10, background: ["#fde68a", "#ffffff", "#a5f3fc", "#fbcfe8"][i % 4] }}
                animate={{ y: [0, 140], rotate: [0, 360], opacity: [1, 0] }}
                transition={{ duration: 2.4 + (i % 5) * 0.3, repeat: Infinity, delay: i * 0.18, ease: "easeIn" }}
              />
            ))}
            <div className="relative flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20">
                <PartyPopper className="size-7" />
              </span>
              <div>
                <p className="font-display text-2xl font-semibold">Feliz aniversário, {firstName}! 🎉</p>
                <p className="text-white/85">Toda a equipe da {imobiliaria.nome} deseja um ano incrível, cheio de boas vendas.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Leads aguardando */}
          <motion.div {...stagger(2)}>
            <Card>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    Leads aguardando atendimento
                    <Badge tone={semAtendimento.length ? "warn" : "verified"}>{semAtendimento.length}</Badge>
                  </span>
                }
                subtitle="Leads novos sem nenhum passo do checklist marcado."
              />
              {semAtendimento.length ? (
                <ul className="mt-3 divide-y divide-line px-2 pb-3">
                  {semAtendimento.slice(0, 5).map((l) => {
                    const c = pessoa(l.corretorId);
                    return (
                      <li
                        key={l.id}
                        onClick={() => navigate(`/app/negocios/leads?lead=${l.id}`)}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-canvas sm:px-4"
                      >
                        <span className="grid size-9 place-items-center rounded-full bg-amber-100 text-amber-800">
                          <UserPlus className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{l.nome}</p>
                          <p className="truncate text-xs text-muted">
                            {l.interesse} · {l.origem}
                          </p>
                        </div>
                        {isAdmin && (
                          <span className="hidden items-center gap-2 text-xs text-muted sm:flex">
                            <Avatar user={c} className="size-6 text-[0.5625rem]" />
                            {c.nome.split(" ")[0]}
                          </span>
                        )}
                        <span className="w-20 text-right text-xs text-muted">{relTime(l.criadoEm)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty>Tudo em dia. Nenhum lead esperando.</Empty>
              )}
            </Card>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Próximas visitas */}
            <motion.div {...stagger(3)}>
              <Card className="h-full">
                <CardHeader
                  title="Próximos compromissos"
                  subtitle={isAdmin && !solo ? "Seus e da equipe, na Agenda." : "Da sua Agenda."}
                  action={
                    <Link to="/app/agenda" className="text-sm font-semibold text-accent">
                      Ver agenda
                    </Link>
                  }
                />
                {proximos.length ? (
                  <ul className="mt-3 space-y-1 px-2 pb-3">
                    {proximos.map((c) => (
                      <li
                        key={c.id}
                        onClick={() => navigate(c.leadId ? `/app/negocios/leads?lead=${c.leadId}` : "/app/agenda")}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-canvas"
                      >
                        <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent">
                          <CalendarClock className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{c.titulo}</p>
                          <p className="truncate text-xs text-muted">
                            {dateTime(c.inicio)}
                            {isAdmin && !solo && c.donoId !== user.id ? ` · ${pessoa(c.donoId).nome.split(" ")[0]}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>Nenhum compromisso marcado.</Empty>
                )}
              </Card>
            </motion.div>

            {/* Marketing pendente */}
            <motion.div {...stagger(4)}>
              <Card className="h-full">
                <CardHeader title="Marketing pendente" subtitle="Captações com checklist incompleto." />
                {pendentes.length ? (
                  <ul className="mt-3 space-y-1 px-2 pb-3">
                    {pendentes.slice(0, 4).map((i) => (
                      <li
                        key={i.id}
                        onClick={() => navigate(`/app/negocios/captacoes?captacao=${i.id}`)}
                        className="cursor-pointer rounded-2xl px-3 py-2.5 hover:bg-canvas"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-full bg-violet-100 text-violet-700">
                            <Megaphone className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{captacaoTitulo(i)}</p>
                            <p className="text-xs text-muted">
                              {done(i)} de {CHECKLIST_MARKETING.length} ações
                            </p>
                          </div>
                        </div>
                        <ProgressBar value={done(i) / CHECKLIST_MARKETING.length} className="ml-12 mt-2 h-1.5" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>Todas as captações com marketing completo.</Empty>
                )}
              </Card>
            </motion.div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Aniversariantes: o administrador vê hoje e amanhã (cerca de 24h antes) */}
          {isAdmin && niver.length > 0 && (
            <motion.div {...stagger(2)}>
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2 bg-rose-50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                  <Cake className="size-4" /> Aniversariantes
                </div>
                <ul className="divide-y divide-line px-3">
                  {niver.map(({ user: u, dias }) => (
                    <li key={u.id} className="flex items-center gap-3 px-3 py-3">
                      <Avatar user={u} className="size-10 text-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{u.id === user.id ? `${u.nome} (você)` : u.nome}</p>
                        <p className="text-xs text-muted">
                          {dias === 0 ? "Faz aniversário hoje" : "Faz aniversário amanhã"}
                          {idadeQueCompleta(u) ? ` · ${idadeQueCompleta(u)} anos` : ""}
                        </p>
                      </div>
                      {u.telefone && u.id !== user.id && (
                        <a
                          href={waLink(u.telefone, dias === 0 ? `Feliz aniversário, ${u.nome.split(" ")[0]}! 🎉` : undefined)}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${dias === 0 ? "bg-rose-500 text-white" : "border border-line-strong"}`}
                        >
                          {dias === 0 ? "Parabenizar" : "Lembrar"}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}

          {isAdmin && !solo && <UpgradeNudge aPartirDe={0.75} />}

          {solo ? null : isAdmin ? (
            <>
              {/* Destaque do mês */}
              <motion.div {...stagger(2)}>
                <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-bg">
                  <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_100%_0%,rgb(47_91_234/0.5),transparent_70%)]" />
                  <div className="relative">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bg/60">
                      <Trophy className="size-4 text-amber-300" /> Destaque do mês
                    </p>
                    {top ? (
                      <div className="mt-5 flex items-center gap-4">
                        <Avatar user={top.user} className="size-14 text-base" />
                        <div>
                          <p className="font-display text-xl font-semibold">{top.user.nome}</p>
                          <p className="text-sm text-bg/60">
                            <AnimatedNumber value={top.value} format={brlCompact} /> em VGV
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-5 text-sm text-bg/70">
                        Assim que a equipe tiver corretores, o destaque do mês aparece aqui.{" "}
                        <Link to="/app/equipe" className="font-semibold text-white underline-offset-2 hover:underline">
                          Convidar corretores
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Equipe */}
              <motion.div {...stagger(3)}>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 font-display font-semibold">
                      <Users className="size-4 text-accent" /> Equipe
                    </p>
                    <Link to="/app/equipe" className="text-sm font-semibold text-accent">
                      Gerenciar
                    </Link>
                  </div>
                  <p className="mt-4 font-display text-3xl font-semibold tracking-tight">
                    {equipeAtiva()}
                    <span className="text-lg text-muted"> de {imobiliaria.limiteCorretores} corretores</span>
                  </p>
                  <ProgressBar value={equipeAtiva() / imobiliaria.limiteCorretores} className="mt-3" />
                  <div className="mt-4 flex -space-x-2">
                    {corretoresAtivos().map((c) => (
                      <span key={c.id} className="rounded-full ring-2 ring-bg">
                        <Avatar user={c} className="size-8 text-[0.625rem]" />
                      </span>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </>
          ) : (
            <motion.div {...stagger(2)}>
              {/* Posição do corretor */}
              <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-bg">
                <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_100%_0%,rgb(47_91_234/0.5),transparent_70%)]" />
                <div className="relative">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bg/60">
                    <Trophy className="size-4 text-amber-300" /> Sua posição na equipe
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {(
                      [
                        ["vgv", "VGV"],
                        ["captados", "Captações"],
                        ["atendidos", "Atendimento"],
                      ] as const
                    ).map(([k, label]) => (
                      <div key={k} className="rounded-2xl bg-white/10 p-3 text-center">
                        <p className="font-display text-3xl font-semibold">{position(user.id, k, month.key)}º</p>
                        <p className="mt-1 text-[0.6875rem] text-bg/60">{label}</p>
                      </div>
                    ))}
                  </div>
                  <Link to="/app/performance" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-bg/80 hover:text-bg">
                    Ver rankings <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Atividade recente */}
          <motion.div {...stagger(4)}>
            <Card>
              <CardHeader title="Atividade recente" subtitle={isAdmin && !solo ? "Toda a equipe." : "Suas últimas ações."} />
              <ul className="relative mt-4 space-y-4 px-5 pb-6 sm:px-6">
                <span className="absolute bottom-8 left-[2.15rem] top-2 w-px bg-line sm:left-[2.4rem]" />
                {feed.map((a) => {
                  const c = pessoa(a.corretorId);
                  const icon =
                    a.tipo === "venda" ? (
                      <BadgeDollarSign className="size-3.5" />
                    ) : a.tipo === "locacao" ? (
                      <KeyRound className="size-3.5" />
                    ) : a.tipo === "captacao" ? (
                      <Home className="size-3.5" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    );
                  const tone =
                    a.tipo === "venda"
                      ? "bg-verified text-white"
                      : a.tipo === "locacao"
                        ? "bg-violet-600 text-white"
                        : a.tipo === "captacao"
                          ? "bg-accent text-white"
                          : "bg-canvas-deep text-ink";
                  return (
                    <li key={a.id} className="relative flex gap-3">
                      <span className={`relative z-10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ring-4 ring-bg ${tone}`}>{icon}</span>
                      <div className="min-w-0 text-sm">
                        <p>
                          <span className="font-semibold">{isAdmin ? c.nome.split(" ")[0] : "Você"}</span> {a.texto}
                          {a.valor && (
                            <span className="font-semibold text-verified">
                              {" "}
                              · {brlCompact(a.valor)}
                              {a.tipo === "locacao" ? "/mês" : ""}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted">{relTime(a.data)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
