/** Janelas (modal e painel lateral), campos de formulário, checklist e avisos. */
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useStore } from "@/data/store";
import { EASE_OUT_EXPO } from "@/lib/scroll";

export const inputCls =
  "h-11 w-full rounded-xl border border-line-strong bg-bg px-3.5 text-sm outline-hidden transition placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10";

export const btn = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-bg transition hover:bg-ink/85 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  accent:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-deep active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  outline:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line-strong bg-bg px-4 text-sm font-semibold transition hover:bg-canvas active:scale-[0.98]",
  whatsapp:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#25d366] px-4 text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.98]",
};

/** Botão de salvar que confirma com "Salvo" (verde, com ✓) por alguns segundos depois do clique. */
export function BotaoSalvar({
  onSalvar,
  disabled,
  className = btn.primary,
  children = "Salvar",
  depois,
}: {
  /** Devolve `false` quando não salvou (ex.: erro já avisado), e aí o "Salvo" não aparece. */
  onSalvar: () => unknown;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  /** Chamado logo depois do "Salvo" aparecer (ex.: fechar a janela). */
  depois?: () => void;
}) {
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (!salvo) return;
    const t = setTimeout(() => (depois ? depois() : setSalvo(false)), depois ? 900 : 2200);
    return () => clearTimeout(t);
  }, [salvo]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <button
      className={`${className} min-w-28 ${salvo ? "!border-verified !bg-verified !text-white !opacity-100" : ""}`}
      disabled={disabled || salvando || (salvo && !!depois)}
      onClick={async () => {
        setSalvando(true);
        const r = await onSalvar();
        setSalvando(false);
        if (r !== false) setSalvo(true);
      }}
    >
      <motion.span
        key={salvo ? "salvo" : "salvar"}
        initial={{ opacity: 0, y: 6, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
        className="inline-flex items-center gap-2"
      >
        {salvo ? (
          <>
            <Check className="size-4" /> Salvo
          </>
        ) : (
          children
        )}
      </motion.span>
    </button>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-canvas hover:text-ink">
      <X className="size-5" />
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  largo,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Janela mais larga (ex.: conferir uma tabela); "extra" para formulários com muitos campos por linha. */
  largo?: boolean | "extra";
}) {
  // Clicar fora ou apertar Esc não fecha: assim ninguém perde o que preencheu. Fecha pelo X, por Cancelar ou ao salvar.
  // Sem animação de saída: ao fechar, a camada que cobre a tela some na hora (antes podia ficar presa e travar os cliques).
  if (!open) return null;
  // Vai direto para o fim da página: uma janela aberta de dentro de outra (ex.: confirmar exclusão) fica por cima dela, e não presa dentro.
  return createPortal(
    <>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 backdrop-blur-xs sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            role="dialog"
            aria-modal
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className={`flex max-h-[92vh] w-full ${largo === "extra" ? "max-w-5xl" : largo ? "max-w-3xl" : "max-w-lg"} flex-col overflow-hidden rounded-t-3xl bg-bg shadow-float sm:rounded-3xl`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
                {subtitle && <div className="mt-0.5 text-sm text-muted">{subtitle}</div>}
              </div>
              <CloseButton onClose={onClose} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-canvas/50 px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </>,
    document.body,
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  centro,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Janela larga no meio da tela (como os itens de Negócios), em vez da gaveta lateral. */
  centro?: boolean;
}) {
  if (centro)
    return (
      <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} footer={footer} largo="extra">
        {children}
      </Modal>
    );
  // Clicar fora ou apertar Esc não fecha (para não perder o que foi preenchido).
  // Sem animação de saída: ao fechar, o fundo escurecido some na hora (antes podia ficar presa e travar os cliques).
  return (
    <>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[55] bg-ink/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.aside
            role="dialog"
            aria-modal
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-[36rem] flex-col bg-bg shadow-float sm:rounded-l-[2rem]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div className="min-w-0">
                <h2 className="truncate font-display text-xl font-semibold tracking-tight">{title}</h2>
                {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
              </div>
              <CloseButton onClose={onClose} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-canvas/50 px-6 py-4">{footer}</div>}
          </motion.aside>
        </>
      )}
    </>
  );
}

export function Field({ label, children, hint, className = "" }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-subtle">{hint}</span>}
    </label>
  );
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <span className="relative block">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} cursor-pointer appearance-none pr-10`}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </span>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative flex h-10 min-w-0 items-center">
      <Search className="pointer-events-none absolute left-3.5 size-4 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full min-w-[12rem] rounded-xl border border-line-strong bg-bg pl-10 pr-3 text-sm outline-hidden transition placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10"
      />
    </label>
  );
}

/** Linha de checklist com marcação animada. */
export function CheckItem({ checked, label, onToggle, index }: { checked: boolean; label: string; onToggle: () => void; index?: number }) {
  return (
    <button
      onClick={onToggle}
      className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
        checked ? "border-accent/30 bg-accent-soft/60" : "border-line hover:border-line-strong hover:bg-canvas"
      }`}
    >
      <motion.span
        animate={{ backgroundColor: checked ? "#2f5bea" : "#ffffff", borderColor: checked ? "#2f5bea" : "#d5dae3", scale: checked ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className="grid size-5 shrink-0 place-items-center rounded-md border-2"
      >
        <AnimatePresence>
          {checked && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Check className="size-3 text-white" strokeWidth={3.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
      {index !== undefined && <span className="font-mono text-xs text-subtle">{String(index + 1).padStart(2, "0")}</span>}
      <span className={`flex-1 ${checked ? "font-medium" : ""}`}>{label}</span>
    </button>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">{icon}</span>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Avisos rápidos no canto da tela ("Lead cadastrado." etc.). */
export function Toaster() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2 sm:left-auto sm:right-6 sm:translate-x-0 sm:items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-2.5 rounded-full bg-ink py-2.5 pl-3 pr-5 text-sm font-medium text-bg shadow-float"
          >
            <span className="grid size-5 place-items-center rounded-full bg-verified">
              <Check className="size-3 text-white" strokeWidth={3} />
            </span>
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ---------- Valores em R$ (em src/lib/moeda.ts, para o portal usar também) ----------

export { mascaraMoeda, moeda } from "@/lib/moeda";

// ---------- Utilidades de telefone e WhatsApp ----------

/** Guarda só os números e acrescenta o 55 do Brasil quando faltar. */
export function normalizePhone(s: string) {
  const d = s.replace(/\D/g, "");
  return d.length === 10 || d.length === 11 ? `55${d}` : d;
}

export function formatPhone(n: string) {
  if (n.length === 13) return `(${n.slice(2, 4)}) ${n.slice(4, 9)}-${n.slice(9)}`;
  if (n.length === 12) return `(${n.slice(2, 4)}) ${n.slice(4, 8)}-${n.slice(8)}`;
  return n;
}

export const waLink = (n: string, text?: string) => `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Data ISO → valor do campo datetime-local (horário local). */
export function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------- Data e hora no padrão brasileiro (dd/mm/aaaa e 24h) ----------
// Os campos nativos do navegador seguem o idioma do computador (mm/dd e AM/PM em inglês). Estes não.

const isoParaBr = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");
function brParaIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  const [, d, mes, a] = m;
  const data = new Date(Number(a), Number(mes) - 1, Number(d));
  if (data.getFullYear() !== Number(a) || data.getMonth() !== Number(mes) - 1 || data.getDate() !== Number(d)) return null;
  return `${a}-${mes}-${d}`;
}

/** Campo de data dd/mm/aaaa. `value` e `onChange` usam AAAA-MM-DD (vazio = sem data). */
export function DateInput({ value, onChange, max, className = "" }: { value: string; onChange: (iso: string) => void; max?: string; className?: string }) {
  const [texto, setTexto] = useState(isoParaBr(value));
  const [erro, setErro] = useState("");
  useEffect(() => {
    if (brParaIso(texto) !== value) setTexto(isoParaBr(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const mudar = (bruto: string) => {
    const n = bruto.replace(/\D/g, "").slice(0, 8);
    const t = n.length > 4 ? `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}` : n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
    setTexto(t);
    if (!t) {
      setErro("");
      onChange("");
      return;
    }
    if (t.length < 10) return setErro("");
    const iso = brParaIso(t);
    if (!iso) return setErro("Data inválida.");
    if (max && iso > max) return setErro(`A data não pode passar de ${isoParaBr(max)}.`);
    setErro("");
    onChange(iso);
  };
  return (
    <>
      <input className={`${inputCls} ${className}`} inputMode="numeric" placeholder="dd/mm/aaaa" value={texto} onChange={(e) => mudar(e.target.value)} />
      {erro && <span className="mt-1 block text-xs font-medium text-rose-600">{erro}</span>}
    </>
  );
}

const HORARIOS = Array.from({ length: 96 }, (_, k) => `${String(Math.floor(k / 4)).padStart(2, "0")}:${String((k % 4) * 15).padStart(2, "0")}`);

/** Horário 24h (00:00 a 23:45, de 15 em 15 minutos). `value` = "HH:MM". */
export function TimeInput({ value, onChange, className = "" }: { value: string; onChange: (hhmm: string) => void; className?: string }) {
  const opcoes = value && !HORARIOS.includes(value) ? [value, ...HORARIOS].sort() : HORARIOS;
  return (
    <select className={`${inputCls} ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {!value && <option value="">--:--</option>}
      {opcoes.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  );
}
