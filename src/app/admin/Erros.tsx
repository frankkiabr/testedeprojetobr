import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertOctagon, Bug, CheckCircle2, Info, Radio, Zap } from "lucide-react";
import { errosSistema } from "@/data/platform";
import { useStore } from "@/data/store";
import type { ErroSistema } from "@/data/types";
import { relTime } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Badge, Card, PageHeader, Segmented, stagger } from "../kit";
import { btn, EmptyState, SelectField } from "../forms";

type Filtro = "abertos" | "corrigido" | "todos";

const STATUS: Record<ErroSistema["status"], { label: string; tone: "danger" | "warn" | "verified" }> = {
  novo: { label: "Novo", tone: "danger" },
  investigando: { label: "Investigando", tone: "warn" },
  corrigido: { label: "Corrigido", tone: "verified" },
};

export default function Erros() {
  const { setErroStatus } = useStore();
  const [filtro, setFiltro] = useState<Filtro>("abertos");
  const list = errosSistema
    .filter((e) => (filtro === "todos" ? true : filtro === "abertos" ? e.status !== "corrigido" : e.status === "corrigido"))
    .sort((a, b) => b.ultimaVez.localeCompare(a.ultimaVez));
  const abertos = errosSistema.filter((e) => e.status !== "corrigido").length;

  return (
    <div className="space-y-5">
      <motion.div {...stagger(0)}>
        <PageHeader
          title="Erros do sistema"
          subtitle="Falhas registradas em todas as imobiliárias, agrupadas por tipo."
          actions={
            <button
              onClick={() =>
                setTimeout(() => {
                  throw new Error("Erro de teste disparado pelo painel Frankkia");
                })
              }
              className={btn.outline}
              title="Dispara um erro de verdade para ver a captura funcionando"
            >
              <Zap className="size-4" /> Disparar erro de teste
            </button>
          }
        />
      </motion.div>

      <motion.div {...stagger(1)}>
        <div className="flex items-start gap-3 rounded-3xl border border-accent/20 bg-accent-soft/50 p-5 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-accent" />
          <p className="leading-relaxed">
            Todas as imobiliárias usam <span className="font-semibold">o mesmo sistema</span>. Por isso, quando um erro é corrigido no código, a correção vale para todas de uma
            vez. Use esta lista para saber <span className="font-semibold">o quê</span>, <span className="font-semibold">onde</span> e{" "}
            <span className="font-semibold">quantas imobiliárias</span> foram afetadas, e marque como corrigido depois de publicar a correção.
          </p>
        </div>
      </motion.div>

      <motion.div {...stagger(2)}>
        <Segmented
          id="erros"
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "abertos", label: `Não resolvidos (${abertos})` },
            { value: "corrigido", label: "Corrigidos" },
            { value: "todos", label: "Todos" },
          ]}
        />
      </motion.div>

      <motion.div {...stagger(3)}>
        <Card className="overflow-hidden">
          {list.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="size-6" />} title="Tudo certo" text="Nenhum erro neste filtro." />
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {list.map((e, i) => (
                  <motion.li
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, delay: Math.min(i, 10) * 0.03, ease: EASE_OUT_EXPO }}
                    className="flex flex-col gap-4 border-b border-line px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:px-6"
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                        e.status === "corrigido" ? "bg-verified-soft text-verified" : e.status === "novo" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {e.status === "corrigido" ? <CheckCircle2 className="size-5" /> : e.status === "novo" ? <AlertOctagon className="size-5" /> : <Bug className="size-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-mono text-[0.8125rem] font-medium">{e.mensagem}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        <span className="font-semibold text-ink">{e.local}</span>· {e.ocorrencias} {e.ocorrencias === 1 ? "ocorrência" : "ocorrências"} · {e.imobiliarias}{" "}
                        {e.imobiliarias === 1 ? "imobiliária" : "imobiliárias"} · última {relTime(e.ultimaVez)}
                        {e.origem === "capturado" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 font-semibold text-bg">
                            <Radio className="size-3" /> capturado agora
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone={STATUS[e.status].tone}>{STATUS[e.status].label}</Badge>
                      <div className="w-40">
                        <SelectField
                          value={e.status}
                          onChange={(v) => setErroStatus(e.id, v as ErroSistema["status"])}
                          options={[
                            { value: "novo", label: "Novo" },
                            { value: "investigando", label: "Investigando" },
                            { value: "corrigido", label: "Corrigido" },
                          ]}
                        />
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
