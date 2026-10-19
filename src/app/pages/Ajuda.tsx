import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LifeBuoy, Mail, Plus, Send } from "lucide-react";
import { site } from "@/content";
import { chamados } from "@/data/demo";
import { useStore } from "@/data/store";
import type { Chamado } from "@/data/types";
import { relTime } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useScope } from "../session";
import { Badge, Card, CardHeader, PageHeader, stagger } from "../kit";
import { btn, Field, inputCls, SelectField } from "../forms";

const FAQ = [
  { q: "Como cadastro um lead?", a: "Em Negócios › Leads, clique em “Novo lead”, preencha nome, WhatsApp, origem e interesse. O lead entra na coluna “Novo” e aparece na sua Visão geral até ser atendido." },
  { q: "Quando um lead conta como atendido?", a: "Assim que o primeiro passo do checklist de atendimento é marcado. É esse dado que alimenta o ranking de leads atendidos em Performance." },
  { q: "Como mudo a etapa de um lead?", a: "No quadro, arraste o cartão para outra coluna. Você também pode abrir o lead e escolher a etapa no topo do painel." },
  { q: "Como envio o relatório ao proprietário?", a: "Abra o imóvel em Negócios › Imóveis e clique em “Gerar relatório”. A mensagem é montada com as ações do checklist de marketing e enviada pelo WhatsApp cadastrado do proprietário." },
  { q: "Como registro uma venda?", a: "Em Negócios › Vendas, clique em “Registrar venda”, escolha o imóvel e informe o valor e a comissão. O imóvel passa para “Vendido” e o VGV e o VGC são atualizados na hora." },
  { q: "Quem pode ver a minha comissão (VGC)?", a: "Somente você e o administrador da imobiliária. Os outros corretores não veem a sua comissão em nenhum lugar da plataforma." },
  { q: "Como convido um corretor?", a: "O administrador acessa Equipe, digita o e-mail e clica em “Convidar”. O convite ocupa uma vaga do plano até ser aceito ou cancelado." },
  { q: "Que arquivos posso enviar na Academy?", a: "Vídeos em MP4 ou MOV (apenas para assistir) e documentos em PDF, DOC ou DOCX (com botão de download para a equipe)." },
];

const CATEGORIAS = ["Dúvida", "Problema técnico", "Sugestão", "Financeiro"];

const STATUS: Record<Chamado["status"], { label: string; tone: "warn" | "accent" | "verified" }> = {
  aberto: { label: "Aberto", tone: "warn" },
  em_andamento: { label: "Em andamento", tone: "accent" },
  resolvido: { label: "Resolvido", tone: "verified" },
};

export default function Ajuda() {
  const { addChamado } = useStore();
  const { user } = useScope();
  const [open, setOpen] = useState<number | null>(0);
  const [f, setF] = useState({ assunto: "", categoria: CATEGORIAS[0], mensagem: "" });
  const meus = chamados.filter((c) => c.autorId === user.id);
  const ok = f.assunto.trim() && f.mensagem.trim();

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader title="Ajuda" subtitle="Tire dúvidas sobre a plataforma ou fale com a equipe Frankkia." />
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Perguntas frequentes */}
        <motion.div {...stagger(1)}>
          <Card>
            <CardHeader title="Perguntas frequentes" />
            <ul className="mt-2 px-6 pb-3">
              {FAQ.map((it, i) => {
                const isOpen = open === i;
                return (
                  <li key={it.q} className="border-b border-line last:border-0">
                    <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="group flex w-full items-center justify-between gap-4 py-4 text-left">
                      <span className="font-semibold transition-colors group-hover:text-accent">{it.q}</span>
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color,rotate] duration-500 ease-out-expo ${
                          isOpen ? "rotate-45 border-ink bg-ink text-bg" : "border-line-strong"
                        }`}
                      >
                        <Plus className="size-4" />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                          className="overflow-hidden pr-12 text-sm leading-relaxed text-muted"
                        >
                          <span className="block pb-4">{it.a}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </Card>
        </motion.div>

        <div className="space-y-6">
          {/* Abrir chamado */}
          <motion.div {...stagger(2)}>
            <Card className="p-6">
              <p className="flex items-center gap-2 font-display text-lg font-semibold">
                <LifeBuoy className="size-5 text-accent" /> Abrir chamado
              </p>
              <p className="mt-1 text-sm text-muted">O chamado chega direto para a equipe Frankkia.</p>
              <div className="mt-5 grid gap-4">
                <Field label="Assunto">
                  <input className={inputCls} value={f.assunto} onChange={(e) => setF({ ...f, assunto: e.target.value })} placeholder="Resuma em uma frase" />
                </Field>
                <Field label="Categoria">
                  <SelectField value={f.categoria} onChange={(v) => setF({ ...f, categoria: v })} options={CATEGORIAS.map((c) => ({ value: c, label: c }))} />
                </Field>
                <Field label="Mensagem">
                  <textarea
                    rows={4}
                    className={`${inputCls} h-auto resize-none py-3`}
                    value={f.mensagem}
                    onChange={(e) => setF({ ...f, mensagem: e.target.value })}
                    placeholder="Conte o que aconteceu ou o que você precisa."
                  />
                </Field>
                <button
                  disabled={!ok}
                  onClick={() => {
                    addChamado({ autorId: user.id, assunto: f.assunto.trim(), categoria: f.categoria, mensagem: f.mensagem.trim() });
                    setF({ assunto: "", categoria: CATEGORIAS[0], mensagem: "" });
                  }}
                  className={`${btn.accent} h-11`}
                >
                  <Send className="size-4" /> Enviar chamado
                </button>
              </div>
              <a href={`mailto:${site.email}`} className="mt-4 flex items-center gap-2 text-sm text-muted hover:text-ink">
                <Mail className="size-4" /> Ou escreva para {site.email}
              </a>
            </Card>
          </motion.div>

          {/* Meus chamados */}
          <motion.div {...stagger(3)}>
            <Card>
              <CardHeader title="Meus chamados" subtitle={meus.length ? `${meus.length} no total` : "Você ainda não abriu chamados."} />
              <ul className="mt-3 px-3 pb-3">
                <AnimatePresence initial={false}>
                  {meus.map((c) => (
                    <motion.li
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl px-3 py-3 hover:bg-canvas"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{c.assunto}</p>
                          <p className="text-xs text-muted">
                            {c.categoria} · {relTime(c.criadoEm)}
                          </p>
                        </div>
                        <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                      </div>
                      {c.resposta && (
                        <p className="mt-2.5 rounded-xl bg-verified-soft/70 p-3 text-xs leading-relaxed">
                          <span className="mb-0.5 block font-semibold text-verified">Resposta da Frankkia</span>
                          {c.resposta}
                        </p>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
