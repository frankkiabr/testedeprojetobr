import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Download, ImageIcon, Info, RefreshCw, Trash2, Upload } from "lucide-react";
import { imobiliaria, marca } from "@/data/demo";
import { useStore } from "@/data/store";
import { fmtBytes, inspectPng } from "@/lib/files";
import { relTime } from "@/lib/format";
import { useScope } from "../session";
import { Card, PageHeader, Segmented, stagger } from "../kit";
import { btn, EmptyState } from "../forms";

const CHECKER =
  "bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] bg-[image:linear-gradient(45deg,#e7ebf2_25%,transparent_25%),linear-gradient(-45deg,#e7ebf2_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e7ebf2_75%),linear-gradient(-45deg,transparent_75%,#e7ebf2_75%)]";

type Fundo = "claro" | "escuro" | "transparencia";

/** Só o administrador envia; todos baixam. Aceita apenas PNG. */
function useUpload() {
  const { setLogo } = useStore();
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (file?: File | null) => {
    if (!file) return;
    if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
      setErro("Envie a logo em PNG (de preferência com fundo transparente).");
      return;
    }
    setErro("");
    setBusy(true);
    const url = URL.createObjectURL(file);
    const info = await inspectPng(url);
    setBusy(false);
    if (!info.largura) {
      setErro("Não foi possível ler este arquivo. Verifique se é um PNG válido.");
      return;
    }
    setLogo({ nome: file.name, url, tamanhoBytes: file.size, enviadoEm: new Date().toISOString(), ...info });
  };
  return { send, erro, busy };
}

export default function Marketing() {
  useStore();
  const { isAdmin } = useScope();
  const { setLogo } = useStore();
  const { send, erro, busy } = useUpload();
  const input = useRef<HTMLInputElement>(null);
  const [fundo, setFundo] = useState<Fundo>("transparencia");
  const [drag, setDrag] = useState(false);
  const logo = marca.logo;

  const fundoCls = { claro: "bg-white", escuro: "bg-ink", transparencia: `bg-white ${CHECKER}` }[fundo];

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(true);
    },
    onDragLeave: () => setDrag(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      send(e.dataTransfer.files?.[0]);
    },
  };

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader
          title="Marketing"
          subtitle={isAdmin ? "Envie os materiais oficiais da imobiliária para toda a equipe." : "Materiais oficiais da imobiliária para baixar e usar."}
        />
      </motion.div>

      <input ref={input} type="file" accept="image/png,.png" className="hidden" onChange={(e) => (send(e.target.files?.[0]), (e.target.value = ""))} />

      <motion.div {...stagger(1)}>
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-1 border-b border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Logo da imobiliária</h2>
              <p className="text-sm text-muted">Arquivo PNG com fundo transparente, pronto para usar em artes, anúncios e apresentações.</p>
            </div>
          </div>

          {!logo ? (
            isAdmin ? (
              <div className="p-6">
                <button
                  onClick={() => input.current?.click()}
                  {...dropProps}
                  className={`flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
                    drag ? "border-accent bg-accent-soft" : "border-line-strong hover:border-accent/50 hover:bg-canvas"
                  }`}
                >
                  <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
                    <Upload className="size-6" />
                  </span>
                  <span className="font-semibold">{busy ? "Verificando o arquivo..." : "Arraste a logo aqui ou clique para enviar"}</span>
                  <span className="text-sm text-muted">Apenas PNG · de preferência com fundo transparente</span>
                </button>
                {erro && <p className="mt-3 text-sm font-medium text-rose-600">{erro}</p>}
              </div>
            ) : (
              <EmptyState icon={<ImageIcon className="size-6" />} title="Logo ainda não enviada" text="Quando o administrador enviar a logo da imobiliária, ela aparece aqui para download." />
            )
          ) : (
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              {/* Prévia */}
              <div className="border-b border-line p-6 lg:border-b-0 lg:border-r" {...(isAdmin ? dropProps : {})}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-muted">Prévia</span>
                  <Segmented
                    id="logo-fundo"
                    size="sm"
                    value={fundo}
                    onChange={setFundo}
                    options={[
                      { value: "transparencia", label: "Transparência" },
                      { value: "claro", label: "Fundo claro" },
                      { value: "escuro", label: "Fundo escuro" },
                    ]}
                  />
                </div>
                <motion.div
                  layout
                  className={`relative grid aspect-[16/9] place-items-center rounded-2xl border border-line p-8 transition-colors duration-500 ${fundoCls} ${drag ? "ring-4 ring-accent/40" : ""}`}
                >
                  <motion.img
                    key={logo.url}
                    src={logo.url}
                    alt={`Logo ${imobiliaria.nome}`}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`max-h-full max-w-full object-contain ${fundo === "escuro" ? "drop-shadow-[0_0_1px_rgba(255,255,255,0.6)]" : ""}`}
                  />
                </motion.div>
                {fundo === "escuro" && <p className="mt-2 text-xs text-subtle">Confira se a logo continua legível em fundos escuros.</p>}
              </div>

              {/* Detalhes e ações */}
              <div className="flex flex-col gap-5 p-6">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Arquivo</dt>
                    <dd className="truncate font-medium">{logo.nome}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Dimensões</dt>
                    <dd className="font-medium">
                      {logo.largura} × {logo.altura} px
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Tamanho</dt>
                    <dd className="font-medium">{fmtBytes(logo.tamanhoBytes)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Atualizada</dt>
                    <dd className="font-medium">{relTime(logo.enviadoEm)}</dd>
                  </div>
                </dl>

                {logo.transparente === true && (
                  <p className="flex items-start gap-2 rounded-2xl bg-verified-soft p-3 text-sm text-verified">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> Fundo transparente confirmado.
                  </p>
                )}
                {logo.transparente === false && (
                  <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Não encontramos transparência nesta imagem. O ideal é um PNG com fundo transparente.
                  </p>
                )}

                <div className="mt-auto flex flex-col gap-2">
                  <a href={logo.url} download={logo.nome} className={`${btn.primary} h-12`}>
                    <Download className="size-4" /> Baixar logo (PNG)
                  </a>
                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => input.current?.click()} className={btn.outline} disabled={busy}>
                        <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} /> Substituir
                      </button>
                      <button onClick={() => setLogo(null)} className={`${btn.outline} text-rose-600`}>
                        <Trash2 className="size-4" /> Remover
                      </button>
                    </div>
                  )}
                  {erro && <p className="text-sm font-medium text-rose-600">{erro}</p>}
                </div>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      <motion.p {...stagger(2)} className="flex items-start gap-2 text-sm text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        {isAdmin
          ? "Ao substituir a logo, todos os corretores passam a baixar a versão nova automaticamente."
          : "Use sempre este arquivo oficial nas suas artes e anúncios. Ele é atualizado pelo administrador."}
      </motion.p>
    </div>
  );
}
