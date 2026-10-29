/** Visões da agenda: grade de horários (dia/semana) e calendário do mês. Ambas permitem arrastar. */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link2 } from "lucide-react";
import { pessoa, userById } from "@/data/queries";
import type { Compromisso } from "@/data/types";
import { Avatar } from "../kit";
import {
  ALTURA_HORA,
  distribuir,
  diaSemanaCurto,
  HORA_FIM,
  HORA_INICIO,
  hhmm,
  inicioDaSemana,
  inicioDoDia,
  mesmoDia,
  minutosDoDia,
  somarDias,
  TIPOS,
} from "./utils";

type Acoes = {
  onAbrir: (c: Compromisso) => void;
  onNovo: (inicio: Date) => void;
  onMover: (c: Compromisso, novoInicio: Date) => void;
  mostrarDono: boolean;
  sincronizado: (donoId: string) => boolean;
};

const HORAS = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i);

function useAgora() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return agora;
}

/** Grade de horários para 1 dia (visão Dia) ou 7 dias (visão Semana). */
export function GradeHorarios({ dias, eventos, onAbrir, onNovo, onMover, mostrarDono, sincronizado }: { dias: Date[]; eventos: Compromisso[] } & Acoes) {
  const agora = useAgora();
  const [alvo, setAlvo] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const alturaTotal = (HORA_FIM - HORA_INICIO) * ALTURA_HORA;

  // Começa mostrando a partir das 8h
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = ALTURA_HORA;
  }, []);

  /** Converte a posição vertical (px) em horário, arredondado de 15 em 15 min. */
  const horarioNaPosicao = (dia: Date, y: number, deslocamentoMin = 0) => {
    const min = HORA_INICIO * 60 + (y / ALTURA_HORA) * 60 - deslocamentoMin;
    const arred = Math.max(HORA_INICIO * 60, Math.min(HORA_FIM * 60 - 15, Math.round(min / 15) * 15));
    const d = inicioDoDia(dia);
    d.setMinutes(arred);
    return d;
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-bg">
      {/* Cabeçalho com os dias. O mesmo espaço da barra de rolagem fica reservado aqui e na grade, para as colunas baterem */}
      <div className="grid overflow-y-hidden border-b border-line [scrollbar-gutter:stable]" style={{ gridTemplateColumns: `3.5rem repeat(${dias.length}, minmax(0, 1fr))` }}>
        <div />
        {dias.map((d) => {
          const hoje = mesmoDia(d, agora);
          return (
            <div key={d.toISOString()} className="flex flex-col items-center gap-0.5 border-l border-line py-2.5">
              <span className={`text-[0.6875rem] font-semibold uppercase tracking-wide ${hoje ? "text-accent" : "text-muted"}`}>{diaSemanaCurto(d)}</span>
              <span className={`grid size-8 place-items-center rounded-full font-display text-base font-semibold ${hoje ? "bg-accent text-white" : ""}`}>{d.getDate()}</span>
            </div>
          );
        })}
      </div>

      <div ref={scroller} className="max-h-[68vh] overflow-y-auto [scrollbar-gutter:stable]">
        <div className="relative grid" style={{ gridTemplateColumns: `3.5rem repeat(${dias.length}, minmax(0, 1fr))`, height: alturaTotal }}>
          {/* Horas */}
          <div className="relative">
            {HORAS.map((h, i) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[0.6875rem] text-subtle" style={{ top: i * ALTURA_HORA }}>
                {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </span>
            ))}
          </div>

          {dias.map((dia, di) => {
            const doDia = eventos.filter((c) => mesmoDia(new Date(c.inicio), dia));
            const hoje = mesmoDia(dia, agora);
            const linhaAgora = ((minutosDoDia(agora) - HORA_INICIO * 60) / 60) * ALTURA_HORA;
            return (
              <div
                key={dia.toISOString()}
                className={`relative border-l border-line transition-colors ${alvo === di ? "bg-accent-soft/40" : hoje ? "bg-accent-soft/15" : ""}`}
                onClick={(e) => {
                  if (e.target !== e.currentTarget) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  onNovo(horarioNaPosicao(dia, e.clientY - r.top));
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setAlvo(di);
                }}
                onDragLeave={() => setAlvo((a) => (a === di ? null : a))}
                onDrop={(e) => {
                  e.preventDefault();
                  setAlvo(null);
                  const [id, desloc] = e.dataTransfer.getData("text/plain").split("|");
                  const c = eventos.find((x) => x.id === id);
                  if (!c) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  onMover(c, horarioNaPosicao(dia, e.clientY - r.top, Number(desloc) || 0));
                }}
              >
                {/* Linhas das horas e meias horas */}
                {HORAS.map((h, i) => (
                  <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-line" style={{ top: i * ALTURA_HORA }}>
                    <div className="absolute inset-x-0 border-t border-dashed border-line/60" style={{ top: ALTURA_HORA / 2 }} />
                  </div>
                ))}

                {hoje && linhaAgora > 0 && linhaAgora < alturaTotal && (
                  <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: linhaAgora }}>
                    <div className="relative h-0.5 bg-rose-500">
                      <span className="absolute -left-1 -top-[3px] size-2 rounded-full bg-rose-500" />
                    </div>
                  </div>
                )}

                {distribuir(doDia).map(({ c, coluna, colunas }) => {
                  const ini = new Date(c.inicio);
                  const fim = new Date(c.fim);
                  const top = ((minutosDoDia(ini) - HORA_INICIO * 60) / 60) * ALTURA_HORA;
                  const altura = Math.max(22, ((fim.getTime() - ini.getTime()) / 3_600_000) * ALTURA_HORA - 2);
                  if (top + altura < 0 || top > alturaTotal) return null;
                  const dono = userById(c.donoId);
                  const curto = altura < 40;
                  return (
                    <motion.div
                      key={c.id}
                      layout
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      className="absolute z-10 hover:z-30"
                      style={{
                        top: Math.max(0, top) + 1,
                        height: altura,
                        left: `calc(${(coluna / colunas) * 100}% + 2px)`,
                        width: `calc(${100 / colunas}% - 4px)`,
                      }}
                    >
                      {/* Arrastar nativo fica no botão, separado da animação (framer-motion usa onDragStart para outra coisa) */}
                      <button
                        draggable
                        onDragStart={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          const desloc = Math.round(((e.clientY - r.top) / ALTURA_HORA) * 60);
                          e.dataTransfer.setData("text/plain", `${c.id}|${desloc}`);
                        }}
                        onClick={() => onAbrir(c)}
                        className={`size-full cursor-grab overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left shadow-xs transition-shadow hover:shadow-soft active:cursor-grabbing ${TIPOS[c.tipo].card}`}
                      >
                        <p className={`flex items-center gap-1 font-semibold leading-tight ${curto ? "truncate text-[0.6875rem]" : "text-xs"}`}>
                          {sincronizado(c.donoId) && <Link2 className="size-3 shrink-0 opacity-60" />}
                          <span className="truncate">{c.titulo}</span>
                        </p>
                        {!curto && (
                          <p className="mt-0.5 flex items-center gap-1 text-[0.6875rem] opacity-75">
                            {hhmm(ini)}–{hhmm(fim)}
                            {mostrarDono && dono && <span className="truncate">· {dono.nome.split(" ")[0]}</span>}
                          </p>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Calendário do mês, com até 3 compromissos por dia. Arraste para mudar o dia (o horário é mantido). */
export function GradeMes({
  mes,
  eventos,
  onAbrir,
  onMover,
  onDia,
  mostrarDono,
}: { mes: Date; eventos: Compromisso[]; onDia: (d: Date) => void } & Omit<Acoes, "onNovo" | "sincronizado">) {
  const agora = new Date();
  const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const inicio = inicioDaSemana(primeiro);
  const dias = Array.from({ length: 42 }, (_, i) => somarDias(inicio, i));
  const [alvo, setAlvo] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-bg">
      <div className="grid grid-cols-7 border-b border-line">
        {dias.slice(0, 7).map((d) => (
          <div key={d.toISOString()} className="py-2.5 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
            {diaSemanaCurto(d)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((d) => {
          const doDia = eventos.filter((c) => mesmoDia(new Date(c.inicio), d));
          const foraDoMes = d.getMonth() !== mes.getMonth();
          const hoje = mesmoDia(d, agora);
          const chave = d.toISOString();
          return (
            <div
              key={chave}
              onDragOver={(e) => {
                e.preventDefault();
                setAlvo(chave);
              }}
              onDragLeave={() => setAlvo((a) => (a === chave ? null : a))}
              onDrop={(e) => {
                e.preventDefault();
                setAlvo(null);
                const [id] = e.dataTransfer.getData("text/plain").split("|");
                const c = eventos.find((x) => x.id === id);
                if (!c) return;
                const novo = new Date(d);
                const ini = new Date(c.inicio);
                novo.setHours(ini.getHours(), ini.getMinutes(), 0, 0);
                onMover(c, novo);
              }}
              className={`min-h-[7.5rem] border-b border-r border-line p-1.5 transition-colors [&:nth-child(7n)]:border-r-0 ${
                alvo === chave ? "bg-accent-soft/50" : foraDoMes ? "bg-canvas/50" : ""
              }`}
            >
              <button
                onClick={() => onDia(d)}
                className={`mb-1 grid size-7 place-items-center rounded-full text-xs font-semibold transition hover:bg-canvas-deep ${
                  hoje ? "bg-accent text-white hover:bg-accent-deep" : foraDoMes ? "text-subtle" : ""
                }`}
              >
                {d.getDate()}
              </button>
              <div className="space-y-1">
                {doDia.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", `${c.id}|0`)}
                    onClick={() => onAbrir(c)}
                    className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-[0.6875rem] hover:bg-canvas"
                  >
                    <span className={`size-1.5 shrink-0 rounded-full ${TIPOS[c.tipo].dot}`} />
                    <span className="shrink-0 text-muted">{hhmm(new Date(c.inicio))}</span>
                    <span className="truncate font-medium">{c.titulo}</span>
                    {mostrarDono && userById(c.donoId) && (
                      <span className="ml-auto shrink-0">
                        <Avatar user={pessoa(c.donoId)} className="size-4 text-[0.4375rem]" />
                      </span>
                    )}
                  </button>
                ))}
                {doDia.length > 3 && (
                  <button onClick={() => onDia(d)} className="px-1.5 text-[0.6875rem] font-semibold text-accent hover:underline">
                    +{doDia.length - 3} mais
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
