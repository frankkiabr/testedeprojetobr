/** Apresentação do estudo: copiar o link, abrir, mandar pelo WhatsApp ou por e-mail; e a ponte para criar a captação. */
import { useState } from "react";
import { Check, Copy, ExternalLink, Mail, ShieldAlert } from "lucide-react";
import { categoriaImovel, enviarEstudoPorEmail, linkApresentacao, type Avaliacao } from "@/data/avaliacoes";
import { useStore } from "@/data/store";
import { mensagemErro } from "@/integrations/frankkia/client";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { btn, Field, inputCls, Modal, moeda, waLink } from "../../forms";

const CHAVE_CAPTACAO = "frankkia:captacao-do-estudo";

/** Guarda os dados do estudo para o formulário "Nova captação" abrir já preenchido. */
export function guardarCaptacaoDoEstudo(a: Avaliacao, valorSugerido?: number) {
  const t = (n?: number) => (n === undefined ? "" : String(n));
  try {
    sessionStorage.setItem(
      CHAVE_CAPTACAO,
      JSON.stringify({
        finalidade: a.finalidade,
        categoria: categoriaImovel(a.categoria),
        cep: a.cep ?? "",
        logradouro: a.logradouro ?? "",
        numero: a.numero ?? "",
        bairro: a.bairro ?? "",
        cidade: a.cidade ?? "",
        uf: a.uf ?? "",
        unidade: a.complemento ?? "",
        area: t(a.areaM2),
        valor: moeda(Math.round(a.valorAnunciado ?? valorSugerido ?? 0) || undefined),
        quartos: t(a.quartos),
        suites: t(a.suites),
        banheiros: t(a.banheiros),
        vagas: t(a.vagas),
        ...(a.proprietarioId ? { modo: "existente", proprietarioId: a.proprietarioId } : {}),
        lat: a.lat,
        lng: a.lng,
      }),
    );
  } catch {
    /* armazenamento indisponível */
  }
}

/** Lê os dados guardados pelo estudo, para o formulário de captação (apagados quando o formulário fecha). */
export function lerCaptacaoDoEstudo(): (Record<string, string> & { lat?: number; lng?: number }) | null {
  try {
    const v = sessionStorage.getItem(CHAVE_CAPTACAO);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export function limparCaptacaoDoEstudo() {
  try {
    sessionStorage.removeItem(CHAVE_CAPTACAO);
  } catch {
    /* armazenamento indisponível */
  }
}

export function Compartilhar({
  open,
  a,
  real,
  whatsappProprietario,
  nomeProprietario,
  onClose,
  onApresentado,
  onLiberar,
}: {
  open: boolean;
  a: Avaliacao;
  real: boolean;
  whatsappProprietario?: string;
  nomeProprietario?: string;
  onClose: () => void;
  onApresentado: () => void;
  onLiberar: () => void;
}) {
  const { toast } = useStore();
  const [copiado, setCopiado] = useState(false);
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const link = linkApresentacao(a);
  const primeiro = nomeProprietario?.split(" ")[0];
  const msg = `Olá${primeiro ? `, ${primeiro}` : ""}! Preparei o estudo de mercado do seu imóvel. Veja aqui: ${link}`;

  return (
    <Modal open={open} onClose={onClose} title="Apresentação do estudo" subtitle="Uma página só com os valores marcados e as amostras, no visual da Frankkia.">
      {!a.linkLiberado ? (
        <div className="space-y-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="size-4" /> O link da apresentação está bloqueado
          </p>
          <p>Enquanto estiver bloqueado, quem tiver o endereço não consegue abrir o estudo.</p>
          <button className={btn.accent} onClick={onLiberar}>
            Liberar o link
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <Field label="Link para o proprietário">
            <div className="flex gap-2">
              <input className={`${inputCls} text-sm`} readOnly value={link} onFocus={(e) => e.target.select()} />
              <button
                className={btn.outline}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 1800);
                  } catch {
                    /* sem acesso à área de transferência */
                  }
                }}
              >
                {copiado ? <Check className="size-4 text-verified" /> : <Copy className="size-4" />} {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
          </Field>
          <div className="flex flex-wrap gap-2">
            <a href={link} target="_blank" rel="noreferrer" className={btn.outline}>
              <ExternalLink className="size-4" /> Apresentação
            </a>
            <a
              href={whatsappProprietario ? waLink(whatsappProprietario, msg) : `https://wa.me/?text=${encodeURIComponent(msg)}`}
              target="_blank"
              rel="noreferrer"
              className={btn.whatsapp}
              onClick={onApresentado}
            >
              <WhatsAppIcon className="size-4" /> {whatsappProprietario ? `Enviar para ${primeiro ?? "o proprietário"}` : "Enviar pelo WhatsApp"}
            </a>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="size-4 text-accent" /> Enviar por e-mail
            </p>
            <div className="mt-3 flex gap-2">
              <input className={inputCls} type="email" placeholder="e-mail do proprietário" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button
                className={btn.primary}
                disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || enviando}
                onClick={async () => {
                  setEnviando(true);
                  const r = await enviarEstudoPorEmail(real, a, email.trim(), nomeProprietario);
                  setEnviando(false);
                  if (r.erro) return toast(mensagemErro(r.erro));
                  onApresentado();
                  setEmail("");
                  toast("Estudo enviado por e-mail.");
                }}
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted">Ao enviar pelo WhatsApp ou por e-mail, o estudo é marcado como apresentado.</p>
        </div>
      )}
    </Modal>
  );
}
