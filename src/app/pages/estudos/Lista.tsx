import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calculator, ChevronRight, Loader2, Plus } from "lucide-react";
import { userById } from "@/data/queries";
import { funil, resultado, TIPOS_ESTUDO, type Avaliacao } from "@/data/avaliacoes";
import { brl } from "@/lib/format";
import { Badge, Card, CardHeader, stagger } from "../../kit";
import { btn, EmptyState } from "../../forms";
import { useScope } from "../../session";
import { useEstudos } from "./partes";

const CORES_FUNIL = ["bg-accent", "bg-verified", "bg-rose-500", "bg-verified", "bg-subtle"];

const situacao = (a: Avaliacao): { rotulo: string; tom: "neutral" | "accent" | "verified" | "warn" | "danger" } =>
  a.vendido
    ? { rotulo: a.finalidade === "locacao" ? "Alugado" : "Vendido", tom: "verified" }
    : a.expirado
      ? { rotulo: "Suspenso", tom: "neutral" }
      : a.exclusividade
        ? { rotulo: "Exclusividade", tom: "accent" }
        : a.apresentado
          ? { rotulo: "Apresentado", tom: "warn" }
          : { rotulo: "Em andamento", tom: "neutral" };

/** Lista de estudos de mercado com o funil (criados → apresentados → assinados → vendidos). */
export function ListaEstudos() {
  const { lista } = useEstudos();
  const { isAdmin, solo } = useScope();

  if (lista === null)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" /> Carregando estudos...
      </p>
    );

  const novo = (
    <Link to="/app/mercado/estudos/novo" className={btn.accent}>
      <Plus className="size-4" /> Novo estudo
    </Link>
  );

  if (!lista.length)
    return (
      <Card>
        <EmptyState
          icon={<Calculator className="size-6" />}
          title="Nenhum estudo de mercado ainda"
          text="Crie um estudo para chegar ao valor de um imóvel com amostras do mercado e apresentar ao proprietário."
          action={novo}
        />
      </Card>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)]">
      <motion.div {...stagger(1)}>
        <Card>
          <CardHeader title="Estudos de mercado" action={novo} />
          <ul className="space-y-4 px-6 pb-6 pt-4">
            {funil(lista).map((f, i) => (
              <li key={f.rotulo} className="grid grid-cols-[6.5rem_2.5rem_minmax(0,1fr)] items-center gap-3 text-sm">
                <span className="font-medium">{f.rotulo}</span>
                <span className="text-right tabular-nums text-muted">{f.qtd}</span>
                <span className="flex items-center gap-2">
                  <span className="w-9 text-right text-xs tabular-nums text-muted">{f.pct}%</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas-deep">
                    <motion.span
                      className={`block h-full rounded-full ${CORES_FUNIL[i]}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${f.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.06 }}
                    />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      <motion.div {...stagger(2)}>
        <Card className="overflow-hidden">
          <CardHeader title={isAdmin && !solo ? "Estudos da equipe" : "Seus estudos"} subtitle="Os mais recentes primeiro." />
          <ul className="mt-3 divide-y divide-line">
            {lista.map((a) => {
              const r = resultado(a);
              const s = situacao(a);
              const tipo = TIPOS_ESTUDO.find((t) => t.valor === a.categoria)?.rotulo.split(" /")[0] ?? a.categoria;
              return (
                <li key={a.id}>
                  <Link to={`/app/mercado/estudos/${a.id}`} className="flex items-center gap-4 px-6 py-4 transition hover:bg-canvas/60">
                    <span className={`h-10 w-1 shrink-0 rounded-full ${s.tom === "verified" ? "bg-verified" : s.tom === "accent" ? "bg-accent" : "bg-line-strong"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{a.titulo}</p>
                      <p className="truncate text-sm text-muted">
                        {[tipo, a.bairro, `${a.areaM2} m²`, isAdmin && userById(a.corretorId)?.nome].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-muted">Valor de mercado</p>
                      <p className="font-semibold">{r ? brl(r.mercado) : "—"}</p>
                    </div>
                    <Badge tone={s.tom}>{s.rotulo}</Badge>
                    <ChevronRight className="size-4 shrink-0 text-subtle" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </motion.div>
    </div>
  );
}
