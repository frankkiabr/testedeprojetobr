import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Check, ClipboardList, LineChart, MessageCircle, Users } from "lucide-react";
import type { FeatureKey } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

/**
 * Interfaces demonstrativas das funções exibidas no site (dados ilustrativos).
 * Cada uma espelha uma tela real do painel. Desenhadas em 640 × 480.
 */
export const FEATURE_SIZE = { width: 640, height: 480 };

const HUES: Record<FeatureKey, number> = { captacao: 226, leads: 210, agenda: 262, relatorio: 150, mercado: 196 };

function Stage({ k, icon, title, children }: { k: FeatureKey; icon: ReactNode; title: string; children: ReactNode }) {
  const h = HUES[k];
  return (
    <div
      className="relative size-full"
      style={{
        background: `radial-gradient(90% 80% at 10% 0%, hsl(${h} 95% 88%), transparent 60%),
          radial-gradient(80% 70% at 100% 100%, hsl(${h + 20} 90% 78%), transparent 65%),
          linear-gradient(140deg, hsl(${h} 70% 95%), hsl(${h} 60% 84%))`,
      }}
    >
      <div className="absolute inset-x-12 bottom-0 top-12 overflow-hidden rounded-t-[22px] border border-white/70 bg-white text-ink shadow-[0_30px_60px_-20px_rgb(15_26_51/0.35)]">
        <div className="flex h-12 items-center gap-2.5 border-b border-line px-5">
          <span className="grid size-7 place-items-center rounded-lg bg-accent-soft text-accent">{icon}</span>
          <span className="text-[14px] font-semibold">{title}</span>
          <span className="ml-auto flex gap-1.5">
            <span className="size-2 rounded-full bg-line-strong" />
            <span className="size-2 rounded-full bg-line-strong" />
            <span className="size-2 rounded-full bg-line-strong" />
          </span>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const rise = (active: boolean, delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: active ? { opacity: 1, y: 0 } : {},
  transition: { duration: 0.6, delay, ease: EASE_OUT_EXPO },
});

/** Mesmo checklist de captação do painel. */
function CaptacaoMock({ active }: { active: boolean }) {
  const items = ["Documentos do proprietário", "Matrícula atualizada", "IPTU e condomínio sem débitos", "Avaliação de preço", "Autorização assinada"];
  const done = 3;
  return (
    <Stage k="captacao" icon={<ClipboardList className="size-4" />} title="Checklist de captação">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[12px] text-muted">Captação</p>
          <p className="font-display text-[18px] font-semibold">Apto 302 · Edifício Aurora</p>
        </div>
        <p className="text-[13px] font-semibold text-accent">{done}/7 concluídos</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={active ? { width: `${(done / 7) * 100}%` } : {}}
          transition={{ duration: 1.4, delay: 0.3, ease: EASE_OUT_EXPO }}
        />
      </div>
      <ul className="mt-5 space-y-2.5">
        {items.map((it, i) => (
          <motion.li key={it} {...rise(active, 0.15 + i * 0.08)} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-[14px]">
            <motion.span
              className="grid size-5 place-items-center rounded-md border-2"
              initial={{ backgroundColor: "#ffffff", borderColor: "#d5dae3" }}
              animate={active && i < done ? { backgroundColor: "#2f5bea", borderColor: "#2f5bea" } : {}}
              transition={{ delay: 0.6 + i * 0.35 }}
            >
              {i < done && <Check className="size-3 text-white" strokeWidth={3} />}
            </motion.span>
            <span className={i < done ? "font-medium" : "text-muted"}>{it}</span>
          </motion.li>
        ))}
      </ul>
    </Stage>
  );
}

/** Quadro de leads por etapa, como na aba Negócios › Leads. */
function LeadsMock({ active }: { active: boolean }) {
  const colunas = [
    { t: "Novo", dot: "bg-amber-400", cards: [["Juliana Prado", "0/6", "hoje"], ["Pedro Melo", "0/6", "2 dias"]] },
    { t: "Em contato", dot: "bg-sky-400", cards: [["Carla Nunes", "2/6", "1 dia"], ["Thiago Gomes", "1/6", "7 dias"]] },
    { t: "Visita", dot: "bg-violet-400", cards: [["Renata Castro", "4/6", "hoje"]] },
    { t: "Proposta", dot: "bg-accent", cards: [["André Freitas", "5/6", "3 dias"]] },
  ];
  return (
    <Stage k="leads" icon={<Users className="size-4" />} title="Funil de leads">
      <div className="grid grid-cols-4 gap-2.5">
        {colunas.map((c, ci) => (
          <motion.div key={c.t} {...rise(active, 0.1 + ci * 0.08)} className="rounded-2xl bg-canvas p-2">
            <p className="flex items-center gap-1.5 px-1.5 py-1 text-[11px] font-semibold">
              <span className={`size-1.5 rounded-full ${c.dot}`} />
              {c.t}
              <span className="ml-auto text-muted">{c.cards.length}</span>
            </p>
            <div className="mt-1 space-y-1.5">
              {c.cards.map(([nome, passos, contato], i) => (
                <motion.div
                  key={nome}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={active ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.4 + ci * 0.1 + i * 0.1 }}
                  className={`rounded-xl border bg-white p-2 ${contato === "7 dias" ? "border-rose-200" : "border-line"}`}
                >
                  <p className="truncate text-[11px] font-semibold">{nome}</p>
                  <p className={`mt-0.5 text-[9px] ${contato === "7 dias" ? "font-semibold text-rose-600" : "text-muted"}`}>
                    {contato === "hoje" ? "contato hoje" : contato === "7 dias" ? "Atrasado · 7 dias" : `${contato} sem contato`}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-canvas-deep">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(Number(passos[0]) / 6) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-muted">{passos}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div {...rise(active, 0.8)} className="mt-4 flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white">
        <span className="text-[12px] text-white/70">Leads atendidos no mês</span>
        <span className="font-display text-[20px] font-semibold">86%</span>
      </motion.div>
    </Stage>
  );
}

/** Semana da agenda, como na aba Agenda. */
function AgendaMock({ active }: { active: boolean }) {
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  const evs = [
    { d: 0, top: 4, h: 44, t: "Reunião semanal", c: "bg-amber-100 border-amber-500 text-amber-950" },
    { d: 1, top: 70, h: 52, t: "Visita com Juliana", c: "bg-violet-100 border-violet-500 text-violet-950" },
    { d: 2, top: 30, h: 66, t: "Vistoria da captação", c: "bg-accent-soft border-accent text-accent-deep" },
    { d: 3, top: 120, h: 30, t: "Ligar para Pedro", c: "bg-emerald-100 border-emerald-500 text-emerald-950" },
    { d: 3, top: 12, h: 52, t: "Visita com Renata", c: "bg-violet-100 border-violet-500 text-violet-950" },
    { d: 4, top: 90, h: 52, t: "Visita com André", c: "bg-violet-100 border-violet-500 text-violet-950" },
  ];
  return (
    <Stage k="agenda" icon={<CalendarDays className="size-4" />} title="Agenda">
      <div className="grid grid-cols-[2.5rem_repeat(5,minmax(0,1fr))] text-center text-[10px] font-semibold uppercase text-muted">
        <span />
        {dias.map((d, i) => (
          <span key={d} className={`py-1 ${i === 3 ? "text-accent" : ""}`}>
            {d}
          </span>
        ))}
      </div>
      <div className="relative mt-1 grid h-[220px] grid-cols-[2.5rem_repeat(5,minmax(0,1fr))] rounded-xl border border-line">
        <div className="relative text-[9px] text-subtle">
          {["9h", "10h", "11h", "12h"].map((h, i) => (
            <span key={h} className="absolute right-1" style={{ top: i * 55 + 2 }}>
              {h}
            </span>
          ))}
        </div>
        {dias.map((d, di) => (
          <div key={d} className={`relative border-l border-line ${di === 3 ? "bg-accent-soft/30" : ""}`}>
            {[1, 2, 3].map((l) => (
              <div key={l} className="absolute inset-x-0 border-t border-line" style={{ top: l * 55 }} />
            ))}
            {evs
              .filter((e) => e.d === di)
              .map((e, i) => (
                <motion.div
                  key={e.t}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={active ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.3 + di * 0.1 + i * 0.1, type: "spring", stiffness: 300, damping: 22 }}
                  className={`absolute inset-x-1 rounded-md border-l-[3px] px-1.5 py-1 text-left text-[9.5px] font-semibold leading-tight ${e.c}`}
                  style={{ top: e.top, height: e.h }}
                >
                  {e.t}
                </motion.div>
              ))}
          </div>
        ))}
      </div>
      <motion.div {...rise(active, 0.9)} className="mt-4 flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-[12px]">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8Z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4Z" />
        </svg>
        <span className="font-medium">Adicionar ao Google Agenda</span>
      </motion.div>
    </Stage>
  );
}

/** Relatório enviado ao proprietário pelo WhatsApp, a partir do checklist de marketing. */
function RelatorioMock({ active }: { active: boolean }) {
  const linhas = [
    ["✅", "Fotos profissionais"],
    ["✅", "Anúncio nos portais"],
    ["✅", "Publicação nas redes sociais"],
    ["✅", "Placa no imóvel"],
    ["⏳", "Vídeo ou tour virtual"],
  ];
  return (
    <Stage k="relatorio" icon={<MessageCircle className="size-4" />} title="Relatório ao proprietário">
      <div className="rounded-2xl bg-[#e7f8ec] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={active ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="ml-auto max-w-[88%] rounded-2xl rounded-tr-xs bg-white p-4 text-[13px] leading-relaxed shadow-xs"
        >
          <p>Olá, Helena! Tudo bem?</p>
          <p className="mt-2">Segue o relatório de divulgação do seu imóvel (Apto 302 · Edifício Aurora):</p>
          <ul className="mt-2 space-y-0.5">
            {linhas.map(([e, t], i) => (
              <motion.li key={t} initial={{ opacity: 0, x: -8 }} animate={active ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.6 + i * 0.12 }}>
                {e} {t}
              </motion.li>
            ))}
          </ul>
          <p className="mt-2 font-semibold">4 de 5 ações concluídas.</p>
        </motion.div>
      </div>
      <motion.div {...rise(active, 1.2)} className="mt-4 flex justify-end">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2 text-[13px] font-semibold text-white">
          <WhatsAppIcon className="size-4" /> Enviar pelo WhatsApp
        </span>
      </motion.div>
    </Stage>
  );
}

/** Estudo de mercado: amostras de portais, os três valores e a apresentação para o proprietário. */
function MercadoMock({ active }: { active: boolean }) {
  const amostras = [
    ["VivaReal", "R$ 920.000", "98 m²", "R$ 9.388/m²"],
    ["Zap", "R$ 885.000", "92 m²", "R$ 9.620/m²"],
    ["Vendido", "R$ 860.000", "95 m²", "R$ 9.053/m²"],
  ];
  const valores = [
    ["Pouco provável", "R$ 965 mil", "bg-rose-50 text-rose-700"],
    ["Valor de mercado", "R$ 893 mil", "bg-accent text-white"],
    ["Urgência", "R$ 804 mil", "bg-verified-soft text-verified"],
  ];
  return (
    <Stage k="mercado" icon={<LineChart className="size-4" />} title="Estudo de mercado">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[12px] text-muted">Imóvel avaliado</p>
          <p className="font-display text-[17px] font-semibold">Apto 3 quartos · 95 m²</p>
        </div>
        <p className="text-[12px] font-semibold text-accent">3 amostras</p>
      </div>
      <ul className="mt-3 space-y-1.5">
        {amostras.map(([portal, valor, area, m2], i) => (
          <motion.li key={portal} {...rise(active, 0.1 + i * 0.08)} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 text-[12px]">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${portal === "Vendido" ? "bg-verified-soft text-verified" : "bg-accent-soft text-accent"}`}>{portal}</span>
            <span className="font-semibold">{valor}</span>
            <span className="text-muted">{area}</span>
            <span className="ml-auto text-muted">{m2}</span>
          </motion.li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {valores.map(([rotulo, valor, cls], i) => (
          <motion.div
            key={rotulo}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={active ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 260, damping: 22 }}
            className={`rounded-xl p-2.5 ${cls}`}
          >
            <p className="text-[10px] font-semibold opacity-80">{rotulo}</p>
            <p className="mt-0.5 font-display text-[15px] font-semibold">{valor}</p>
          </motion.div>
        ))}
      </div>
      <motion.div {...rise(active, 1)} className="mt-4 flex gap-2">
        <span className="inline-flex flex-1 items-center justify-center rounded-full border border-line-strong py-2 text-[12px] font-semibold">Apresentação</span>
        <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25d366] py-2 text-[12px] font-semibold text-white">
          <WhatsAppIcon className="size-3.5" /> Enviar ao proprietário
        </span>
      </motion.div>
    </Stage>
  );
}

export function FeatureMock({ k, active }: { k: FeatureKey; active: boolean }) {
  const map = { captacao: CaptacaoMock, leads: LeadsMock, agenda: AgendaMock, relatorio: RelatorioMock, mercado: MercadoMock };
  const C = map[k];
  return <C active={active} />;
}
