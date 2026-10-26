import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Barcode, CheckCircle2, Clock, CreditCard, Lock, QrCode, ShieldCheck, XCircle } from "lucide-react";
import { imobiliaria } from "@/data/demo";
import { pedidoById, PLANOS } from "@/data/platform";
import { useStore } from "@/data/store";
import type { PedidoUpgrade } from "@/data/types";
import { DESCONTO_ANUAL, precoPlano, totalAnual } from "@/lib/planos";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo } from "@/components/ui";
import { Segmented } from "@/app/kit";
import { btn } from "@/app/forms";
import { useSession } from "@/app/session";
import { abrirPagamentoStripe } from "@/integrations/frankkia/client";
import { recarregarDados } from "@/data/sync";

type Metodo = NonNullable<PedidoUpgrade["metodo"]>;

/**
 * PAGAMENTO DO UPGRADE (simulação).
 * Na versão real, o botão "Ir para pagamento" abre o Stripe Checkout (página segura da Stripe),
 * e a confirmação chega por webhook no Lovable Cloud. Aqui não há campos de cartão:
 * você só escolhe o resultado para ver o fluxo completo.
 */
export default function Checkout() {
  const { id } = useParams();
  const store = useStore();
  const { modo, carregando, recarregar } = useSession();
  const pedido = id ? pedidoById(id) : undefined;
  const [metodo, setMetodo] = useState<Metodo>("cartao");
  const [processando, setProcessando] = useState(false);
  const [semStripe, setSemStripe] = useState(false);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);
  const [params] = useSearchParams();
  const voltouDaStripe = params.get("pagamento") === "ok";
  const [esperou, setEsperou] = useState(false);

  // Voltou da Stripe: o aviso de pagamento chega ao banco em segundos; recarrega até aparecer
  const aguardando = pedido?.pagamento === "aguardando";

  // Plano liberado: atualiza a conta (fim do teste grátis, novo limite de vagas) uma única vez
  const liberado = !!pedido?.liberado;
  const contaAtualizada = useRef(false);
  useEffect(() => {
    if (modo === "real" && voltouDaStripe && liberado && !contaAtualizada.current) {
      contaAtualizada.current = true;
      recarregar();
    }
  }, [modo, voltouDaStripe, liberado]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (modo !== "real" || !voltouDaStripe || !aguardando) return;
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      recarregarDados();
      if (n >= 10) {
        setEsperou(true);
        clearInterval(t);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [modo, voltouDaStripe, aguardando]);

  const pagarComStripe = async () => {
    if (!pedido) return;
    setErroPagamento(null);
    setProcessando(true);
    const r = await abrirPagamentoStripe(pedido.id);
    if (r.url) {
      window.location.href = r.url;
      return;
    }
    // Já assinava: a troca foi feita na mesma assinatura (cobrou só a diferença)
    if (r.atualizado) {
      window.location.href = `/checkout/${pedido.id}?pagamento=ok`;
      return;
    }
    setProcessando(false);
    if (r.erro === "STRIPE_NAO_CONFIGURADA") setSemStripe(true);
    else if (r.erro === "PAGAMENTO_RECUSADO") setErroPagamento("O cartão da assinatura recusou a cobrança da diferença. Atualize o cartão e tente de novo.");
    else if (r.erro === "PEDIDO_JA_PAGO") recarregarDados();
    else setErroPagamento("Não foi possível abrir o pagamento agora. Tente de novo em instantes.");
  };

  if (carregando) return <Shell>{null}</Shell>;
  if (!pedido) {
    return (
      <Shell>
        <div className="rounded-3xl border border-line bg-bg p-10 text-center">
          <h1 className="type-title">Pedido não encontrado</h1>
          <p className="mt-3 text-muted">Este pedido não existe mais ou foi cancelado.</p>
          <Link to="/app/configuracoes" className="mt-6 inline-block text-sm font-semibold text-accent">
            Voltar para Configurações
          </Link>
        </div>
      </Shell>
    );
  }

  const pagar = (resultado: "confirmado" | "pendente" | "cancelado") => {
    setProcessando(true);
    setTimeout(() => {
      store.registrarPagamento(pedido.id, resultado, metodo);
      setProcessando(false);
    }, 1100);
  };

  const vagasExtras = PLANOS[pedido.planoNovo].limite - PLANOS[pedido.planoAtual].limite;
  const anual = pedido.ciclo === "anual";
  // Anual: 12 meses pelo preço de 10, cobrado de uma vez
  const cobranca = anual ? `${precoPlano(totalAnual(pedido.valorMensal))}/ano` : `${precoPlano(pedido.valorMensal)}/mês`;
  const finalizado = pedido.pagamento !== "aguardando";

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Resumo do pedido */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT_EXPO }} className="relative overflow-hidden rounded-3xl bg-ink p-7 text-bg">
          <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_100%_0%,rgb(47_91_234/0.5),transparent_70%)]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-bg/60">Upgrade de plano</p>
            <p className="mt-3 font-display text-3xl font-semibold tracking-tight">{pedido.planoNovo}</p>
            <p className="mt-1 text-bg/70">{imobiliaria.nome}</p>
            <dl className="mt-8 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-bg/60">Plano atual</dt>
                <dd>{pedido.planoAtual}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-bg/60">Novo limite</dt>
                <dd>
                  {PLANOS[pedido.planoNovo].limite} corretores <span className="text-verified">(+{vagasExtras})</span>
                </dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base">
                <dt className="font-semibold">{anual ? "Total anual" : "Total mensal"}</dt>
                <dd className="text-right">
                  <span className="font-display text-2xl font-semibold">{precoPlano(anual ? totalAnual(pedido.valorMensal) : pedido.valorMensal)}</span>
                  {anual && (
                    <span className="block text-xs text-bg/60">
                      12 meses pelo preço de 10 (-{DESCONTO_ANUAL}%) · em vez de {precoPlano(pedido.valorMensal * 12)}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-xs leading-relaxed text-bg/50">
              Se você já tem uma assinatura, a troca é feita nela mesma: a Stripe cobra agora só a diferença proporcional, no cartão já cadastrado, e o novo valor vale a partir da próxima cobrança.
            </p>
          </div>
        </motion.div>

        {/* Pagamento */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="rounded-3xl border border-line bg-bg p-7"
        >
          {/* Sem esperar animação de saída: a tela de resultado entra direto. */}
          {finalizado ? (
              <Resultado key="fim" pedido={pedido} />
            ) : modo === "real" && voltouDaStripe ? (
              <motion.div key="confirmando" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <Clock className="size-7 animate-pulse" />
                </span>
                <h2 className="type-subtitle mt-5">Confirmando seu pagamento...</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                  {esperou
                    ? "A Stripe recebeu o pagamento e a confirmação pode levar alguns minutos. Você pode voltar para a plataforma: o status atualiza sozinho."
                    : "Só um instante: estamos recebendo a confirmação da Stripe."}
                </p>
                <Link to="/app/configuracoes?aba=plano" className={`${btn.primary} mt-7`}>
                  Voltar para a plataforma
                </Link>
              </motion.div>
            ) : modo === "real" && !semStripe ? (
              <motion.div key="stripe" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-xl font-semibold">Pagamento</h1>
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <Lock className="size-3.5" /> Processado pela Stripe
                  </span>
                </div>
                <p className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-line-strong bg-canvas/60 p-5 text-sm">
                  <CreditCard className="mt-0.5 size-5 shrink-0 text-accent" />
                  <span>
                    Você vai para a <span className="font-semibold">página segura da Stripe</span> para digitar o cartão. A Frankkia nunca vê nem guarda o número do
                    cartão. A cobrança é mensal e pode ser cancelada quando quiser.
                  </span>
                </p>
                {erroPagamento && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{erroPagamento}</p>}
                <button disabled={processando} onClick={pagarComStripe} className={`${btn.accent} mt-6 h-12 w-full`}>
                  {processando ? "Abrindo a Stripe..." : `Pagar ${cobranca} com cartão`}
                  {!processando && <ArrowRight className="size-4" />}
                </button>
                <button onClick={() => store.cancelarPedidoUpgrade(pedido.id)} className={`${btn.outline} mt-2 w-full`}>
                  Cancelar pedido
                </button>
              </motion.div>
            ) : modo === "real" ? (
              <motion.div key="combinar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <Clock className="size-7" />
                </span>
                <h1 className="type-subtitle mt-5">Pedido recebido</h1>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                  O pagamento online ainda está sendo configurado. A equipe Frankkia entra em contato para combinar o pagamento e libera o plano {pedido.planoNovo}{" "}
                  assim que ele for confirmado.
                </p>
                <p className="mt-4 font-mono text-xs text-subtle">Ref.: {pedido.referencia}</p>
                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  <Link to="/app/configuracoes?aba=plano" className={btn.primary}>
                    Voltar para a plataforma
                  </Link>
                  <button onClick={() => store.cancelarPedidoUpgrade(pedido.id)} className={btn.outline}>
                    Cancelar pedido
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="pagar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-xl font-semibold">Pagamento</h1>
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <Lock className="size-3.5" /> Processado pela Stripe
                  </span>
                </div>

                <div className="mt-5">
                  <Segmented
                    id="metodo"
                    value={metodo}
                    onChange={setMetodo}
                    options={[
                      { value: "cartao", label: "Cartão" },
                      { value: "pix", label: "PIX" },
                      { value: "boleto", label: "Boleto" },
                    ]}
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-dashed border-line-strong bg-canvas/60 p-5 text-sm">
                  {metodo === "cartao" && (
                    <p className="flex items-start gap-3">
                      <CreditCard className="mt-0.5 size-5 shrink-0 text-accent" />
                      <span>
                        Na versão final, os dados do cartão são digitados <span className="font-semibold">na página segura da Stripe</span>. A Frankkia nunca vê nem guarda o número
                        do cartão. A aprovação costuma ser imediata.
                      </span>
                    </p>
                  )}
                  {metodo === "pix" && (
                    <p className="flex items-start gap-3">
                      <QrCode className="mt-0.5 size-5 shrink-0 text-accent" />
                      <span>A Stripe gera um QR Code PIX. A confirmação chega em segundos depois que o cliente paga pelo app do banco.</span>
                    </p>
                  )}
                  {metodo === "boleto" && (
                    <p className="flex items-start gap-3">
                      <Barcode className="mt-0.5 size-5 shrink-0 text-accent" />
                      <span>A Stripe gera o boleto. A compensação leva até 3 dias úteis; enquanto isso, o pedido fica como “pagamento pendente”.</span>
                    </p>
                  )}
                </div>

                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Simular resultado</p>
                <div className="mt-3 grid gap-2">
                  <button disabled={processando} onClick={() => pagar(metodo === "boleto" ? "pendente" : "confirmado")} className={`${btn.accent} h-12`}>
                    {processando ? "Processando..." : metodo === "boleto" ? "Simular boleto gerado" : "Simular pagamento aprovado"}
                    {!processando && <ArrowRight className="size-4" />}
                  </button>
                  <button disabled={processando} onClick={() => pagar("cancelado")} className={btn.outline}>
                    Simular pagamento recusado
                  </button>
                </div>
                <p className="mt-5 flex items-center gap-1.5 text-xs text-subtle">
                  <ShieldCheck className="size-3.5" /> Demonstração: nenhum pagamento real é feito.
                </p>
              </motion.div>
            )}
        </motion.div>
      </div>
    </Shell>
  );
}

function Resultado({ pedido }: { pedido: PedidoUpgrade }) {
  const cfg = {
    confirmado: {
      icon: <CheckCircle2 className="size-7" />,
      cor: "bg-verified-soft text-verified",
      titulo: pedido.liberado ? `Plano ${pedido.planoNovo} liberado!` : "Pagamento confirmado!",
      texto: pedido.liberado
        ? `Tudo certo: as vagas do plano ${pedido.planoNovo} já estão disponíveis. Você já pode convidar novos corretores.`
        : `A equipe Frankkia já recebeu o seu pedido e vai liberar o plano ${pedido.planoNovo} em instantes. Você será avisado assim que as novas vagas estiverem disponíveis.`,
    },
    pendente: {
      icon: <Clock className="size-7" />,
      cor: "bg-amber-100 text-amber-700",
      titulo: "Boleto gerado",
      texto: "Assim que o banco confirmar o pagamento (até 3 dias úteis), a equipe Frankkia libera o novo plano.",
    },
    cancelado: {
      icon: <XCircle className="size-7" />,
      cor: "bg-rose-100 text-rose-700",
      titulo: "Pagamento não aprovado",
      texto: "Nada foi cobrado. Você pode tentar de novo com outro método de pagamento em Configurações › Plano.",
    },
    aguardando: { icon: null, cor: "", titulo: "", texto: "" },
  }[pedido.pagamento];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: EASE_OUT_EXPO }} className="py-6 text-center">
      <span className={`mx-auto grid size-16 place-items-center rounded-2xl ${cfg.cor}`}>{cfg.icon}</span>
      <h2 className="type-subtitle mt-5">{cfg.titulo}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{cfg.texto}</p>
      <p className="mt-4 font-mono text-xs text-subtle">Ref.: {pedido.referencia}</p>
      <Link to="/app/configuracoes?aba=plano" className={`${btn.primary} mt-7`}>
        Voltar para a plataforma
      </Link>
    </motion.div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas/60">
      <header className="flex h-16 items-center justify-between border-b border-line bg-bg px-6">
        <Logo className="text-[1.75rem]" />
        <Link to="/app/configuracoes?aba=plano" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
}
