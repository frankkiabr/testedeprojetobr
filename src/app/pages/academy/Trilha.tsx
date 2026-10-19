import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, CheckCircle2, Download, Lock, Pencil, Play, Plus, Trash2, Users } from "lucide-react";
import { trilhas } from "@/data/demo";
import { aulaConcluida, corretoresAtivos, duracaoTrilha, progressoEquipe, progressoTrilha } from "@/data/queries";
import { useStore } from "@/data/store";
import type { Aula, Trilha as TrilhaT } from "@/data/types";
import { fmtBytes, samplePdfUrl } from "@/lib/files";
import { supabase } from "@/integrations/supabase/client";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useScope } from "../../session";
import { Avatar, Card, CardHeader, ProgressBar, stagger } from "../../kit";
import { btn, EmptyState, Modal } from "../../forms";
import { AulaFormModal, AulaIcon, TrilhaCover, TrilhaFormModal } from "./shared";

/** Player de vídeo sem botão de download. Aulas de exemplo mostram uma prévia. */
function VideoPlayer({ aula, trilha }: { aula: Aula; trilha: TrilhaT }) {
  const [clicked, setClicked] = useState(false);
  useEffect(() => setClicked(false), [aula.id]);

  // Vídeo do YouTube ou Vimeo, tocando dentro da Frankkia
  if (aula.videoUrl)
    return (
      <iframe
        key={aula.id}
        title={aula.titulo}
        src={aula.videoUrl}
        className="aspect-video w-full rounded-2xl bg-ink"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );

  if (aula.url)
    return (
      <video
        key={aula.id}
        src={aula.url}
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        className="aspect-video w-full rounded-2xl bg-ink"
      />
    );

  return (
    <TrilhaCover trilha={trilha} className="grid aspect-video w-full place-items-center rounded-2xl">
      {clicked ? (
        <motion.p
          key="msg"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-6 max-w-sm rounded-2xl bg-bg/95 p-4 text-center text-sm shadow-float"
        >
          Esta é uma aula de exemplo. Na versão final, o vídeo enviado pelo administrador é reproduzido aqui.
        </motion.p>
      ) : (
        <motion.button
          key="play"
          onClick={() => setClicked(true)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          aria-label="Reproduzir"
          className="relative grid size-20 place-items-center rounded-full bg-bg/95 text-ink shadow-float"
        >
          <Play className="ml-1 size-8 fill-current" />
        </motion.button>
      )}
    </TrilhaCover>
  );
}

function DocumentoViewer({ aula }: { aula: Aula }) {
  const { toast } = useStore();
  const download = async () => {
    let url = aula.url;
    // Documento guardado no banco: link temporário (1 minuto), só para quem é da imobiliária
    if (!url && aula.arquivoPath) {
      const { data, error } = await supabase.storage.from("academy").createSignedUrl(aula.arquivoPath, 60, { download: aula.arquivoNome });
      if (error || !data) {
        toast("Não foi possível baixar o arquivo. Tente de novo.");
        return;
      }
      url = data.signedUrl;
    }
    const a = document.createElement("a");
    a.href = url ?? samplePdfUrl(aula.titulo);
    a.download = aula.arquivoNome;
    a.click();
  };
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-2xl bg-canvas p-6 text-center">
      <span className="relative grid h-24 w-20 place-items-center rounded-xl border border-line bg-bg shadow-soft">
        <AulaIcon tipo="documento" className="size-8 text-accent" />
        <span className="absolute -bottom-2 rounded-md bg-ink px-2 py-0.5 text-[0.625rem] font-bold text-bg">{aula.formato}</span>
      </span>
      <div>
        <p className="font-semibold">{aula.arquivoNome}</p>
        <p className="text-xs text-muted">{fmtBytes(aula.tamanhoBytes)}</p>
      </div>
      <button onClick={download} className={btn.primary}>
        <Download className="size-4" /> Baixar arquivo
      </button>
    </div>
  );
}

export default function Trilha() {
  const store = useStore();
  const { isAdmin, user } = useScope();
  const { id } = useParams();
  const navigate = useNavigate();
  const trilha = trilhas.find((t) => t.id === id);
  const [sel, setSel] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [add, setAdd] = useState(false);
  const [del, setDel] = useState(false);

  useEffect(() => {
    if (trilha && (!sel || !trilha.aulas.some((a) => a.id === sel))) {
      // Abre a primeira aula ainda não concluída
      const next = trilha.aulas.find((a) => !aulaConcluida(user.id, a.id)) ?? trilha.aulas[0];
      setSel(next?.id ?? null);
    }
  }, [trilha, trilha?.aulas.length, sel, user.id]);

  if (!trilha) return <Navigate to="/app/academy" replace />;

  const aula = trilha.aulas.find((a) => a.id === sel);
  const p = progressoTrilha(user.id, trilha);
  const idx = aula ? trilha.aulas.indexOf(aula) : -1;
  const done = aula ? aulaConcluida(user.id, aula.id) : false;

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <Link to="/app/academy" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Academy
        </Link>
      </motion.div>

      {/* Cabeçalho da trilha */}
      <motion.div {...stagger(1)}>
        <TrilhaCover trilha={trilha} className="rounded-3xl p-6 sm:p-8">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">Trilha</p>
              <h1 className="type-title mt-2">{trilha.titulo}</h1>
              <p className="mt-2 text-ink/70">{trilha.subtitulo}</p>
              <p className="mt-4 text-sm text-ink/60">
                {trilha.aulas.length} aulas{duracaoTrilha(trilha) > 0 && ` · ${duracaoTrilha(trilha)} min de vídeo`}
              </p>
            </div>
            {isAdmin ? (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEdit(true)} className={`${btn.outline} border-transparent bg-bg/90`}>
                  <Pencil className="size-4" /> Editar
                </button>
                <button onClick={() => setDel(true)} className={`${btn.outline} border-transparent bg-bg/90 text-rose-600`}>
                  <Trash2 className="size-4" /> Excluir
                </button>
                <button onClick={() => setAdd(true)} className={btn.primary}>
                  <Plus className="size-4" /> Adicionar aula
                </button>
              </div>
            ) : (
              <div className="w-full rounded-2xl bg-bg/90 p-4 lg:w-72">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold">Seu progresso</span>
                  <span className="text-muted">
                    {p.k}/{p.n}
                  </span>
                </div>
                <ProgressBar value={p.pct} tone={p.pct === 1 ? "verified" : "accent"} />
              </div>
            )}
          </div>
        </TrilhaCover>
      </motion.div>

      {trilha.aulas.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Plus className="size-6" />}
            title="Nenhuma aula ainda"
            text={isAdmin ? "Adicione vídeos (MP4/MOV) e materiais (PDF/Word) a esta trilha." : "O administrador ainda não adicionou aulas."}
            action={
              isAdmin && (
                <button onClick={() => setAdd(true)} className={btn.accent}>
                  <Plus className="size-4" /> Adicionar aula
                </button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Aula aberta */}
          <motion.div {...stagger(2)} className="space-y-4">
            {aula && (
              <Card className="p-4 sm:p-5">
                <>
                  <motion.div key={aula.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}>
                    {aula.tipo === "video" ? <VideoPlayer aula={aula} trilha={trilha} /> : <DocumentoViewer aula={aula} />}
                    <div className="mt-5 flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted">
                          Aula {idx + 1} de {trilha.aulas.length} · {aula.formato}
                          {aula.duracaoMin ? ` · ${aula.duracaoMin} min` : ""}
                        </p>
                        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">{aula.titulo}</h2>
                        {aula.tipo === "video" && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
                            <Lock className="size-3" /> Vídeos não podem ser baixados.
                          </p>
                        )}
                      </div>
                      {!isAdmin && (
                        <button onClick={() => store.toggleAula(user.id, aula.id)} className={done ? btn.outline : btn.accent}>
                          {done ? (
                            <>
                              <CheckCircle2 className="size-4 text-verified" /> Concluída
                            </>
                          ) : (
                            <>
                              <Check className="size-4" /> Marcar como concluída
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                </>
              </Card>
            )}

            {isAdmin && (
              <Card>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <Users className="size-4 text-accent" /> Progresso da equipe
                    </span>
                  }
                  subtitle={`Conclusão média: ${Math.round(progressoEquipe(trilha) * 100)}%`}
                />
                <ul className="mt-3 space-y-1 px-3 pb-4">
                  {corretoresAtivos()
                    .map((c) => ({ c, pr: progressoTrilha(c.id, trilha) }))
                    .sort((a, b) => b.pr.pct - a.pr.pct)
                    .map(({ c, pr }) => (
                      <li key={c.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
                        <Avatar user={c} className="size-8 text-[0.625rem]" />
                        <span className="w-36 truncate text-sm font-medium">{c.nome}</span>
                        <ProgressBar value={pr.pct} className="h-1.5 flex-1" tone={pr.pct === 1 ? "verified" : "accent"} />
                        <span className="w-12 text-right text-xs font-semibold text-muted">
                          {pr.k}/{pr.n}
                        </span>
                      </li>
                    ))}
                </ul>
              </Card>
            )}
          </motion.div>

          {/* Lista de aulas */}
          <motion.div {...stagger(3)}>
            <Card className="xl:sticky xl:top-24">
              <CardHeader title="Aulas" subtitle={isAdmin ? "Clique para visualizar." : "Clique para assistir ou baixar."} />
              <ol className="mt-3 space-y-1 px-2 pb-3">
                {trilha.aulas.map((a, i) => {
                  const concl = aulaConcluida(user.id, a.id);
                  const active = a.id === sel;
                  return (
                    <li key={a.id} className="group relative">
                      <button
                        onClick={() => setSel(a.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${active ? "bg-accent-soft" : "hover:bg-canvas"}`}
                      >
                        <span
                          className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${
                            !isAdmin && concl ? "bg-verified text-white" : active ? "bg-accent text-white" : "bg-canvas-deep text-muted"
                          }`}
                        >
                          {!isAdmin && concl ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm ${active ? "font-semibold text-accent-deep" : "font-medium"}`}>{a.titulo}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                            <AulaIcon tipo={a.tipo} className="size-3.5" />
                            {a.formato} · {a.duracaoMin ? `${a.duracaoMin} min` : a.tipo === "video" ? "vídeo" : fmtBytes(a.tamanhoBytes)}
                          </span>
                        </span>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => store.removeAula(trilha.id, a.id)}
                          aria-label={`Remover ${a.titulo}`}
                          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Card>
          </motion.div>
        </div>
      )}

      <TrilhaFormModal open={edit} onClose={() => setEdit(false)} trilha={trilha} />
      <AulaFormModal open={add} onClose={() => setAdd(false)} trilhaId={trilha.id} />
      <Modal
        open={del}
        onClose={() => setDel(false)}
        title="Excluir trilha?"
        subtitle="As aulas e o progresso da equipe nesta trilha serão removidos."
        footer={
          <>
            <button onClick={() => setDel(false)} className={btn.outline}>
              Cancelar
            </button>
            <button
              onClick={() => {
                store.removeTrilha(trilha.id);
                navigate("/app/academy");
              }}
              className={`${btn.primary} bg-rose-600 hover:bg-rose-700`}
            >
              Excluir trilha
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Você está prestes a excluir <span className="font-semibold text-ink">{trilha.titulo}</span>. Essa ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}
