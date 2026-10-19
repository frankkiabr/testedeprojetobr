import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, CheckCircle2, Clock, LifeBuoy, MessageSquareReply } from "lucide-react";
import { chamadoById, clienteNome, todosChamados } from "@/data/platform";
import { userById } from "@/data/queries";
import { useStore } from "@/data/store";
import type { Chamado } from "@/data/types";
import { relTime } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Badge, Card, PageHeader, Segmented, stagger } from "../kit";
import { btn, Drawer, EmptyState, inputCls } from "../forms";

type Filtro = "abertos" | "em_andamento" | "resolvido" | "todos";

const STATUS: Record<Chamado["status"], { label: string; tone: "warn" | "accent" | "verified" }> = {
  aberto: { label: "Aberto", tone: "warn" },
  em_andamento: { label: "Em andamento", tone: "accent" },
  resolvido: { label: "Resolvido", tone: "verified" },
};

const autor = (c: Chamado) => c.autorNome ?? userById(c.autorId)?.nome ?? "—";

function ChamadoDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { updateChamado } = useStore();
  const c = id ? chamadoById(id) : undefined;
  const [resposta, setResposta] = useState("");
  useEffect(() => setResposta(c?.resposta ?? ""), [c?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Drawer
      open={!!c}
      onClose={onClose}
      title={c?.assunto}
      subtitle={
        c && (
          <span className="flex flex-wrap items-center gap-2">
            {clienteNome(c.imobiliariaId)} · {autor(c)}
            <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
          </span>
        )
      }
      footer={
        c && c.status !== "resolvido" ? (
          <>
            {c.status === "aberto" && (
              <button onClick={() => updateChamado(c.id, { status: "em_andamento" })} className={btn.outline}>
                <Clock className="size-4" /> Marcar em andamento
              </button>
            )}
            <button disabled={!resposta.trim()} onClick={() => updateChamado(c.id, { status: "resolvido", resposta: resposta.trim() })} className={btn.accent}>
              <MessageSquareReply className="size-4" /> Responder e resolver
            </button>
          </>
        ) : undefined
      }
    >
      {c && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-canvas px-3 py-1 font-semibold">{c.categoria}</span>
            <span className="rounded-full bg-canvas px-3 py-1 text-muted">Aberto {relTime(c.criadoEm)}</span>
          </div>
          <div className="rounded-2xl bg-canvas p-4">
            <p className="mb-1 text-xs font-semibold text-muted">{autor(c)} escreveu:</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.mensagem}</p>
          </div>
          {c.status === "resolvido" ? (
            <div className="rounded-2xl border border-verified/30 bg-verified-soft/60 p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-verified">
                <CheckCircle2 className="size-4" /> Resposta da equipe Frankkia
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.resposta ?? "Resolvido sem resposta escrita."}</p>
            </div>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Sua resposta</span>
              <textarea
                rows={6}
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                placeholder={`Olá, ${autor(c).split(" ")[0]}! ...`}
                className={`${inputCls} h-auto resize-none py-3`}
              />
              <span className="mt-1.5 block text-xs text-subtle">A resposta aparece para a imobiliária em Ajuda › Meus chamados.</span>
            </label>
          )}
        </div>
      )}
    </Drawer>
  );
}

export default function Chamados() {
  useStore();
  const [params, setParams] = useSearchParams();
  const [filtro, setFiltro] = useState<Filtro>("abertos");
  const all = todosChamados();
  const list = all.filter((c) => (filtro === "todos" ? true : filtro === "abertos" ? c.status === "aberto" : c.status === filtro));
  const count = (s: Chamado["status"]) => all.filter((c) => c.status === s).length;

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  return (
    <div className="space-y-5">
      <motion.div {...stagger(0)}>
        <PageHeader title="Chamados" subtitle="Pedidos de ajuda enviados pelas imobiliárias." />
      </motion.div>
      <motion.div {...stagger(1)} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Segmented
          id="chamados"
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "abertos", label: `Abertos (${count("aberto")})` },
            { value: "em_andamento", label: `Em andamento (${count("em_andamento")})` },
            { value: "resolvido", label: `Resolvidos (${count("resolvido")})` },
            { value: "todos", label: "Todos" },
          ]}
        />
      </motion.div>

      <motion.div {...stagger(2)}>
        <Card className="overflow-hidden">
          {list.length === 0 ? (
            <EmptyState icon={<LifeBuoy className="size-6" />} title="Nada por aqui" text="Nenhum chamado neste filtro." />
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {list.map((c, i) => (
                  <motion.li
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, delay: Math.min(i, 10) * 0.03, ease: EASE_OUT_EXPO }}
                    className="border-b border-line last:border-0"
                  >
                    <button onClick={() => setParam("id", c.id)} className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-canvas/70 sm:px-6">
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${c.status === "aberto" ? "bg-amber-400" : c.status === "em_andamento" ? "bg-accent" : "bg-verified"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{c.assunto}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <Building2 className="size-3" /> {clienteNome(c.imobiliariaId)}
                          </span>
                          · {autor(c)} · {c.categoria}
                        </p>
                        <p className="mt-1.5 line-clamp-1 text-sm text-muted">{c.mensagem}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                        <span className="text-xs text-subtle">{relTime(c.criadoEm)}</span>
                      </div>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </motion.div>

      <ChamadoDrawer id={params.get("id")} onClose={() => setParam("id", null)} />
    </div>
  );
}
