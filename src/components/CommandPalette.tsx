import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Hash, Mail, Search, Sparkles, Tag } from "lucide-react";
import { features, nav, pricing, site } from "@/content";
import { EASE_OUT_EXPO, scrollToId } from "@/lib/scroll";

type Item = { label: string; hint: string; run: () => void; icon: typeof Hash };

/** Busca rápida com Ctrl/Cmd + K. */
export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => input.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const all: Item[] = [
      { label: "Início", hint: "Seção", icon: Hash, run: () => scrollToId("top") },
      ...nav.map((n) => ({ label: n.label, hint: "Seção", icon: Hash, run: () => scrollToId(n.id) })),
      { label: "Solicitar demonstração", hint: "Seção", icon: Hash, run: () => scrollToId("contato") },
      ...features.items.map((f) => ({ label: f.title, hint: "Função", icon: Sparkles, run: () => scrollToId("funcoes") })),
      ...pricing.plans.map((p) => ({ label: p.name, hint: `R$ ${p.price}/mês`, icon: Tag, run: () => scrollToId("planos") })),
      { label: "Enviar e-mail", hint: site.email, icon: Mail, run: () => (window.location.href = `mailto:${site.email}`) },
    ];
    const s = q.trim().toLowerCase();
    return s ? all.filter((i) => (i.label + " " + i.hint).toLowerCase().includes(s)) : all;
  }, [q]);

  const choose = (i: Item) => {
    setOpen(false);
    setTimeout(i.run, 120);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/30 px-4 pt-[15vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: 16, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[34rem] overflow-hidden rounded-2xl border border-line bg-bg shadow-float"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 text-muted" />
              <input
                ref={input}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSel((s) => Math.min(items.length - 1, s + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSel((s) => Math.max(0, s - 1));
                  } else if (e.key === "Enter" && items[sel]) choose(items[sel]);
                }}
                placeholder="Buscar seções, funções, planos..."
                className="h-14 flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-subtle"
              />
              <kbd className="rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted">esc</kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2" data-lenis-prevent>
              {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Nada encontrado.</li>}
              {items.map((it, i) => (
                <li key={it.label + i}>
                  <button
                    onMouseEnter={() => setSel(i)}
                    onClick={() => choose(it)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${i === sel ? "bg-canvas" : ""}`}
                  >
                    <span className="grid size-7 place-items-center rounded-lg border border-line bg-bg text-muted">
                      <it.icon className="size-3.5" />
                    </span>
                    <span className="flex-1 font-medium">{it.label}</span>
                    <span className="text-xs text-muted">{it.hint}</span>
                    {i === sel && <CornerDownLeft className="size-3.5 text-muted" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
