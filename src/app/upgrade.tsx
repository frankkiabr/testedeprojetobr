/** Incentivo, escolha de plano, ida ao pagamento e status do pedido de upgrade. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, Clock, CreditCard, Rocket, Sparkles } from "lucide-react";
import { pricing } from "@/content";
import { imobiliaria } from "@/data/demo";
import { pedidoAberto, PLANOS, PLANOS_EQUIPE } from "@/data/platform";
import { usoDoPlano, vagasUsadas } from "@/data/queries";
import { useStore } from "@/data/store";
import type { PlanoNome } from "@/data/types";
import { relTime } from "@/lib/format";
import { btn, Modal } from "./forms";
import { ProgressBar } from "./kit";
import { useSession } from "./session";
import { CicloToggle } from "@/components/CicloToggle";
import { mensalNoAnual, precoPlano, totalAnual, type Ciclo } from "@/lib/planos";

const ORDEM: PlanoNome[] = PLANOS_EQUIPE;
export const proximoPlano = (): PlanoNome | null =>
  ORDEM[ORDEM.indexOf(imobiliaria.plano) + 1] ?? null;

/** Leva direto ao pagamento do plano escolhido. */
export function useIrParaPagamento() {
  const { criarPedidoUpgrade } = useStore();
  const navigate = useNavigate();
  return (plano: PlanoNome, ciclo: Ciclo = "mensal") =>
    navigate(`/checkout/${criarPedidoUpgrade(plano, ciclo)}`);
}

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const irParaPagamento = useIrParaPagamento();
  const { modo, conta } = useSession();
  // No teste grátis, dá para contratar o próprio plano do teste (ou um maior)
  const emTeste = modo === "real" && conta?.imobiliaria?.status === "teste";
  const opcoes = ORDEM.filter((p) =>
    emTeste
      ? PLANOS[p].limite >= imobiliaria.limiteCorretores
      : PLANOS[p].limite > imobiliaria.limiteCorretores,
  );
  const [plano, setPlano] = useState<PlanoNome | null>(opcoes[0] ?? null);
  const [ciclo, setCiclo] = useState<Ciclo>("mensal");
  useEffect(() => {
    if (open) setPlano(opcoes[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={emTeste ? "Contratar um plano" : "Fazer upgrade do plano"}
      subtitle={`Hoje: ${imobiliaria.plano} · ${vagasUsadas()} de ${imobiliaria.limiteCorretores} vagas em uso.`}
      footer={
        opcoes.length ? (
          <>
            <button onClick={onClose} className={btn.outline}>
              Agora não
            </button>
            <button
              disabled={!plano}
              onClick={() => {
                onClose();
                if (plano) irParaPagamento(plano, ciclo);
              }}
              className={btn.accent}
            >
              <CreditCard className="size-4" /> Ir para pagamento
            </button>
          </>
        ) : undefined
      }
    >
      {opcoes.length ? (
        <div className="space-y-3">
          <div className="flex justify-center pb-1">
            <CicloToggle ciclo={ciclo} onChange={setCiclo} />
          </div>
          {opcoes.map((p) => {
            const info = pricing.plans.find((x) => x.name === p)!;
            const sel = plano === p;
            return (
              <button
                key={p}
                onClick={() => setPlano(p)}
                className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${sel ? "border-accent bg-accent-soft/50" : "border-line hover:border-line-strong"}`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${sel ? "border-accent bg-accent text-white" : "border-line-strong"}`}
                >
                  {sel && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <div className="flex-1">
                  <p className="font-display text-lg font-semibold">{p}</p>
                  <p className="text-sm text-muted">
                    {info.seats} ·{" "}
                    <span className="font-semibold text-verified">
                      {PLANOS[p].limite > imobiliaria.limiteCorretores
                        ? `+${PLANOS[p].limite - imobiliaria.limiteCorretores} vagas`
                        : "o mesmo do seu teste"}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-semibold">
                    {precoPlano(ciclo === "anual" ? mensalNoAnual(PLANOS[p].preco) : PLANOS[p].preco)}
                    <span className="text-xs font-normal text-muted">/mês</span>
                  </p>
                  {ciclo === "anual" && (
                    <p className="text-xs text-muted">{precoPlano(totalAnual(PLANOS[p].preco))} por ano</p>
                  )}
                </div>
              </button>
            );
          })}
          <p className="text-xs text-subtle">
            Pagamento por cartão, PIX ou boleto. As novas vagas são liberadas assim que o pagamento
            é confirmado. {pricing.note}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Você já está no maior plano. Para equipes acima de 60 corretores, fale com a Frankkia.
        </p>
      )}
    </Modal>
  );
}

/** Status do pedido de upgrade em andamento (para o administrador da imobiliária). */
export function PedidoUpgradeStatus({ compact = false }: { compact?: boolean }) {
  useStore();
  const navigate = useNavigate();
  const p = pedidoAberto(imobiliaria.id);
  if (!p) return null;

  const reducao = p.tipo === "reducao";
  const cfg = reducao
    ? {
        icon: Clock,
        cor: "bg-canvas text-ink",
        titulo: "Troca de plano solicitada",
        texto: `Troca de ${p.planoAtual} para ${p.planoNovo}: aguardando a confirmação da equipe Frankkia.`,
      }
    : {
        aguardando: {
          icon: CreditCard,
          cor: "bg-accent-soft text-accent-deep",
          titulo: "Pagamento não concluído",
          texto: `Upgrade para ${p.planoNovo} aguardando pagamento.`,
        },
        pendente: {
          icon: Clock,
          cor: "bg-amber-100 text-amber-800",
          titulo: "Pagamento em compensação",
          texto: `Upgrade para ${p.planoNovo}: boleto em compensação (até 3 dias úteis).`,
        },
        confirmado: {
          icon: CheckCircle2,
          cor: "bg-verified-soft text-verified",
          titulo: "Pagamento confirmado",
          texto: `Upgrade para ${p.planoNovo}: aguardando a liberação pela equipe Frankkia.`,
        },
        cancelado: { icon: Clock, cor: "", titulo: "", texto: "" },
      }[p.pagamento];
  const Icon = cfg.icon;

  if (compact)
    return (
      <button
        onClick={() =>
          p.pagamento === "aguardando" && !reducao
            ? navigate(`/checkout/${p.id}`)
            : navigate("/app/configuracoes?aba=plano")
        }
        className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[0.6875rem] font-semibold ${cfg.cor}`}
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">
          {p.pagamento === "aguardando" && !reducao
            ? `Concluir pagamento do ${p.planoNovo}`
            : cfg.titulo}
        </span>
      </button>
    );

  return (
    <div className={`flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center ${cfg.cor}`}>
      <Icon className="size-6 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{cfg.titulo}</p>
        <p className="text-sm opacity-80">
          {cfg.texto} Pedido criado {relTime(p.criadoEm)}.
        </p>
      </div>
      {p.pagamento === "aguardando" && !reducao && (
        <button onClick={() => navigate(`/checkout/${p.id}`)} className={btn.primary}>
          Concluir pagamento <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}

/** Cartão de incentivo: aparece quando o uso do plano passa de `aPartirDe` (0 a 1). */
export function UpgradeNudge({
  aPartirDe = 0.7,
  compact = false,
}: {
  aPartirDe?: number;
  compact?: boolean;
}) {
  useStore();
  const [open, setOpen] = useState(false);
  const uso = usoDoPlano();
  const prox = proximoPlano();

  // Com um pedido em andamento, mostra o status em vez do convite
  if (pedidoAberto(imobiliaria.id)) return <PedidoUpgradeStatus compact={compact} />;
  if (!prox || uso < aPartirDe) return null;
  const cheio = uso >= 1;

  return (
    <>
      {compact ? (
        <button onClick={() => setOpen(true)} className={`${btn.accent} h-9 w-full text-xs`}>
          <Sparkles className="size-3.5" /> Fazer upgrade
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-accent to-accent-deep p-6 text-white"
        >
          <Sparkles className="absolute -right-4 -top-4 size-28 text-white/10" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            {cheio ? "Plano cheio" : "Sua equipe está crescendo"}
          </p>
          <p className="mt-2 font-display text-xl font-semibold leading-snug">
            {cheio
              ? "Todas as vagas estão em uso."
              : `${Math.round(uso * 100)}% das vagas já estão em uso.`}{" "}
            Libere mais {PLANOS[prox].limite - imobiliaria.limiteCorretores} vagas com o plano{" "}
            {prox}.
          </p>
          <ProgressBar value={uso} className="mt-4 h-1.5 bg-white/20 [&>div]:bg-white" />
          <button
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-accent-deep transition hover:bg-white/90"
          >
            <Rocket className="size-4" /> Ver planos
          </button>
        </motion.div>
      )}
      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
