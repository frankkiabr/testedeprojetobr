import { useState } from "react";
import { mensagemErro, supabase } from "@/integrations/frankkia/client";

/**
 * Entrar com o Google (Supabase Auth, provedor Google). Volta para `caminho` já com a sessão.
 * `email`: sugere a conta certa na tela do Google (ex.: o e-mail do convite).
 */
export async function entrarComGoogle(caminho: string, email?: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${caminho}`,
      queryParams: { prompt: "select_account", ...(email ? { login_hint: email } : {}) },
    },
  });
  return error ? mensagemErro(error) : null;
}

export function LogoGoogle({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}

/** Botão "Continuar com o Google" + a linha "ou" abaixo (para separar do formulário de e-mail e senha). */
export function BotaoGoogle({ caminho, email, texto = "Continuar com o Google", antes }: { caminho: string; email?: string; texto?: string; antes?: () => void }) {
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={indo}
        onClick={async () => {
          setErro(null);
          setIndo(true);
          antes?.();
          const e = await entrarComGoogle(caminho, email);
          if (e) {
            setErro(e);
            setIndo(false);
          }
        }}
        className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line-strong bg-bg font-semibold transition hover:bg-canvas active:scale-[0.98] disabled:opacity-60"
      >
        <LogoGoogle /> {indo ? "Abrindo o Google..." : texto}
      </button>
      {erro && <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}
      <div className="my-6 flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-line" /> ou com e-mail <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
