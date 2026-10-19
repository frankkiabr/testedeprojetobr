import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo } from "@/components/ui";
import { Field, inputCls } from "@/app/forms";
import { inicioDe, useSession } from "@/app/session";
import { mensagemErro, supabase } from "@/integrations/supabase/client";

/** Nova senha, a partir do link "Esqueceu a senha?" enviado por e-mail. */
export default function RedefinirSenha() {
  const { modo, carregando, role } = useSession();
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const ok = senha.length >= 8 && senha === confirma;

  const salvar = async () => {
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) setErro(mensagemErro(error));
    else navigate(inicioDe(role), { replace: true });
  };

  return (
    <div className="min-h-screen bg-canvas/60">
      <header className="flex h-16 items-center border-b border-line bg-bg px-6">
        <Link to="/">
          <Logo className="text-[1.75rem]" />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-md px-4 py-12">
        {carregando ? null : modo !== "real" ? (
          <div className="rounded-3xl border border-line bg-bg p-10 text-center">
            <h1 className="type-title">Link inválido ou expirado</h1>
            <p className="mt-3 text-muted">Peça um novo link em “Esqueceu a senha?”, na tela de login.</p>
            <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-accent">
              Ir para o login
            </Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}>
            <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
              <KeyRound className="size-6" />
            </span>
            <h1 className="type-title mt-6">Crie uma nova senha</h1>
            <form
              className="mt-8 space-y-4 rounded-3xl border border-line bg-bg p-6 sm:p-8"
              onSubmit={(e) => {
                e.preventDefault();
                if (ok) salvar();
              }}
            >
              <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
                <input autoFocus type="password" className={inputCls} value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
              </Field>
              <Field label="Confirme a senha" hint={confirma && confirma !== senha ? "As senhas não conferem." : undefined}>
                <input type="password" className={inputCls} value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" />
              </Field>
              {erro && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}
              <button
                type="submit"
                disabled={!ok || enviando}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-bg transition hover:bg-ink/85 disabled:pointer-events-none disabled:opacity-40"
              >
                {enviando ? "Salvando..." : "Salvar e entrar"} <ArrowRight className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </main>
    </div>
  );
}
