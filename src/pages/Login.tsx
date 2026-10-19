import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Info } from "lucide-react";
import { site } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo, Scaled } from "@/components/ui";
import { Dashboard, DASHBOARD_SIZE } from "@/components/mockups/Dashboard";
import { useSession } from "@/app/session";
import type { Role } from "@/data/types";

const field =
  "h-12 w-full rounded-2xl border border-line-strong bg-bg px-4 text-[0.9375rem] outline-none transition-colors placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10";

/** Tela de login — visual. Na próxima fase, o Lovable Cloud cuida da autenticação. */
export default function Login() {
  const [show, setShow] = useState(false);
  const { setRole } = useSession();
  const navigate = useNavigate();

  const enter = (r: Role) => {
    setRole(r);
    navigate(r === "frankkia" ? "/admin" : "/app/visao-geral");
  };

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Formulário */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo className="text-[1.75rem]" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Voltar ao site
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="mx-auto my-auto w-full max-w-sm py-12"
        >
          <p className="type-eyebrow text-accent">Área do cliente</p>
          <h1 className="type-title mt-3">Entrar na Frankkia</h1>
          <p className="mt-3 text-muted">Acesse o universo da sua imobiliária.</p>

          <form
            className="mt-8 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              enter("admin");
            }}
          >
            <input className={field} type="email" placeholder="E-mail" autoComplete="off" />
            <div className="relative">
              <input className={`${field} pr-12`} type={show ? "text" : "password"} placeholder="Senha" autoComplete="off" />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-canvas"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" className="size-4 accent-accent" /> Lembrar de mim
              </label>
              <button type="button" className="font-medium text-accent hover:text-accent-deep">
                Esqueceu a senha?
              </button>
            </div>
            <button
              type="submit"
              className="group/button inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-bg transition-[background-color,transform] hover:bg-ink/85 active:scale-[0.98]"
            >
              Entrar
              <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-canvas/60 p-4">
            <p className="flex items-start gap-2 text-sm text-muted">
              <Info className="mt-0.5 size-4 shrink-0 text-accent" />
              Versão demonstrativa: o login ainda não está ativo. Escolha um perfil para explorar.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  ["admin", "Administrador"],
                  ["corretor", "Corretor"],
                  ["frankkia", "Frankkia"],
                ] as [Role, string][]
              ).map(([r, label]) => (
                <button
                  key={r}
                  onClick={() => enter(r)}
                  className="rounded-xl border border-line-strong bg-bg px-2 py-2 text-xs font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-bg"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-subtle">
          Ainda não é cliente?{" "}
          <Link to="/" className="font-medium text-ink hover:text-accent">
            Conheça os planos
          </Link>
        </p>
      </div>

      {/* Painel visual */}
      <div className="relative hidden overflow-hidden bg-ink p-4 lg:block">
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
