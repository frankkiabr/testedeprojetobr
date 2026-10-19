import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Cake, ChevronDown, Clock, Mail, RotateCcw, Send, ShieldCheck, UserMinus, UserPlus, X } from "lucide-react";
import { admin, convites, imobiliaria } from "@/data/demo";
import { corretoresAtivos, corretoresInativos, creciLabel, diasAteAniversario, equipeAtiva, vagasLivres, vagasUsadas } from "@/data/queries";
import { UpgradeNudge } from "../upgrade";
import { useStore } from "@/data/store";
import type { Usuario } from "@/data/types";
import { relTime } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Avatar, Badge, Card, CardHeader, PageHeader, stagger } from "../kit";
import { btn, inputCls, Modal } from "../forms";

function Row({ children, i }: { children: React.ReactNode; i: number }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, delay: Math.min(i, 10) * 0.03, ease: EASE_OUT_EXPO }}
      className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5 last:border-0 sm:flex-nowrap sm:px-6"
    >
      {children}
    </motion.li>
  );
}

export default function Equipe() {
  const store = useStore();
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [confirm, setConfirm] = useState<Usuario | null>(null);
  const [showInativos, setShowInativos] = useState(false);

  const limite = imobiliaria.limiteCorretores;
  const usadas = vagasUsadas();
  const livres = vagasLivres();
  const cheio = livres <= 0;
  const inativos = corretoresInativos();

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const err = store.invite(email);
    setErro(err ?? "");
    if (!err) setEmail("");
  };

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader title="Equipe" subtitle="Convide corretores por e-mail e gerencie os acessos da imobiliária." />
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-6">
          {/* Uso do plano */}
          <motion.div {...stagger(1)}>
            <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-bg">
              <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_100%_0%,rgb(47_91_234/0.5),transparent_70%)]" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-bg/60">Plano {imobiliaria.plano}</p>
                <p className="mt-3 font-display text-4xl font-semibold tracking-tight">
                  {usadas}
                  <span className="text-xl text-bg/60"> de {limite} vagas</span>
                </p>
                {/* Barra segmentada: ativos + convites + livres */}
                <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
                  {Array.from({ length: limite }).map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.2 + i * 0.03 }}
                      className={`flex-1 ${i < equipeAtiva() ? "bg-accent" : i < usadas ? "bg-amber-300" : "bg-white/15"}`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-bg/70">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-accent" /> {equipeAtiva()} ativos
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-300" /> {convites.length} {convites.length === 1 ? "convite pendente" : "convites pendentes"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-white/30" /> {livres} livres
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Convite */}
          <motion.div {...stagger(2)}>
            <Card className="p-6">
              <p className="flex items-center gap-2 font-display text-lg font-semibold">
                <UserPlus className="size-5 text-accent" /> Convidar corretor
              </p>
              <p className="mt-1 text-sm text-muted">Qualquer e-mail pode ser convidado. O convite ocupa uma vaga até ser aceito ou cancelado.</p>
              <form onSubmit={enviar} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <label className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErro("");
                    }}
                    disabled={cheio}
                    placeholder={cheio ? "Limite do plano atingido" : "email@exemplo.com"}
                    className={`${inputCls} pl-10 disabled:bg-canvas`}
                  />
                </label>
                <button type="submit" disabled={cheio || !email.trim()} className={`${btn.accent} h-11`}>
                  <Send className="size-4" /> Convidar
                </button>
              </form>
              <AnimatePresence>
                {erro && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-sm font-medium text-rose-600">
                    {erro}
                  </motion.p>
                )}
              </AnimatePresence>
              {cheio && (
                <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
                  Todas as vagas do plano estão em uso. Desative um acesso, cancele um convite ou faça um upgrade de plano.
                </p>
              )}
            </Card>
          </motion.div>

          <UpgradeNudge aPartirDe={0.6} />
        </div>

        {/* Membros */}
        <motion.div {...stagger(3)}>
          <Card>
            <CardHeader title="Membros" subtitle={`${equipeAtiva() + 1} pessoas com acesso · ${convites.length} aguardando`} />
            <ul className="mt-3">
              <AnimatePresence initial={false}>
                <Row key={admin.id} i={0}>
                  <Avatar user={admin} className="size-10 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {admin.nome} <span className="font-normal text-muted">(você)</span>
                    </p>
                    <p className="truncate text-xs text-muted">{admin.email}</p>
                  </div>
                  <Badge tone="accent">
                    <ShieldCheck className="mr-1 size-3" /> Administrador
                  </Badge>
                </Row>

                {convites.map((c, i) => (
                  <Row key={c.id} i={i + 1}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-dashed border-amber-300 text-amber-600">
                      <Clock className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.email}</p>
                      <p className="text-xs text-muted">
                        Convite enviado {relTime(c.enviadoEm)} ·{" "}
                        <Link to={`/convite/${c.id}`} className="font-semibold text-accent hover:underline" title="Abre a tela que o corretor vê ao aceitar o convite">
                          ver tela do convite
                        </Link>
                      </p>
                    </div>
                    <Badge tone="warn">Pendente</Badge>
                    <div className="flex gap-1">
                      <button onClick={() => store.resendInvite(c.id)} title="Reenviar convite" className="grid size-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink">
                        <RotateCcw className="size-4" />
                      </button>
                      <button onClick={() => store.cancelInvite(c.id)} title="Cancelar convite" className="grid size-8 place-items-center rounded-full text-muted hover:bg-rose-50 hover:text-rose-600">
                        <X className="size-4" />
                      </button>
                    </div>
                  </Row>
                ))}

                {corretoresAtivos().map((c, i) => (
                  <Row key={c.id} i={i + convites.length + 1}>
                    <Avatar user={c} className="size-10 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                        {c.nome}
                        {(diasAteAniversario(c) ?? 99) <= 1 && (
                          <span title={diasAteAniversario(c) === 0 ? "Aniversário hoje!" : "Aniversário amanhã"}>
                            <Cake className="size-4 text-rose-500" />
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted">{c.email}</p>
                    </div>
                    <Badge tone={c.estagiario ? "accent" : c.creci ? "neutral" : "warn"}>{creciLabel(c)}</Badge>
                    <Badge tone="verified">Ativo</Badge>
                    <button onClick={() => setConfirm(c)} title="Desativar acesso" className="grid size-8 place-items-center rounded-full text-muted hover:bg-rose-50 hover:text-rose-600">
                      <UserMinus className="size-4" />
                    </button>
                  </Row>
                ))}
              </AnimatePresence>
            </ul>

            {inativos.length > 0 && (
              <div className="border-t border-line">
                <button onClick={() => setShowInativos(!showInativos)} className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold text-muted hover:text-ink">
                  Acessos desativados ({inativos.length})
                  <ChevronDown className={`size-4 transition-transform ${showInativos ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {showInativos && (
                    <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      {inativos.map((c, i) => (
                        <Row key={c.id} i={i}>
                          <Avatar user={c} className="size-10 text-xs opacity-50" />
                          <div className="min-w-0 flex-1 opacity-60">
                            <p className="truncate text-sm font-semibold">{c.nome}</p>
                            <p className="truncate text-xs text-muted">{c.email}</p>
                          </div>
                          <button onClick={() => store.setCorretorAtivo(c.id, true)} disabled={cheio} className={`${btn.outline} h-8 px-3 text-xs disabled:opacity-40`}>
                            Reativar
                          </button>
                        </Row>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Desativar acesso?"
        subtitle="A vaga do plano é liberada na hora."
        footer={
          <>
            <button onClick={() => setConfirm(null)} className={btn.outline}>
              Cancelar
            </button>
            <button
              onClick={() => {
                if (confirm) store.setCorretorAtivo(confirm.id, false);
                setConfirm(null);
              }}
              className={`${btn.primary} bg-rose-600 hover:bg-rose-700`}
            >
              Desativar acesso
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{confirm?.nome}</span> não vai mais conseguir entrar na plataforma. Os leads, imóveis e vendas registrados por ele continuam
          salvos no histórico da imobiliária, e você pode reativar o acesso depois.
        </p>
      </Modal>
    </div>
  );
}
