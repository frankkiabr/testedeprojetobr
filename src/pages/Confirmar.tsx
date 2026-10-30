import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, MailWarning } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { site } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo } from "@/components/ui";
import { supabase } from "@/integrations/frankkia/client";

const TIPOS: EmailOtpType[] = ["signup", "recovery", "email_change", "invite", "magiclink", "email"];

/**
 * CONFIRMAÇÃO PELO E-MAIL (/confirmar?token_hash=...&type=...).
 * Os e-mails do login (confirmar conta, nova senha, troca de e-mail) apontam para cá, e não para o endereço do Supabase:
 * esta página confere o código com o Supabase e leva a pessoa para o lugar certo, já com a sessão aberta.
 */
export default function Confirmar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [erro, setErro] = useState(false);
  const feito = useRef(false);

  useEffect(() => {
    document.title = `Confirmando · ${site.name}`;
    if (feito.current) return; // o código vale uma vez só (o React pode rodar o efeito duas vezes)
    feito.current = true;
    const token = params.get("token_hash") ?? "";
    const tipo = params.get("type") as EmailOtpType;
    if (!token || !TIPOS.includes(tipo)) {
      setErro(true);
      return;
    }
    supabase.auth.verifyOtp({ token_hash: token, type: tipo }).then(({ error }) => {
      if (error) return setErro(true);
      if (tipo === "recovery") navigate("/redefinir-senha", { replace: true });
      else if (tipo === "email_change") navigate("/app/configuracoes?aba=perfil", { replace: true });
      else navigate("/app/visao-geral", { replace: true });
    });
  }, [params, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-canvas/60 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        className="w-full max-w-md rounded-3xl border border-line bg-bg p-10 text-center"
      >
        <Logo className="text-[1.75rem]" />
        {erro ? (
          <>
            <span className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <MailWarning className="size-6" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">Link expirado ou já usado</h1>
            <p className="mt-2 text-muted">
              Por segurança, cada link vale uma vez só e por pouco tempo. Entre com seu e-mail e senha; se precisar, peça um link novo em “Esqueceu a
              senha?”.
            </p>
            <Link to="/login" className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-bg">
              Ir para o login
            </Link>
          </>
        ) : (
          <p className="mt-8 flex items-center justify-center gap-2 text-muted">
            <Loader2 className="size-5 animate-spin" /> Confirmando...
          </p>
        )}
      </motion.div>
    </div>
  );
}
