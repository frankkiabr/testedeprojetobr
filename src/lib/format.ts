/** Formatação de valores em português do Brasil. */

export function brlCompact(v: number) {
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`;
  if (v >= 1e3) return `R$ ${Math.round(v / 1e3).toLocaleString("pt-BR")} mil`;
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
}

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const int = (v: number) => Math.round(v).toLocaleString("pt-BR");

export const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 864e5);
  if (diff < 0) {
    const ahead = Math.ceil(-diff / 864e5);
    return ahead <= 1 ? "amanhã" : `em ${ahead} dias`;
  }
  if (days === 0) {
    const min = Math.floor(diff / 6e4);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    return `há ${Math.floor(diff / 36e5)}h`;
  }
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const m = Math.floor(days / 30);
  return m === 1 ? "há 1 mês" : `há ${m} meses`;
}

/** Data e hora do registro: "30/10/2026 às 14:32". */
export const dataHora = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
