import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import { conexoesGoogle } from "@/data/demo";
import { compromissosDe } from "@/data/queries";
import { useStore } from "@/data/store";
import type { Compromisso, Usuario } from "@/data/types";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { btn } from "../forms";
import { Segmented, Select } from "../kit";
import { GradeHorarios, GradeMes } from "./Grades";
import { CompromissoDetalhes, CompromissoForm, ConexaoGoogle } from "./Paineis";
import { dataLonga, hhmm, inicioDaSemana, inicioDoDia, ORDEM_TIPOS, somarDias, TIPOS, tituloMes } from "./utils";

type Visao = "dia" | "semana" | "mes";

/**
 * AGENDA reutilizável: corretor (só a própria), administrador (própria + equipe) e painel Frankkia (própria, sem vínculos).
 */
export function Agenda({ eu, equipe, semVinculos }: { eu: Usuario; equipe?: Usuario[]; semVinculos?: boolean }) {
  const { updateCompromisso } = useStore();
  const [visao, setVisao] = useState<Visao>(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "dia" : "semana"));
  const [ref, setRef] = useState(() => inicioDoDia(new Date()));
  const [filtro, setFiltro] = useState("eu");
  const [form, setForm] = useState<{ open: boolean; inicial?: Date; editar?: Compromisso }>({ open: false });
  const [aberto, setAberto] = useState<Compromisso | null>(null);

  // Ao trocar de perfil (ex.: "Ver como"), volta para a própria agenda
  useEffect(() => setFiltro("eu"), [eu.id]);

  const donoIds = filtro === "eu" ? [eu.id] : filtro === "equipe" ? [eu.id, ...(equipe ?? []).map((u) => u.id)] : [filtro];
  const mostrarDono = donoIds.length > 1 || donoIds[0] !== eu.id;

  const { de, ate, dias, titulo } = useMemo(() => {
    if (visao === "dia") return { de: ref, ate: somarDias(ref, 1), dias: [ref], titulo: dataLonga(ref) };
    if (visao === "semana") {
      const ini = inicioDaSemana(ref);
      const fim = somarDias(ini, 6);
      const mesmoMes = ini.getMonth() === fim.getMonth();
      const t = mesmoMes
        ? `${ini.getDate()} – ${fim.getDate()} de ${tituloMes(fim).toLowerCase()}`
        : `${ini.getDate()} ${ini.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")} – ${fim.getDate()} ${fim.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")} ${fim.getFullYear()}`;
      return { de: ini, ate: somarDias(ini, 7), dias: Array.from({ length: 7 }, (_, i) => somarDias(ini, i)), titulo: t };
    }
    const primeiro = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const ini = inicioDaSemana(primeiro);
    return { de: ini, ate: somarDias(ini, 42), dias: [], titulo: tituloMes(ref) };
  }, [visao, ref]);

  const eventos = compromissosDe(donoIds, de, ate);
  const hoje = eventos.filter((c) => new Date(c.inicio).toDateString() === new Date().toDateString());

  const andar = (dir: 1 | -1) => {
    if (visao === "dia") setRef((r) => somarDias(r, dir));
    else if (visao === "semana") setRef((r) => somarDias(r, 7 * dir));
    else setRef((r) => new Date(r.getFullYear(), r.getMonth() + dir, 1));
  };

  const mover = (c: Compromisso, novoInicio: Date) => {
    const dur = new Date(c.fim).getTime() - new Date(c.inicio).getTime();
    if (novoInicio.getTime() === new Date(c.inicio).getTime()) return;
    updateCompromisso(
      c.id,
      { inicio: novoInicio.toISOString(), fim: new Date(novoInicio.getTime() + dur).toISOString() },
      `“${c.titulo}” movido para ${novoInicio.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })} às ${hhmm(novoInicio)}.`,
    );
  };

  const responsaveis = equipe?.length ? [eu, ...equipe] : undefined;
  const sincronizado = (id: string) => !!conexoesGoogle[id];

  return (
    <div className="space-y-5">
      {/* Barra de controles */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setRef(inicioDoDia(new Date()))} className={btn.outline}>
            Hoje
          </button>
          <div className="flex">
            <button onClick={() => andar(-1)} aria-label="Anterior" className="grid size-10 place-items-center rounded-full hover:bg-canvas">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => andar(1)} aria-label="Próximo" className="grid size-10 place-items-center rounded-full hover:bg-canvas">
              <ChevronRight className="size-5" />
            </button>
          </div>
          <motion.h2
            key={titulo}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="font-display text-xl font-semibold tracking-tight"
          >
            {titulo}
          </motion.h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            id="agenda-visao"
            value={visao}
            onChange={setVisao}
            options={[
              { value: "dia", label: "Dia" },
              { value: "semana", label: "Semana" },
              { value: "mes", label: "Mês" },
            ]}
          />
          {equipe && equipe.length > 0 && (
            <Select
              label="Agenda de"
              icon={<Users className="size-4" />}
              value={filtro}
              onChange={setFiltro}
              options={[
                { value: "eu", label: "Minha agenda" },
                { value: "equipe", label: "Toda a equipe" },
                ...equipe.map((u) => ({ value: u.id, label: u.nome })),
              ]}
            />
          )}
          <ConexaoGoogle usuario={eu} />
          <button onClick={() => setForm({ open: true })} className={btn.accent}>
            <Plus className="size-4" /> Novo compromisso
          </button>
        </div>
      </div>

      {/* Legenda + resumo do dia */}
      <div className="flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {ORDEM_TIPOS.map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${TIPOS[t].dot}`} />
              {TIPOS[t].label}
            </span>
          ))}
        </div>
        <span>
          {hoje.length ? `${hoje.length} ${hoje.length === 1 ? "compromisso" : "compromissos"} hoje` : "Nenhum compromisso hoje"}
          {visao !== "mes" && " · clique num horário vazio para criar, arraste para mover"}
        </span>
      </div>

      <motion.div key={visao} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}>
        {visao === "mes" ? (
          <GradeMes
            mes={ref}
            eventos={eventos}
            onAbrir={setAberto}
            onMover={mover}
            mostrarDono={mostrarDono}
            onDia={(d) => {
              setRef(inicioDoDia(d));
              setVisao("dia");
            }}
          />
        ) : (
          <GradeHorarios
            dias={dias}
            eventos={eventos}
            onAbrir={setAberto}
            onMover={mover}
            onNovo={(inicial) => setForm({ open: true, inicial })}
            mostrarDono={mostrarDono}
            sincronizado={sincronizado}
          />
        )}
      </motion.div>

      <CompromissoDetalhes
        c={aberto}
        onClose={() => setAberto(null)}
        onEditar={(c) => {
          setAberto(null);
          setForm({ open: true, editar: c });
        }}
      />
      <CompromissoForm
        open={form.open}
        onClose={() => setForm({ open: false })}
        inicial={form.inicial}
        editar={form.editar}
        donoPadrao={filtro !== "eu" && filtro !== "equipe" ? filtro : eu.id}
        responsaveis={responsaveis}
        semVinculos={semVinculos}
      />
    </div>
  );
}
