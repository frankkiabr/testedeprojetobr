import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle2, ShieldCheck } from "lucide-react";
import { site } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo, Scaled } from "@/components/ui";
import { Dashboard, DASHBOARD_SIZE } from "@/components/mockups/Dashboard";
import { CampoArmadilha, TAMANHOS_EQUIPE, useFormInteressado } from "@/components/FormInteressado";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

const field =
  "h-12 w-full rounded-2xl border border-line-strong bg-bg px-4 text-[0.9375rem] outline-hidden transition-colors placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10";

/**
 * PÁGINA DE APRESENTAÇÃO (captura).
 * O dono da imobiliária pede uma apresentação sem compromisso; a equipe Frankkia responde pelo WhatsApp em até 24h.
 * Os pedidos aparecem no painel Frankkia, em "Interessados".
 */
export default function Apresentacao() {
  // Vindo de um plano da página inicial: a quantidade de corretores já chega escolhida
  const [params] = useSearchParams();
  const equipe = params.get("equipe") ?? "";
  const form = useFormInteressado("pagina", { equipe: TAMANHOS_EQUIPE.includes(equipe) ? equipe : "" });

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo className="text-[1.75rem]" />
          </Link>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Voltar ao login
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="mx-auto my-auto w-full max-w-md py-12"
        >
          {form.enviado ? (
            <div className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-verified-soft text-verified">
                <CheckCircle2 className="size-7" />
              </span>
              <h1 className="type-title mt-6">Pedido recebido!</h1>
              <p className="mt-3 text-muted">
                Obrigado pelo interesse. A equipe Frankkia vai falar com você pelo <span className="font-semibold text-ink">WhatsApp em até 24 horas</span> para
                combinar a apresentação.
              </p>
              <Link
                to="/"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-bg transition hover:bg-ink/85"
              >
                Conhecer o site <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <>
              <p className="type-eyebrow text-accent">Apresentação sem compromisso</p>
              <h1 className="type-title mt-3">Conheça a Frankkia por dentro</h1>
              <p className="mt-3 text-muted">
                Deixe seu contato e mostramos a plataforma funcionando com a rotina da sua imobiliária. Respondemos pelo WhatsApp em até 24 horas.
              </p>

              <form onSubmit={form.enviar} className="relative mt-8 space-y-3">
                <CampoArmadilha {...form.campo("site")} />
                <input className={field} placeholder="Seu nome" autoComplete="name" {...form.campo("nome")} />
                <input className={field} placeholder="Nome da imobiliária" autoComplete="organization" {...form.campo("imobiliaria")} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={field} placeholder="E-mail" type="email" autoComplete="email" {...form.campo("email")} />
                  <input className={field} placeholder="WhatsApp com DDD" type="tel" inputMode="tel" autoComplete="tel" {...form.campo("telefone")} />
                </div>
                <select className={`${field} ${form.f.equipe ? "" : "text-subtle"}`} {...form.campo("equipe")}>
                  <option value="">Quantidade de corretores (opcional)</option>
                  {TAMANHOS_EQUIPE.map((s) => (
                    <option key={s} className="text-ink">
                      {s}
                    </option>
                  ))}
                </select>
                <textarea
                  className={`${field} h-28 resize-none py-3`}
                  placeholder="Quer contar algo? Ex.: melhor horário para falar, o que mais te interessa... (opcional)"
                  maxLength={2000}
                  {...form.campo("mensagem")}
                />
                {form.erro && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{form.erro}</p>}
                <button
                  type="submit"
                  disabled={form.enviando}
                  className="group/button inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-bg transition-[background-color,transform] hover:bg-ink/85 active:scale-[0.98] disabled:opacity-60"
                >
                  {form.enviando ? "Enviando..." : "Quero uma apresentação"}
                  <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
                </button>
                <p className="text-center text-xs text-subtle">
                  Ao enviar, você concorda com a{" "}
                  <Link to="/privacidade" className="underline hover:text-muted">
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </form>

              <ul className="mt-8 space-y-2.5 text-sm text-muted">
                <li className="flex items-center gap-2.5">
                  <WhatsAppIcon className="size-4 shrink-0 text-accent" /> Primeiro contato pelo WhatsApp em até 24 horas.
                </li>
                <li className="flex items-center gap-2.5">
                  <CalendarCheck className="size-4 shrink-0 text-accent" /> Apresentação no horário que for melhor para você.
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 shrink-0 text-accent" /> Seus dados são usados só para este contato.
                </li>
              </ul>
            </>
          )}
        </motion.div>

        <p className="text-center text-xs text-subtle">
          Já é cliente?{" "}
          <Link to="/login" className="font-medium text-ink hover:text-accent">
            Entrar na Frankkia
          </Link>
        </p>
      </div>

      {/* Painel visual (igual ao do login) */}
      {/* Preso à altura da tela: o mockup fica sempre no mesmo lugar, mesmo com formulários mais longos */}
      <div className="relative hidden overflow-hidden bg-ink p-4 lg:sticky lg:top-0 lg:block lg:h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_10%,rgb(47_91_234/0.55),transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-between rounded-[2.25rem] p-10 text-bg">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="type-statement max-w-[34rem] !text-[3rem] !leading-[1.05]"
          >
            {site.slogan}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: EASE_OUT_EXPO }}
            className="-mb-24 -mr-40 overflow-hidden rounded-[28px] shadow-lift ring-8 ring-white/10"
          >
            <Scaled width={DASHBOARD_SIZE.width} height={DASHBOARD_SIZE.height}>
              <Dashboard active />
            </Scaled>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
