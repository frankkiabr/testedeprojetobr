/** Utilidades da Agenda: datas, cores por tipo e link "Adicionar ao Google Agenda". */
import type { Compromisso, TipoCompromisso } from "@/data/types";

export const HORA_INICIO = 7;
export const HORA_FIM = 21;
export const ALTURA_HORA = 56; // px por hora na grade

export const TIPOS: Record<TipoCompromisso, { label: string; card: string; dot: string }> = {
  visita: { label: "Visita", card: "bg-violet-100 border-violet-500 text-violet-950", dot: "bg-violet-500" },
  captacao: { label: "Captação", card: "bg-accent-soft border-accent text-accent-deep", dot: "bg-accent" },
  reuniao: { label: "Reunião", card: "bg-amber-100 border-amber-500 text-amber-950", dot: "bg-amber-500" },
  ligacao: { label: "Ligação", card: "bg-emerald-100 border-emerald-500 text-emerald-950", dot: "bg-emerald-500" },
  outro: { label: "Outro", card: "bg-canvas-deep border-subtle text-ink", dot: "bg-subtle" },
};
export const ORDEM_TIPOS: TipoCompromisso[] = ["visita", "captacao", "reuniao", "ligacao", "outro"];

export const inicioDoDia = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const somarDias = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
/** Semana começando na segunda-feira. */
export const inicioDaSemana = (d: Date) => somarDias(inicioDoDia(d), -((d.getDay() + 6) % 7));
export const mesmoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const minutosDoDia = (d: Date) => d.getHours() * 60 + d.getMinutes();

export const hhmm = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
export const diaSemanaCurto = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
export const tituloMes = (d: Date) => {
  const s = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s[0].toUpperCase() + s.slice(1);
};
export const dataLonga = (d: Date) => {
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return s[0].toUpperCase() + s.slice(1);
};

/** Valores para campos <input type="date"> e <input type="time"> no horário local. */
const pad = (n: number) => String(n).padStart(2, "0");
export const paraInputData = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const paraInputHora = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const deInputs = (data: string, hora: string) => new Date(`${data}T${hora || "00:00"}:00`);

/**
 * Link que abre o Google Agenda já preenchido (funciona hoje, sem login nem OAuth).
 * É mão única: cria o evento no Google, mas mudanças lá não voltam para a Frankkia.
 */
export function linkGoogleAgenda(c: Compromisso, detalhes?: string) {
  const g = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: c.titulo,
    dates: `${g(c.inicio)}/${g(c.fim)}`,
    details: detalhes ?? c.observacoes ?? "Compromisso criado na Frankkia.",
  });
  if (c.local) p.set("location", c.local);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/** Distribui compromissos que se sobrepõem lado a lado (colunas dentro do dia). */
export function distribuir(evs: Compromisso[]) {
  const ini = (c: Compromisso) => new Date(c.inicio).getTime();
  const fim = (c: Compromisso) => new Date(c.fim).getTime();
  const ordenados = [...evs].sort((a, b) => ini(a) - ini(b) || fim(b) - fim(a));
  const out: { c: Compromisso; coluna: number; colunas: number }[] = [];
  let grupo: Compromisso[] = [];
  let fimGrupo = 0;
  const fechar = () => {
    const colunas: number[] = [];
    const colocados = grupo.map((c) => {
      let col = colunas.findIndex((f) => f <= ini(c));
      if (col < 0) {
        col = colunas.length;
        colunas.push(0);
      }
      colunas[col] = fim(c);
      return { c, coluna: col };
    });
    colocados.forEach((x) => out.push({ ...x, colunas: colunas.length }));
  };
  ordenados.forEach((c) => {
    if (grupo.length && ini(c) >= fimGrupo) {
      fechar();
      grupo = [];
      fimGrupo = 0;
    }
    grupo.push(c);
    fimGrupo = Math.max(fimGrupo, fim(c));
  });
  if (grupo.length) fechar();
  return out;
}
