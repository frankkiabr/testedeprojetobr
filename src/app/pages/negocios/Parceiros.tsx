import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Handshake, Plus } from "lucide-react";
import { parceiros, transacoes } from "@/data/demo";
import { parteDe } from "@/data/queries";
import { useStore } from "@/data/store";
import type { Parceiro } from "@/data/types";
import { brl } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Avatar, Card } from "../../kit";
import { btn, EmptyState, formatPhone, waLink } from "../../forms";
import { ParceiroFormModal } from "./shared";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

/** Corretores externos (sem acesso), usados para registrar parcerias. Só o administrador vê. */
/** Foto do parceiro: clique para enviar ou trocar (sem foto, as iniciais). */
function FotoParceiro({ parceiro }: { parceiro: Parceiro }) {
  const { setFotoParceiro, toast } = useStore();
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        title={parceiro.fotoUrl ? "Trocar foto" : "Adicionar foto"}
        className={`relative shrink-0 rounded-full transition hover:ring-2 hover:ring-accent/40 ${enviando ? "opacity-50" : ""}`}
      >
        <Avatar user={{ id: parceiro.id, nome: parceiro.nome, fotoUrl: parceiro.fotoUrl, iniciais: parceiro.nome.split(" ").map((x) => x[0]).slice(0, 2).join("") }} className="size-9 text-xs" />
        <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border-2 border-bg bg-ink text-bg">
          <Camera className="size-2" />
        </span>
      </button>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const arq = e.target.files?.[0];
          e.target.value = "";
          if (!arq) return;
          setEnviando(true);
          const erro = await setFotoParceiro(parceiro.id, arq);
          setEnviando(false);
          toast(erro ?? "Foto do parceiro atualizada.");
        }}
      />
    </>
  );
}

export default function Parceiros() {
  useStore();
  const [novo, setNovo] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-muted">
          Corretores de fora da imobiliária que já fizeram parceria com a sua equipe. Eles <span className="font-semibold text-ink">não têm acesso</span> à plataforma: o cadastro
          serve só para registrar a parte deles nas vendas e locações.
        </p>
        <button onClick={() => setNovo(true)} className={btn.accent}>
          <Plus className="size-4" /> Novo parceiro
        </button>
      </div>

      <Card className="overflow-hidden">
        {parceiros.length === 0 ? (
          <EmptyState icon={<Handshake className="size-6" />} title="Nenhum parceiro cadastrado" text="Cadastre corretores externos para registrar parcerias." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-3 font-semibold">Parceiro</th>
                  <th className="px-3 py-3 font-semibold">CRECI</th>
                  <th className="px-3 py-3 font-semibold">Contato</th>
                  <th className="px-3 py-3 font-semibold">Parcerias</th>
                  <th className="px-5 py-3 text-right font-semibold">Total pago</th>
                </tr>
              </thead>
              <tbody>
                {parceiros.map((p, i) => {
                  const deles = transacoes.filter((t) => t.participantes.some((x) => x.tipo === "parceiro" && x.refId === p.id));
                  const pago = deles.reduce((s, t) => s + t.participantes.filter((x) => x.tipo === "parceiro" && x.refId === p.id).reduce((a, x) => a + parteDe(t, x), 0), 0);
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.03, ease: EASE_OUT_EXPO }}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <FotoParceiro parceiro={p} />
                          <span>
                            <span className="block font-semibold">{p.nome}</span>
                            <span className="block text-xs text-muted">{p.empresa ?? "—"}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted">{p.creci ?? "—"}</td>
                      <td className="px-3 py-3">
                        {p.telefone ? (
                          <a href={waLink(p.telefone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f8ec] px-2.5 py-1 text-xs font-semibold text-[#128c4a]">
                            <WhatsAppIcon className="size-3.5" /> {formatPhone(p.telefone)}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted">{deles.length}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{brl(pago)}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <ParceiroFormModal open={novo} onClose={() => setNovo(false)} />
    </div>
  );
}
