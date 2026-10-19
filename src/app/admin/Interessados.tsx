import { useState } from "react";
import { motion } from "framer-motion";
import { Ban, Copy, Inbox, Link2, Mail, MonitorPlay, Plus } from "lucide-react";
import { acessosDemo, demoAtiva, interessados, linkDemo, STATUS_INTERESSADO } from "@/data/platform";
import { useStore } from "@/data/store";
import type { Interessado, StatusInteressado } from "@/data/types";
import { relTime } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Badge, Card, CardHeader, PageHeader, Segmented, stagger } from "../kit";
import { btn, EmptyState, Field, formatPhone, inputCls, Modal, SelectField, waLink } from "../forms";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

type Filtro = "abertos" | "todos";

const primeiroNome = (n: string) => n.trim().split(/\s+/)[0];
const msgContato = (i: Interessado) =>
  `Olá, ${primeiroNome(i.nome)}! Aqui é da Frankkia. Recebemos seu pedido de apresentação para a ${i.imobiliaria}. Qual o melhor dia e horário para conversarmos?`;
const msgDemo = (nome: string, link: string, dias: number) =>
  `Olá, ${primeiroNome(nome)}! Liberamos para você uma demonstração da Frankkia, válida por ${dias} dias: ${link}`;

/** Donos de imobiliária que pediram uma apresentação + links de demonstração liberados. */
export default function Interessados() {
  const store = useStore();
  const [filtro, setFiltro] = useState<Filtro>("abertos");
  const [liberar, setLiberar] = useState<{ nome: string; telefone?: string; interessadoId?: string } | null>(null);
  const [dias, setDias] = useState("7");
  const [criado, setCriado] = useState<{ link: string; nome: string; telefone?: string; dias: number } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const abertos = interessados.filter((i) => i.status === "novo" || i.status === "em_contato" || i.status === "demo_liberada");
  const lista = filtro === "abertos" ? abertos : interessados;
  const nDias = Math.min(30, Math.max(1, Number(dias) || 7));

  const copiar = (texto: string) =>
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader
          title="Interessados"
          subtitle="Donos de imobiliária que pediram uma apresentação. Responda pelo WhatsApp em até 24 horas."
          actions={
            <button onClick={() => setLiberar({ nome: "" })} className={btn.outline}>
              <Plus className="size-4" /> Link de demonstração
            </button>
          }
        />
      </motion.div>

      <motion.div {...stagger(1)}>
        <Segmented
          id="interessados"
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "abertos", label: `Em aberto (${abertos.length})` },
            { value: "todos", label: `Todos (${interessados.length})` },
          ]}
        />
      </motion.div>

      <motion.div {...stagger(2)}>
        <Card className="overflow-hidden">
          {lista.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-6" />}
              title="Nenhum pedido por aqui"
              text="Quando alguém pedir uma apresentação pelo site ou pela tela de login, aparece aqui."
            />
          ) : (
            <ul>
              {lista.map((i, k) => (
                <motion.li
                  key={i.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(k, 10) * 0.03, ease: EASE_OUT_EXPO }}
                  className="flex flex-col gap-4 border-b border-line px-5 py-5 last:border-0 sm:px-6 lg:flex-row lg:items-start"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{i.nome}</p>
                      <Badge tone={STATUS_INTERESSADO[i.status].tone}>{STATUS_INTERESSADO[i.status].label}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {i.imobiliaria}
                      {i.equipe ? ` · ${i.equipe}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-subtle">
                      {formatPhone(i.telefone)} · {i.email} · pedido {relTime(i.criadoEm)}
                    </p>
                    {i.mensagem && <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-sm text-muted">“{i.mensagem}”</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:max-w-[22rem] lg:justify-end">
                    <a
                      href={waLink(i.telefone, msgContato(i))}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => i.status === "novo" && store.setInteressado(i.id, { status: "em_contato" })}
                      className={`${btn.accent} h-9 px-3 text-xs`}
                    >
                      <WhatsAppIcon className="size-3.5" /> WhatsApp
                    </a>
                    <a href={`mailto:${i.email}`} className={`${btn.outline} h-9 px-3 text-xs`}>
                      <Mail className="size-3.5" /> E-mail
                    </a>
                    <button
                      onClick={() => setLiberar({ nome: `${i.nome} · ${i.imobiliaria}`, telefone: i.telefone, interessadoId: i.id })}
                      className={`${btn.outline} h-9 px-3 text-xs`}
                    >
                      <MonitorPlay className="size-3.5" /> Liberar demonstração
                    </button>
                    <div className="w-44">
                      <SelectField
                        value={i.status}
                        onChange={(v) => store.setInteressado(i.id, { status: v as StatusInteressado }, "Situação atualizada.")}
                        options={(Object.keys(STATUS_INTERESSADO) as StatusInteressado[]).map((s) => ({ value: s, label: STATUS_INTERESSADO[s].label }))}
                      />
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      {/* Links de demonstração */}
      <motion.div {...stagger(3)}>
        <Card>
          <CardHeader title="Links de demonstração" subtitle="A demonstração só abre por estes links, até a data de validade." />
          {acessosDemo.length === 0 ? (
            <p className="px-6 pb-6 pt-3 text-sm text-muted">Nenhum link criado ainda.</p>
          ) : (
            <ul className="mt-3">
              {acessosDemo.map((a) => {
                const ativa = demoAtiva(a);
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5 last:border-0 sm:px-6">
                    <Link2 className="size-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.nome}</p>
                      <p className="text-xs text-muted">
                        {a.revogado
                          ? "Desativado"
                          : ativa
                            ? `Válido até ${new Date(a.expiraEm).toLocaleDateString("pt-BR")}`
                            : `Venceu em ${new Date(a.expiraEm).toLocaleDateString("pt-BR")}`}
                        {" · "}
                        {a.usos ? `aberto ${a.usos}× (último ${relTime(a.ultimoUso ?? a.criadoEm)})` : "ainda não aberto"}
                      </p>
                    </div>
                    <Badge tone={ativa ? "verified" : "neutral"}>{ativa ? "Ativo" : "Inativo"}</Badge>
                    {ativa && (
                      <>
                        <button onClick={() => copiar(linkDemo(a.token))} title="Copiar link" className="grid size-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink">
                          <Copy className="size-4" />
                        </button>
                        <button
                          onClick={() => store.revogarDemo(a.id)}
                          title="Desativar link"
                          className="grid size-8 place-items-center rounded-full text-muted hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Ban className="size-4" />
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </motion.div>

      {/* Criar link de demonstração */}
      <Modal
        open={!!liberar}
        onClose={() => setLiberar(null)}
        title="Liberar demonstração"
        subtitle="Gera um link que abre a demonstração (dados de exemplo) até a data de validade."
        footer={
          <>
            <button onClick={() => setLiberar(null)} className={btn.outline}>
              Cancelar
            </button>
            <button
              disabled={!liberar?.nome.trim()}
              className={btn.accent}
              onClick={() => {
                if (!liberar) return;
                const link = store.liberarDemo(liberar.nome, nDias, liberar.interessadoId);
                setCriado({ link, nome: liberar.nome, telefone: liberar.telefone, dias: nDias });
                setLiberar(null);
                setCopiado(false);
              }}
            >
              <MonitorPlay className="size-4" /> Gerar link
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field label="Para quem">
            <input
              className={inputCls}
              value={liberar?.nome ?? ""}
              onChange={(e) => liberar && setLiberar({ ...liberar, nome: e.target.value })}
              placeholder="Ex.: João · Imobiliária Central"
            />
          </Field>
          <Field label="Válido por">
            <div className="flex items-center gap-2">
              <input className={`${inputCls} text-center`} inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value.replace(/\D/g, "").slice(0, 2))} />
              <span className="text-sm text-muted">dias</span>
            </div>
          </Field>
        </div>
      </Modal>

      {/* Link criado */}
      <Modal
        open={!!criado}
        onClose={() => setCriado(null)}
        title="Link de demonstração pronto"
        subtitle={criado ? `Válido por ${criado.dias} dias. Envie para ${criado.nome}.` : undefined}
        footer={
          <>
            {criado?.telefone && (
              <a href={waLink(criado.telefone, msgDemo(criado.nome, criado.link, criado.dias))} target="_blank" rel="noreferrer" className={btn.accent}>
                <WhatsAppIcon className="size-4" /> Enviar pelo WhatsApp
              </a>
            )}
            <button onClick={() => setCriado(null)} className={btn.outline}>
              Concluir
            </button>
          </>
        }
      >
        <div className="flex gap-2">
          <input readOnly className={inputCls} value={criado?.link ?? ""} onFocus={(e) => e.target.select()} />
          <button onClick={() => criado && copiar(criado.link)} className={btn.outline}>
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
