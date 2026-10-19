import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, FileText, Play, Plus, Video } from "lucide-react";
import { trilhas } from "@/data/demo";
import { duracaoTrilha, progressoEquipe, progressoTrilha } from "@/data/queries";
import { useStore } from "@/data/store";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useScope } from "../../session";
import { Card, PageHeader, ProgressBar, stagger } from "../../kit";
import { btn, EmptyState } from "../../forms";
import { TrilhaCover, TrilhaFormModal } from "./shared";

export default function Academy() {
  useStore();
  const { isAdmin, user } = useScope();
  const navigate = useNavigate();
  const [nova, setNova] = useState(false);

  // "Continue de onde parou": primeira trilha em andamento do corretor
  const emAndamento = !isAdmin
    ? trilhas.find((t) => {
        const p = progressoTrilha(user.id, t);
        return p.k > 0 && p.k < p.n;
      })
    : undefined;

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader
          title="Academy"
          subtitle={isAdmin ? "Crie trilhas de capacitação e acompanhe o progresso da equipe." : "Trilhas de capacitação da sua imobiliária."}
          actions={
            isAdmin && (
              <button onClick={() => setNova(true)} className={btn.accent}>
                <Plus className="size-4" /> Nova trilha
              </button>
            )
          }
        />
      </motion.div>

      {emAndamento && (
        <motion.div {...stagger(1)}>
          <Link to={`/app/academy/${emAndamento.id}`} className="group block">
            <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-bg sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_0%,rgb(47_91_234/0.55),transparent_70%)]" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-bg/60">Continue de onde parou</p>
                  <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{emAndamento.titulo}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <ProgressBar value={progressoTrilha(user.id, emAndamento).pct} className="h-1.5 w-48 bg-white/15" />
                    <span className="text-sm text-bg/70">
                      {progressoTrilha(user.id, emAndamento).k} de {emAndamento.aulas.length} aulas
                    </span>
                  </div>
                </div>
                <span className="inline-flex h-12 items-center gap-2 self-start rounded-full bg-bg px-6 font-semibold text-ink transition-transform group-hover:translate-x-1 sm:self-center">
                  <Play className="size-4 fill-current" /> Continuar
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {trilhas.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="size-6" />}
            title="Nenhuma trilha ainda"
            text={isAdmin ? "Crie a primeira trilha e adicione vídeos e materiais para a equipe." : "Quando o administrador publicar trilhas, elas aparecem aqui."}
            action={
              isAdmin && (
                <button onClick={() => setNova(true)} className={btn.accent}>
                  <Plus className="size-4" /> Nova trilha
                </button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {trilhas.map((t, i) => {
            const videos = t.aulas.filter((a) => a.tipo === "video").length;
            const docs = t.aulas.length - videos;
            const p = progressoTrilha(user.id, t);
            const pct = isAdmin ? progressoEquipe(t) : p.pct;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.07, ease: EASE_OUT_EXPO }}
              >
                <Link to={`/app/academy/${t.id}`} className="group block h-full overflow-hidden rounded-3xl border border-line bg-bg transition-shadow hover:shadow-lift">
                  <TrilhaCover trilha={t} className="aspect-[16/9]">
                    <span className="absolute left-4 top-4 rounded-full bg-bg/90 px-3 py-1 text-xs font-semibold">
                      {t.aulas.length} {t.aulas.length === 1 ? "aula" : "aulas"}
                    </span>
                    {!isAdmin && p.n > 0 && p.k === p.n && (
                      <span className="absolute right-4 top-4 rounded-full bg-verified px-3 py-1 text-xs font-semibold text-white">Concluída</span>
                    )}
                  </TrilhaCover>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-semibold tracking-tight">{t.titulo}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{t.subtitulo}</p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <Video className="size-3.5" /> {videos} vídeos
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText className="size-3.5" /> {docs} materiais
                      </span>
                      {duracaoTrilha(t) > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" /> {duracaoTrilha(t)} min
                        </span>
                      )}
                    </div>
                    <div className="mt-5">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-muted">{isAdmin ? "Conclusão média da equipe" : "Seu progresso"}</span>
                        <span className="font-semibold">{Math.round(pct * 100)}%</span>
                      </div>
                      <ProgressBar value={pct} className="h-1.5" tone={pct === 1 ? "verified" : "accent"} />
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                      {isAdmin ? "Gerenciar trilha" : p.k ? "Continuar" : "Começar"}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <TrilhaFormModal open={nova} onClose={() => setNova(false)} onCreated={(t) => navigate(`/app/academy/${t.id}`)} />
    </div>
  );
}
