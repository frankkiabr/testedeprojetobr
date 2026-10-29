import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/scroll";

const CHAVE = "frankkia-aviso-cookies";

/**
 * Aviso discreto de cookies (site, portal e plataforma): aparece uma vez e some no "Entendi".
 * Não bloqueia nada: os cookies são os necessários e a medição de visitas da hospedagem (detalhes em /privacidade).
 */
export function AvisoCookies() {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(CHAVE)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setAberto(true), 1200);
    return () => clearTimeout(t);
  }, []);
  const fechar = () => {
    setAberto(false);
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* navegador sem armazenamento: o aviso volta na próxima visita */
    }
  };
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          role="region"
          aria-label="Aviso de cookies"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="fixed inset-x-4 bottom-20 z-50 rounded-2xl border border-line bg-bg/95 p-4 text-sm text-ink shadow-float backdrop-blur-md sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-80 print:hidden"
        >
          <p className="flex gap-2.5 text-muted">
            <Cookie className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>Usamos cookies essenciais e um medidor de visitas, sem publicidade.</span>
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <a href="/privacidade" className="rounded-full px-3 py-2 text-xs font-semibold text-muted transition hover:bg-canvas hover:text-ink">
              Saiba mais
            </a>
            <button onClick={fechar} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-bg transition hover:bg-ink/85 active:scale-[0.98]">
              Entendi
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
