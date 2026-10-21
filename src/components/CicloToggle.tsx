import { motion } from "framer-motion";
import { DESCONTO_ANUAL, type Ciclo } from "@/lib/planos";

/** Escolha entre pagar por mês ou por ano (o anual mostra o desconto). */
export function CicloToggle({
  ciclo,
  onChange,
  escuro = false,
}: {
  ciclo: Ciclo;
  onChange: (c: Ciclo) => void;
  escuro?: boolean;
}) {
  const opcoes: { valor: Ciclo; rotulo: string }[] = [
    { valor: "mensal", rotulo: "Mensal" },
    { valor: "anual", rotulo: "Anual" },
  ];
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full p-1 ${escuro ? "bg-white/10" : "border border-line bg-canvas"}`}
      role="radiogroup"
      aria-label="Forma de pagamento"
    >
      {opcoes.map((o) => {
        const ativo = ciclo === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(o.valor)}
            className={`relative inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
              ativo ? "text-bg" : escuro ? "text-bg/70 hover:text-bg" : "text-muted hover:text-ink"
            }`}
          >
            {ativo && (
              <motion.span
                layoutId="ciclo-pilula"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{o.rotulo}</span>
            {o.valor === "anual" && (
              <span
                className={`relative rounded-full px-1.5 py-0.5 text-[0.6875rem] font-bold ${ativo ? "bg-verified text-white" : "bg-verified-soft text-verified"}`}
              >
                -{DESCONTO_ANUAL}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
