import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Barcode, CheckCircle2, Clock, CreditCard, Info, QrCode, Rocket, XCircle } from "lucide-react";
import { clienteNome, pedidosUpgrade, PLANOS } from "@/data/platform";
import { useStore } from "@/data/store";
import type { PedidoUpgrade } from "@/data/types";
import { brl, relTime } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Badge, Card, PageHeader, Segmented, stagger } from "../kit";
import { btn, EmptyState, Modal } from "../forms";

type Filtro = "liberar" | "pagamento" | "concluidos" | "todos";

const PAGAMENTO: Record<PedidoUpgrade["pagamento"], { label: string; tone: "verified" | "warn" | "danger" | "neutral" }> = {
  confirmado: { label: "Pagamento confirmado", tone: "verified" },
  pendente: { label: "Pagamento pendente", tone: "warn" },
  aguardando: { label: "Aguardando pagamento", tone: "neutral" },
  cancelado: { label: "Pagamento recusado/cancelado", tone: "danger" },
};
const METODO = { cartao: { label: "Cartão", icon: CreditCard }, pix: { label: "PIX", icon: QrCode }, boleto: { label: "Boleto", icon: Barcode } };

/** Pedidos de upgrade de todas as imobiliárias. Pagamento confirmado → botão para liberar o plano. */
export default function Upgrades() {
  const { liberarUpgrade, confirmarPagamentoManual } = useStore();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<Filtro>("liberar");
  const [confirmar, setConfirmar] = useState<PedidoUpgrade | null>(null);

  const aLiberar = pedidosUpgrade.filter((p) => p.pagamento === "confirmado" && !p.liberado);
  const emPagamento = pedidosUpgrade.filter((p) => !p.liberado && (p.pagamento === "pendente" || p.pagamento === "aguardando"));
  const concluidos = pedidosUpgrade.filter((p) => p.liberado || p.pagamento === "cancelado");
  const lista = { liberar: aLiberar, pagamento: emPagamento, concluidos, todos: pedidosUpgrade }[filtro];

  return (
    <div className="space-y-5">
      <motion.div {...stagger(0)}>
        <PageHeader title="Pedidos de upgrade" subtitle="Imobiliárias que escolheram um plano maior. Libere o novo plano assim que o pagamento for confirmado." />
      </motion.div>

      <motion.div {...stagger(1)} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Segmented
          id="upgrades"
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "liberar", label: `Prontos para liberar (${aLiberar.length})` },
            { value: "pagamento", label: `Aguardando pagamento (${emPagamento.length})` },
            { value: "concluidos", label: "Concluídos" },
            { value: "todos", label: "Todos" },
          ]}
        />
      </motion.div>

      <motion.div {...stagger(2)}>
        <Card className="overflow-hidden">
          {lista.length === 0 ? (
            <EmptyState icon={<Rocket className="size-6" />} title="Nenhum pedido aqui" text="Quando uma imobiliária pagar um upgrade, o pedido aparece em “Prontos para liberar”." />
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {lista.map((p, i) => {
                  const M = p.metodo ? METODO[p.metodo] : null;
                  const extras = PLANOS[p.planoNovo].limite - PLANOS[p.planoAtual].limite;
                  return (
                    <motion.li
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.35, delay: Math.min(i, 10) * 0.03, ease: EASE_OUT_EXPO }}
                      className="flex flex-col gap-4 border-b border-line px-5 py-4 last:border-0 lg:flex-row lg:items-center sm:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <button onClick={() => navigate(`/admin/imobiliarias?id=${p.imobiliariaId}`)} className="truncate text-left font-semibold hover:text-accent">
                          {clienteNome(p.imobiliariaId)}
                        </button>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                          {p.planoAtual} <ArrowRight className="size-3.5" /> <span className="font-semibold text-ink">{p.planoNovo}</span>
                          <span>· {extras > 0 ? `+${extras} vagas` : "contratação do plano"} · {brl(p.valorMensal)}/mês</span>
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-subtle">
                          Pedido {relTime(p.criadoEm)}
                          {M && (
                            <span className="inline-flex items-center gap-1">
                              · <M.icon className="size-3" /> {M.label}
                            </span>
                          )}
                          <span className="font-mono">· {p.referencia}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {p.liberado ? (
                          <Badge tone="verified">
                            <CheckCircle2 className="mr-1 size-3" /> Liberado {p.liberadoEm ? relTime(p.liberadoEm) : ""}
                          </Badge>
                        ) : (
                          <Badge tone={PAGAMENTO[p.pagamento].tone}>
                            {p.pagamento === "confirmado" ? (
                              <CheckCircle2 className="mr-1 size-3" />
                            ) : p.pagamento === "cancelado" ? (
                              <XCircle className="mr-1 size-3" />
                            ) : (
                              <Clock className="mr-1 size-3" />
                            )}
                            {PAGAMENTO[p.pagamento].label}
                          </Badge>
                        )}
                        {(p.pagamento === "aguardando" || p.pagamento === "pendente") && !p.liberado && (
                          <button
                            onClick={() => confirmarPagamentoManual(p.id)}
                            title="Use quando receber o pagamento por fora (PIX, transferência), enquanto a Stripe não está ligada"
                            className={btn.outline}
                          >
                            <CheckCircle2 className="size-4" /> Confirmar pagamento
                          </button>
                        )}
                        {p.pagamento === "confirmado" && !p.liberado && (
                          <button onClick={() => setConfirmar(p)} className={btn.accent}>
                            <Rocket className="size-4" /> Liberar plano
                          </button>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </motion.div>

      <motion.p {...stagger(3)} className="flex items-start gap-2 text-sm text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        Pagamentos pela Stripe liberam o plano sozinhos, na hora. Para pagamentos combinados por fora (PIX ou transferência), use “Confirmar pagamento” e
        depois “Liberar plano”.
      </motion.p>

      <Modal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        title="Liberar novo plano?"
        footer={
          <>
            <button onClick={() => setConfirmar(null)} className={btn.outline}>
              Cancelar
            </button>
            <button
              onClick={() => {
                if (confirmar) liberarUpgrade(confirmar.id);
                setConfirmar(null);
              }}
              className={btn.accent}
            >
              <Rocket className="size-4" /> Liberar agora
            </button>
          </>
        }
      >
        {confirmar && (
          <p className="text-sm text-muted">
            A <span className="font-semibold text-ink">{clienteNome(confirmar.imobiliariaId)}</span> passa para o plano{" "}
            <span className="font-semibold text-ink">{confirmar.planoNovo}</span> e ganha{" "}
            <span className="font-semibold text-verified">+{PLANOS[confirmar.planoNovo].limite - PLANOS[confirmar.planoAtual].limite} vagas</span> na hora. O administrador já pode
            convidar novos corretores.
          </p>
        )}
      </Modal>
    </div>
  );
}
