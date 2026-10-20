import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarCheck, Eye, EyeOff } from "lucide-react";
import { site } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo, Scaled } from "@/components/ui";
import { Dashboard, DASHBOARD_SIZE } from "@/components/mockups/Dashboard";
import { inicioDe, useSession } from "@/app/session";
import { mensagemErro, setLembrar, supabase } from "@/integrations/frankkia/client";

const field =
  "h-12 w-full rounded-2xl border border-line-strong bg-bg px-4 text-[0.9375rem] outline-hidden transition-colors placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10";

/** Tela de login: e-mail e senha no Supabase. O papel (Frankkia, administrador, corretor) vem do banco. */
export default function Login() {
  const [show, setShow] = useState(false);
  const { modo, role, carregando } = useSession();
  const loc = useLocation();
  const destino = (loc.state as { de?: string } | null)?.de;
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrarState] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Já entrou de verdade: vai direto para a sua área
  if (modo === "real" && !carregando) return <Navigate to={destino ?? inicioDe(role)} replace />;

  const entrar = async () => {
    setErro(null);
    setAviso(null);
    setEnviando(true);
    setLembrar(lembrar);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
    setEnviando(false);
    if (error) setErro(mensagemErro(error));
    // sucesso: a sessão muda e o redirecionamento acima leva para a área certa
  };

  const esqueci = async () => {
    setErro(null);
    setAviso(null);
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setErro("Digite seu e-mail no campo acima e clique de novo em “Esqueceu a senha?”.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(e, { redirectTo: `${window.location.origin}/redefinir-senha` });
    if (error) setErro(mensagemErro(error));
    else setAviso("Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha.");
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
              entrar();
            }}
          >
            <input className={field} type="email" placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="relative">
              <input
                className={`${field} pr-12`}
                type={show ? "text" : "password"}
                placeholder="Senha"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
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
                <input type="checkbox" className="size-4 accent-accent" checked={lembrar} onChange={(e) => setLembrarState(e.target.checked)} /> Lembrar de
                mim
              </label>
              <button type="button" onClick={esqueci} className="font-medium text-accent hover:text-accent-deep">
                Esqueceu a senha?
              </button>
            </div>
            {erro && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}
            {aviso && <p className="rounded-xl bg-verified-soft px-3 py-2 text-sm text-verified">{aviso}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="group/button inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-bg transition-[background-color,transform] hover:bg-ink/85 active:scale-[0.98] disabled:opacity-60"
            >
              {enviando ? "Entrando..." : "Entrar"}
              <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
            </button>
          </form>

          <Link
            to="/apresentacao"
            className="group/cta mt-8 flex items-center gap-4 rounded-2xl border border-dashed border-line-strong bg-canvas/60 p-4 transition-colors hover:border-accent/50 hover:bg-accent-soft/40"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <CalendarCheck className="size-5" />
            </span>
            <span className="flex-1 text-sm">
              <span className="block font-semibold text-ink">Quer conhecer a Frankkia?</span>
              <span className="text-muted">Agende uma apresentação sem compromisso com a nossa equipe.</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-accent transition-transform group-hover/cta:translate-x-0.5" />
          </Link>
        </motion.div>

        <p className="text-center text-xs text-subtle">
          Ainda não é cliente?{" "}
          <Link to="/" className="font-medium text-ink hover:text-accent">
            Conheça os planos
          </Link>
        </p>
      </div>

      {/* Painel visual */}
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
