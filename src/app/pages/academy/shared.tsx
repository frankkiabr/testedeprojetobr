import { useEffect, useRef, useState } from "react";
import { FileText, GraduationCap, Upload, Video } from "lucide-react";
import { useStore } from "@/data/store";
import type { Trilha } from "@/data/types";
import { ACCEPT_AULA, classifyAula, fmtBytes } from "@/lib/files";
import { btn, Field, inputCls, Modal } from "../../forms";

export function TrilhaCover({ trilha, className = "", children }: { trilha: Trilha; className?: string; children?: React.ReactNode }) {
  const h = trilha.capaHue;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(90% 90% at 10% 0%, hsl(${h} 95% 86%), transparent 60%),
          radial-gradient(80% 80% at 100% 100%, hsl(${h + 30} 85% 66%), transparent 65%),
          linear-gradient(140deg, hsl(${h} 70% 92%), hsl(${h} 60% 72%))`,
      }}
    >
      <GraduationCap className="absolute -bottom-6 -right-4 size-40 text-white/30" strokeWidth={1.2} />
      {children}
    </div>
  );
}

export const AulaIcon = ({ tipo, className = "size-4" }: { tipo: "video" | "documento"; className?: string }) =>
  tipo === "video" ? <Video className={className} /> : <FileText className={className} />;

/** Criar ou editar trilha (título e subtítulo). */
export function TrilhaFormModal({
  open,
  onClose,
  trilha,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  trilha?: Trilha;
  onCreated?: (t: Trilha) => void;
}) {
  const { addTrilha, updateTrilha } = useStore();
  const [f, setF] = useState({ titulo: "", subtitulo: "" });
  useEffect(() => {
    if (open) setF({ titulo: trilha?.titulo ?? "", subtitulo: trilha?.subtitulo ?? "" });
  }, [open, trilha]);
  const ok = f.titulo.trim() && f.subtitulo.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={trilha ? "Editar trilha" : "Nova trilha"}
      subtitle={trilha ? undefined : "Depois de criar, adicione as aulas em vídeo e os materiais."}
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <button
            disabled={!ok}
            className={btn.primary}
            onClick={() => {
              const data = { titulo: f.titulo.trim(), subtitulo: f.subtitulo.trim() };
              if (trilha) updateTrilha(trilha.id, data);
              else onCreated?.(addTrilha(data));
              onClose();
            }}
          >
            {trilha ? "Salvar" : "Criar trilha"}
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Título">
          <input autoFocus className={inputCls} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Ex.: Captação de imóveis" />
        </Field>
        <Field label="Subtítulo">
          <input className={inputCls} value={f.subtitulo} onChange={(e) => setF({ ...f, subtitulo: e.target.value })} placeholder="Ex.: Técnicas para captar mais e com qualidade." />
        </Field>
      </div>
    </Modal>
  );
}

/** Adicionar aula: vídeo (MP4/MOV) ou documento (PDF/DOC/DOCX). */
export function AulaFormModal({ open, onClose, trilhaId }: { open: boolean; onClose: () => void; trilhaId: string }) {
  const { addAula } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState("");
  const [duracao, setDuracao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [erro, setErro] = useState("");
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (open) {
      setTitulo("");
      setDuracao("");
      setFile(null);
      setErro("");
    }
  }, [open]);

  const pick = (f?: File | null) => {
    if (!f) return;
    if (!classifyAula(f.name)) {
      setErro("Formato não aceito. Envie MP4, MOV, PDF, DOC ou DOCX.");
      setFile(null);
      return;
    }
    setErro("");
    setFile(f);
    if (!titulo) setTitulo(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  };

  const kind = file ? classifyAula(file.name) : null;
  const ok = file && kind && titulo.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adicionar aula"
      subtitle="Vídeos ficam só para assistir. Documentos ganham botão de download."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <button
            disabled={!ok}
            className={btn.primary}
            onClick={() => {
              addAula(trilhaId, {
                titulo: titulo.trim(),
                tipo: kind!.tipo,
                formato: kind!.formato,
                arquivoNome: file!.name,
                tamanhoBytes: file!.size,
                duracaoMin: kind!.tipo === "video" && Number(duracao) > 0 ? Number(duracao) : undefined,
                url: URL.createObjectURL(file!),
              });
              onClose();
            }}
          >
            Adicionar aula
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            drag ? "border-accent bg-accent-soft" : file ? "border-verified/40 bg-verified-soft/50" : "border-line-strong hover:border-accent/50 hover:bg-canvas"
          }`}
        >
          {file && kind ? (
            <>
              <span className="grid size-12 place-items-center rounded-2xl bg-bg text-accent shadow-pill">
                <AulaIcon tipo={kind.tipo} className="size-5" />
              </span>
              <span className="text-sm font-semibold">{file.name}</span>
              <span className="text-xs text-muted">
                {kind.formato} · {fmtBytes(file.size)} · clique para trocar
              </span>
            </>
          ) : (
            <>
              <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
                <Upload className="size-5" />
              </span>
              <span className="text-sm font-semibold">Arraste o arquivo aqui ou clique para escolher</span>
              <span className="text-xs text-muted">MP4 ou MOV (vídeo) · PDF, DOC ou DOCX (documento)</span>
            </>
          )}
        </button>
        <input ref={input} type="file" accept={ACCEPT_AULA} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {erro && <p className="-mt-2 text-sm font-medium text-rose-600">{erro}</p>}

        <Field label="Título da aula">
          <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Abordagem ao proprietário" />
        </Field>
        {kind?.tipo === "video" && (
          <Field label="Duração em minutos (opcional)">
            <input className={inputCls} inputMode="numeric" value={duracao} onChange={(e) => setDuracao(e.target.value.replace(/\D/g, ""))} placeholder="Ex.: 15" />
          </Field>
        )}
      </div>
    </Modal>
  );
}
