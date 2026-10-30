import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

/**
 * Menu lateral recolhido (só os ícones) ou aberto. Muda apenas pelo botão do topo, nunca sozinho,
 * e a escolha fica guardada neste navegador.
 */
export function useMenuRecolhido(chave: string) {
  const [recolhido, setRecolhido] = useState(() => {
    try {
      return localStorage.getItem(chave) === "1";
    } catch {
      return false;
    }
  });
  const alternar = () =>
    setRecolhido((x) => {
      try {
        localStorage.setItem(chave, x ? "0" : "1");
      } catch {
        /* sem armazenamento: vale só nesta visita */
      }
      return !x;
    });
  return { recolhido, alternar };
}

/** Botão do topo (computador) que recolhe ou abre o menu lateral. */
export function BotaoRecolher({ recolhido, onClick }: { recolhido: boolean; onClick: () => void }) {
  const Icone = recolhido ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      onClick={onClick}
      aria-label={recolhido ? "Abrir menu lateral" : "Recolher menu lateral"}
      title={recolhido ? "Abrir menu" : "Recolher menu"}
      className="hidden size-10 place-items-center rounded-full text-muted transition hover:bg-canvas hover:text-ink lg:grid"
    >
      <Icone className="size-5" />
    </button>
  );
}
