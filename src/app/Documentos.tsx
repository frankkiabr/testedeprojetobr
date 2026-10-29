import { useEffect, useRef, useState } from "react";
import { Download, Eye, FileImage, FileSpreadsheet, FileText, Loader2, Paperclip, Trash2 } from "lucide-react";
import { useStore } from "@/data/store";
import {
  ACEITOS,
  enviarDocumento,
  excluirDocumento,
  linkDocumento,
  listarDocumentos,
  problemaNoArquivo,
  type Documento,
  type TipoCliente,
} from "@/data/documentos";
import { mensagemErro } from "@/integrations/frankkia/client";
import { relTime } from "@/lib/format";

const tamanho = (b: number) => (b >= 1048576 ? `${(b / 1048576).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const Icone = ({ nome }: { nome: string }) => {
  const Ic = /\.(jpe?g|png|webp|heic|heif)$/i.test(nome) ? FileImage : /\.xlsx?$/i.test(nome) ? FileSpreadsheet : FileText;
  return <Ic className="size-4" />;
};

/**
 * DOCUMENTOS DO CLIENTE (lead ou proprietário): enviar, abrir, baixar e excluir.
 * Arquivos privados: só o corretor do cliente e o administrador acessam, por link temporário.
 */
export function Documentos({ tipo, refId, corretorId }: { tipo: TipoCliente; refId: string; corretorId: string }) {
  const { toast } = useStore();
  const entrada = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Documento[] | null>(null);
  const [enviando, setEnviando] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [confirmar, setConfirmar] = useState<string | null>(null);

  useEffect(() => {
    setDocs(null);
    setConfirmar(null);
    listarDocumentos(tipo, refId)
      .then(setDocs)
      .catch((e) => {
        setDocs([]);
        toast(mensagemErro(e));
      });
  }, [tipo, refId]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async (lista: FileList | File[] | null) => {
    const arquivos = Array.from(lista ?? []);
    if (!arquivos.length) return;
    const ruins = arquivos.map(problemaNoArquivo).filter(Boolean);
    if (ruins.length) toast(ruins[0]!);
    const bons = arquivos.filter((f) => !problemaNoArquivo(f));
    setEnviando(bons.length);
    for (const f of bons) {
      try {
        const d = await enviarDocumento(tipo, refId, corretorId, f);
        setDocs((l) => [d, ...(l ?? [])]);
      } catch (e) {
        toast(mensagemErro(e));
      }
      setEnviando((n) => n - 1);
    }
    if (bons.length) toast(bons.length === 1 ? "Documento guardado." : `${bons.length} documentos guardados.`);
  };

  // A janela abre antes de buscar o link, para o navegador não bloquear
  const abrir = async (d: Documento, baixar = false) => {
    const janela = baixar ? null : window.open("", "_blank");
    try {
      const url = await linkDocumento(d, baixar);
      if (janela) janela.location.href = url;
      else {
        const a = document.createElement("a");
        a.href = url;
        a.download = d.nome;
        a.click();
      }
    } catch (e) {
      janela?.close();
      toast(mensagemErro(e));
    }
  };

  const excluir = async (d: Documento) => {
    try {
      await excluirDocumento(tipo, refId, d);
      setDocs((l) => (l ?? []).filter((x) => x.id !== d.id));
      setConfirmar(null);
      toast("Documento excluído.");
    } catch (e) {
      toast(mensagemErro(e));
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">Documentos</p>
          <p className="text-xs text-muted">RG, comprovantes, contratos... Só você e o administrador acessam.</p>
        </div>
        {docs && docs.length > 0 && <span className="text-sm font-semibold text-accent">{docs.length}</span>}
      </div>

      <button
        type="button"
        onClick={() => entrada.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          void enviar(e.dataTransfer.files);
        }}
        disabled={enviando > 0}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-4 text-sm font-semibold transition ${
          arrastando ? "border-accent bg-accent-soft/50 text-accent" : "border-line-strong text-muted hover:border-accent hover:text-accent"
        }`}
      >
        {enviando > 0 ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Enviando {enviando} {enviando === 1 ? "arquivo" : "arquivos"}...
          </>
        ) : (
          <>
            <Paperclip className="size-4" /> Anexar documentos
            <span className="hidden font-normal text-subtle sm:inline">· PDF, foto, Word ou Excel até 15 MB</span>
          </>
        )}
      </button>
      <input
        ref={entrada}
        type="file"
        multiple
        accept={ACEITOS}
        className="hidden"
        onChange={(e) => {
          void enviar(e.target.files);
          e.target.value = "";
        }}
      />

      {docs === null ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </p>
      ) : (
        docs.length > 0 && (
          <ul className="mt-3 space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-2xl bg-canvas p-2.5 pl-3 text-sm">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-bg text-accent shadow-soft">
                  <Icone nome={d.nome} />
                </span>
                <button onClick={() => abrir(d)} className="min-w-0 flex-1 text-left" title="Abrir">
                  <p className="truncate font-semibold hover:text-accent">{d.nome}</p>
                  <p className="text-xs text-muted">
                    {tamanho(d.tamanho)} · {relTime(d.criadoEm)}
                  </p>
                </button>
                {confirmar === d.id ? (
                  <span className="flex shrink-0 items-center gap-1">
                    <button onClick={() => excluir(d)} className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">
                      Excluir
                    </button>
                    <button onClick={() => setConfirmar(null)} className="rounded-full px-2 py-1.5 text-xs font-semibold text-muted">
                      Não
                    </button>
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center">
                    <button onClick={() => abrir(d)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink" title="Abrir">
                      <Eye className="size-4" />
                    </button>
                    <button onClick={() => abrir(d, true)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink" title="Baixar">
                      <Download className="size-4" />
                    </button>
                    <button onClick={() => setConfirmar(d.id)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-bg hover:text-rose-600" title="Excluir">
                      <Trash2 className="size-4" />
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
