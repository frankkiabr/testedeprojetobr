/** Peças visuais reutilizadas em todas as telas internas. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { animate, AnimatePresence, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import type { Usuario } from "@/data/types";

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-3xl border border-line bg-bg ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
      <div className="min-w-0">
        <h3 className="font-display text-[1.0625rem] font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, foto }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; foto?: ReactNode }) {
  // No painel da imobiliária (/app) as páginas não repetem título e subtítulo (o menu já diz onde você está);
  // ficam só os botões e filtros. A saudação do Início (com foto) continua. O painel Frankkia (/admin) mantém os títulos.
  const { pathname } = useLocation();
  if (pathname.startsWith("/app") && !foto) return actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-4">
        {foto}
        <div className="min-w-0">
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-[2rem]">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Número que anima do valor anterior até o novo. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const c = animate(from.current, value, {
      duration: 1.1,
      ease: EASE_OUT_EXPO,
      onUpdate: (n) => {
        from.current = n;
        setV(n);
      },
    });
    return () => c.stop();
  }, [value]);
  return <>{format(v)}</>;
}

/** Variação percentual vs. período anterior. */
export function Delta({ current, previous, base = "mês anterior" }: { current: number; previous: number; base?: string }) {
  if (!previous) return <span className="text-xs text-subtle">sem base no {base}</span>;
  const d = ((current - previous) / previous) * 100;
  const up = d >= 0;
  return (
    <span className="text-xs text-muted">
      <span className={`inline-flex items-center font-semibold ${up ? "text-verified" : "text-rose-600"}`}>
        {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
        {Math.abs(d).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
      </span>{" "}
      vs. {base}
    </span>
  );
}

const AVATAR_COLORS = [
  "bg-accent-soft text-accent-deep",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-sky-100 text-sky-800",
];

/** Foto da pessoa; sem foto, as iniciais num círculo colorido. */
/** Iniciais de um nome (ex.: "Maria Souza" → "MS"; "Ed. Solar" → "ES"), para quem não tem foto. */
export const iniciaisDoNome = (nome: string) =>
  nome
    .replace(/[^\p{L}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter((x) => x.length > 2 || /^\p{Lu}/u.test(x))
    .map((x) => x[0])
    .filter((_, i, l) => i === 0 || i === l.length - 1)
    .join("")
    .toUpperCase() || "?";

/** Bolinha com a foto (se houver) ou as iniciais do nome: leads, proprietários, corretores, prédios. */
export function AvatarNome({ id, nome, fotoUrl, className = "size-9 text-xs" }: { id: string; nome: string; fotoUrl?: string; className?: string }) {
  return <Avatar user={{ id, nome, fotoUrl, iniciais: iniciaisDoNome(nome) }} className={className} />;
}

export function Avatar({ user, className = "size-9 text-xs" }: { user: Pick<Usuario, "id" | "iniciais"> & { fotoUrl?: string; nome?: string }; className?: string }) {
  const n = [...user.id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  if (user.fotoUrl)
    return <img src={user.fotoUrl} alt={user.nome ?? ""} loading="lazy" className={`shrink-0 rounded-full bg-canvas object-cover ${className}`} />;
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${AVATAR_COLORS[n % AVATAR_COLORS.length]} ${className}`}>
      {user.iniciais}
    </span>
  );
}

/** Avisa a janela (Modal) que algo foi alterado: a lista suspensa não dispara o "change" de um campo comum. */
export const AvisoAlteracao = createContext<() => void>(() => undefined);

export type OpcaoLista = { value: string; label: string; grupo?: string; disabled?: boolean };

/**
 * Lista suspensa da Frankkia (substitui o <select> do navegador em todo o app).
 * - variante "pilula": botão arredondado (filtros de topo de página);
 * - variante "campo": do tamanho de um campo de formulário.
 * A lista abre por cima de tudo (fora das janelas, para não ser cortada), sobe quando falta espaço embaixo,
 * tem título por grupo, ✓ no item escolhido e funciona pelo teclado (setas, Enter, Esc).
 */
export function ListaSuspensa({
  value,
  onChange,
  options,
  icon,
  label,
  placeholder,
  variante = "pilula",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: OpcaoLista[];
  icon?: ReactNode;
  label: string;
  placeholder?: string;
  variante?: "pilula" | "campo";
  className?: string;
}) {
  const avisar = useContext(AvisoAlteracao);
  const [aberta, setAberta] = useState(false);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; minWidth: number; maxHeight: number } | null>(null);
  const [foco, setFoco] = useState(-1);
  const botao = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const itens = options.filter((o) => !o.disabled);
  const atual = options.find((o) => o.value === value && !o.disabled) ?? options.find((o) => o.value === value);

  const posicionar = () => {
    const r = botao.current?.getBoundingClientRect();
    if (!r) return;
    const embaixo = window.innerHeight - r.bottom - 12;
    const emCima = r.top - 12;
    const sobe = embaixo < 240 && emCima > embaixo;
    setPos({
      left: Math.min(r.left, window.innerWidth - Math.max(r.width, 200) - 8),
      minWidth: r.width,
      maxHeight: Math.max(160, Math.min(320, sobe ? emCima : embaixo)),
      ...(sobe ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
    });
  };
  const abrir = () => {
    posicionar();
    setFoco(Math.max(0, itens.findIndex((o) => o.value === value)));
    setAberta(true);
  };
  const escolher = (v: string) => {
    if (v !== value) {
      onChange(v);
      avisar();
    }
    setAberta(false);
    botao.current?.focus();
  };

  useEffect(() => {
    if (!aberta) return;
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (!botao.current?.contains(alvo) && !lista.current?.contains(alvo)) setAberta(false);
    };
    // Rolou a tela (fora da lista) ou mudou o tamanho: reposiciona
    const rolou = (e: Event) => !lista.current?.contains(e.target as Node) && posicionar();
    document.addEventListener("mousedown", fora);
    window.addEventListener("scroll", rolou, true);
    window.addEventListener("resize", posicionar);
    return () => {
      document.removeEventListener("mousedown", fora);
      window.removeEventListener("scroll", rolou, true);
      window.removeEventListener("resize", posicionar);
    };
  }, [aberta]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mantém o item com foco visível ao navegar pelo teclado
  useEffect(() => {
    if (aberta && foco >= 0) lista.current?.querySelector(`[data-i="${foco}"]`)?.scrollIntoView({ block: "nearest" });
  }, [aberta, foco]);

  const teclado = (e: React.KeyboardEvent) => {
    if (!aberta) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setAberta(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFoco((f) => Math.min(itens.length - 1, f + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFoco((f) => Math.max(0, f - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (itens[foco]) escolher(itens[foco].value);
    } else if (e.key === "Tab") setAberta(false);
  };

  const campo = variante === "campo";
  const texto = atual && !atual.disabled ? atual.label : (placeholder ?? atual?.label ?? label);
  const vazio = !atual || atual.disabled;
  return (
    <>
      <button
        ref={botao}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={aberta}
        onClick={() => (aberta ? setAberta(false) : abrir())}
        onKeyDown={teclado}
        className={
          campo
            ? `flex h-11 w-full items-center gap-2 rounded-xl border bg-bg px-3.5 text-left text-sm transition ${aberta ? "border-accent ring-4 ring-accent/10" : "border-line-strong hover:border-ink/30"} ${className}`
            : `inline-flex h-10 items-center gap-2 rounded-full border bg-bg pl-3.5 pr-3 text-sm font-semibold transition-colors ${aberta ? "border-accent ring-4 ring-accent/10" : "border-line-strong hover:border-ink/30"} ${className}`
        }
      >
        {icon && <span className="shrink-0 text-muted">{icon}</span>}
        <span className={`min-w-0 truncate ${campo ? "flex-1" : ""} ${vazio && campo ? "text-subtle" : ""}`}>{texto}</span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition-transform duration-300 ${aberta ? "rotate-180" : ""}`} />
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {aberta && pos && (
              <motion.ul
                ref={lista}
                role="listbox"
                aria-label={label}
                initial={{ opacity: 0, y: pos.top !== undefined ? -6 : 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                style={{ position: "fixed", left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.minWidth, maxHeight: pos.maxHeight }}
                className="z-[90] w-max max-w-[min(32rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-line bg-bg p-1.5 text-ink shadow-float"
              >
                {itens.length === 0 && <li className="px-3 py-2 text-sm text-subtle">Nenhuma opção</li>}
                {itens.map((o, i) => (
                  <li key={o.value || "_vazio"}>
                    {o.grupo && o.grupo !== itens[i - 1]?.grupo && (
                      <p className={`px-3 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle ${i ? "mt-1.5 border-t border-line pt-2.5" : "pt-1.5"}`}>{o.grupo}</p>
                    )}
                    <button
                      type="button"
                      role="option"
                      data-i={i}
                      aria-selected={o.value === value}
                      onMouseEnter={() => setFoco(i)}
                      onClick={() => escolher(o.value)}
                      className={`flex w-full items-center justify-between gap-6 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        o.value === value ? "bg-accent-soft font-semibold text-accent-deep" : foco === i ? "bg-canvas" : ""
                      }`}
                    >
                      <span className="min-w-0 truncate">{o.label}</span>
                      {o.value === value && <Check className="size-4 shrink-0" />}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/** Filtro de topo de página (mesma lista suspensa, em formato de pílula). */
export function Select({
  value,
  onChange,
  options,
  icon,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: ReactNode;
  label: string;
}) {
  return <ListaSuspensa value={value} onChange={onChange} options={options} icon={icon} label={label} />;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  id,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  id: string;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-full bg-canvas p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`relative rounded-full font-medium transition-colors ${size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} ${
            value === o.value ? "text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-0 rounded-full bg-bg shadow-pill"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, className = "", tone = "accent" }: { value: number; className?: string; tone?: "accent" | "verified" }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-canvas-deep ${className}`}>
      <motion.div
        className={`h-full rounded-full ${tone === "accent" ? "bg-accent" : "bg-verified"}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      />
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "verified" | "warn" | "danger" }) {
  const tones = {
    neutral: "bg-canvas text-muted",
    accent: "bg-accent-soft text-accent-deep",
    verified: "bg-verified-soft text-verified",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold ${tones[tone]}`}>{children}</span>;
}

/** Entrada escalonada dos blocos de uma página. */
export const stagger = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: 0.05 + i * 0.06, ease: EASE_OUT_EXPO },
});
