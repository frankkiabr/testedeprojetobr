import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/scroll";

/** Item que sobe e aparece ao entrar na tela (mesmo movimento do site e do painel). */
export function Surge({
  children,
  delay = 0,
  className = "",
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Entrada da página inteira ao abrir ou trocar de página (como no painel). */
export function EntradaPagina({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}
