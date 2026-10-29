import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlarmClock, BadgeDollarSign, CalendarClock, Columns3, FileSpreadsheet, List, MessageCircleMore, Phone, Plus, Users } from "lucide-react";
import { CHECKLIST_LEAD, ETAPAS } from "@/data/demo";
import { atendido, atrasado, corretoresAtivos, DIAS_ATRASO, diasSemContato, emAberto, leadById, leadsOf, pessoa, userById } from "@/data/queries";
import { useStore } from "@/data/store";
import type { EtapaLead, Lead } from "@/data/types";
import { dateTime, relTime } from "@/lib/format";
import { useScope } from "../../session";
import { Avatar, Badge, Card, ProgressBar, Segmented, Select } from "../../kit";
import { BotaoSalvar, btn, CheckItem, DateInput, Drawer, EmptyState, Field, formatPhone, inputCls, SearchInput, TimeInput, toLocalInput, waLink } from "../../forms";
import { ETAPA_DOT, ETAPA_STYLE, LeadFormModal } from "./shared";
import { ImportarLeadsModal } from "./ImportarLeads";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

const PERIODOS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "all", label: "Todo o período" },
];

/** Há quantos dias o lead está sem contato: cinza até 2 dias, âmbar de 3 a 5, vermelho depois ("Atrasado"). */
function SemContato({ lead, longo }: { lead: Lead; longo?: boolean }) {
  if (!emAberto(lead)) return <span className="text-muted">{relTime(lead.ultimoContato ?? lead.criadoEm)}</span>;
  const d = diasSemContato(lead);
  const texto = d === 0 ? "contato hoje" : `${d} ${d === 1 ? "dia" : "dias"} sem contato`;
  if (atrasado(lead))
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">
        <AlarmClock className="size-3" /> {longo ? `Atrasado · ${texto}` : `${d} dias`}
      </span>
    );
  return <span className={d >= 3 ? "font-semibold text-amber-700" : "text-muted"}>{texto}</span>;
}

function LeadCard({ lead, showCorretor, onOpen }: { lead: Lead; showCorretor: boolean; onOpen: () => void }) {
  const passos = lead.checklist.filter(Boolean).length;
  const c = pessoa(lead.corretorId);
  return (
    <motion.div layout="position" layoutId={`lead-${lead.id}`} transition={{ duration: 0.35 }}>
    <button
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", lead.id)}
      onClick={onOpen}
      className={`w-full cursor-grab rounded-2xl border ${atrasado(lead) ? "border-rose-200" : "border-line"} bg-bg p-3.5 text-left shadow-[0_1px_2px_rgb(15_26_51/0.04)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-soft active:cursor-grabbing`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{lead.nome}</p>
        {showCorretor && <Avatar user={c} className="size-6 text-[0.5625rem]" />}
      </div>
      <p className="mt-1 line-clamp-1 text-xs text-muted">{lead.interesse}</p>
      <div className="mt-3 flex items-center gap-2">
        <ProgressBar value={passos / CHECKLIST_LEAD.length} className="h-1 flex-1" />
        <span className="text-[0.6875rem] font-semibold text-muted">
          {passos}/{CHECKLIST_LEAD.length}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[0.6875rem] text-muted">
        <span className="rounded-full bg-canvas px-2 py-0.5">{lead.origem}</span>
        {lead.etapa === "visita" && lead.visitaEm ? (
          <span className="flex items-center gap-1 font-semibold text-violet-700">
            <CalendarClock className="size-3" /> {relTime(lead.visitaEm)}
          </span>
        ) : (
          <SemContato lead={lead} />
        )}
      </div>
    </button>
    </motion.div>
  );
}

function Board({ leads, showCorretor, onOpen }: { leads: Lead[]; showCorretor: boolean; onOpen: (id: string) => void }) {
  const { updateLead, toast } = useStore();
  const [over, setOver] = useState<EtapaLead | null>(null);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      <div className="flex gap-4">
        {ETAPAS.map((etapa) => {
          const items = leads.filter((l) => l.etapa === etapa.id);
          return (
            <div
              key={etapa.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(etapa.id);
              }}
              onDragLeave={() => setOver((o) => (o === etapa.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/plain");
                const l = leadById(id);
                if (l && l.etapa !== etapa.id) {
                  updateLead(id, { etapa: etapa.id });
                  toast(`${l.nome.split(" ")[0]} movido para “${etapa.label}”.`);
                }
              }}
              className={`flex w-[17rem] shrink-0 flex-col rounded-3xl p-2 transition-colors ${over === etapa.id ? "bg-accent-soft ring-2 ring-accent/40" : "bg-canvas"}`}
            >
              <div className="flex items-center gap-2 px-2.5 py-2">
                <span className={`size-2 rounded-full ${ETAPA_DOT[etapa.id]}`} />
                <span className="text-sm font-semibold">{etapa.label}</span>
                <span className="ml-auto rounded-full bg-bg px-2 py-0.5 text-xs font-semibold text-muted">{items.length}</span>
              </div>
              <div className="flex max-h-[calc(100vh-22rem)] min-h-[8rem] flex-col gap-2 overflow-y-auto p-0.5">
                {items.map((l) => (
                  <LeadCard key={l.id} lead={l} showCorretor={showCorretor} onOpen={() => onOpen(l.id)} />
                ))}
                {!items.length && <p className="px-3 py-6 text-center text-xs text-subtle">Arraste um lead para cá</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ leads, showCorretor, onOpen }: { leads: Lead[]; showCorretor: boolean; onOpen: (id: string) => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-5 py-3 font-semibold">Lead</th>
              <th className="px-3 py-3 font-semibold">Etapa</th>
              <th className="px-3 py-3 font-semibold">Atendimento</th>
              <th className="px-3 py-3 font-semibold">Origem</th>
              {showCorretor && <th className="px-3 py-3 font-semibold">Corretor</th>}
              <th className="px-3 py-3 font-semibold">Último contato</th>
              <th className="px-5 py-3 text-right font-semibold">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 120).map((l) => {
              const passos = l.checklist.filter(Boolean).length;
              const c = pessoa(l.corretorId);
              return (
                <tr key={l.id} onClick={() => onOpen(l.id)} className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas/70">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{l.nome}</p>
                    <p className="text-xs text-muted">{l.interesse}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ETAPA_STYLE[l.etapa]}`}>{ETAPAS.find((e) => e.id === l.etapa)!.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex w-32 items-center gap-2">
                      <ProgressBar value={passos / CHECKLIST_LEAD.length} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted">{passos}/6</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted">{l.origem}</td>
                  {showCorretor && (
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2">
                        <Avatar user={c} className="size-6 text-[0.5625rem]" />
                        {c.nome.split(" ")[0]}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-3 text-xs">
                    <SemContato lead={l} longo />
                  </td>
                  <td className="px-5 py-3 text-right text-muted">{relTime(l.criadoEm)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {leads.length > 120 && <p className="border-t border-line px-5 py-3 text-xs text-muted">Mostrando 120 de {leads.length}. Use a busca ou os filtros para refinar.</p>}
    </Card>
  );
}

function LeadDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { updateLead, toggleLeadStep, registrarContato } = useStore();
  const { isAdmin, solo } = useScope();
  const navigate = useNavigate();
  const lead = id ? leadById(id) : undefined;
  const passos = lead ? lead.checklist.filter(Boolean).length : 0;
  // Etapa, visita e checklist já gravam no clique; o botão Salvar confirma e grava as observações
  const obs = useRef<HTMLTextAreaElement>(null);
  const salvar = () => {
    if (lead && obs.current && obs.current.value !== (lead.observacoes ?? "")) updateLead(lead.id, { observacoes: obs.current.value });
  };

  return (
    <Drawer
      open={!!lead}
      onClose={onClose}
      title={lead?.nome}
      subtitle={
        lead && (
          <span className="flex items-center gap-2">
            {lead.interesse}
            {atendido(lead) ? <Badge tone="verified">Atendido</Badge> : <Badge tone="warn">Aguardando atendimento</Badge>}
          </span>
        )
      }
      footer={
        <>
          {lead?.etapa === "fechado" && (
            <button onClick={() => navigate(isAdmin ? "/app/negocios/transacoes?nova=1" : "/app/negocios/transacoes?informar=1")} className={btn.accent}>
              <BadgeDollarSign className="size-4" /> {isAdmin ? "Registrar venda ou locação" : "Informar fechamento"}
            </button>
          )}
          <BotaoSalvar onSalvar={salvar}>Salvar</BotaoSalvar>
        </>
      }
    >
      {lead && (
        <div className="space-y-7">
          {/* Contato */}
          <div className="flex flex-wrap items-center gap-2">
            <a href={waLink(lead.telefone)} target="_blank" rel="noreferrer" onClick={() => registrarContato(lead.id, false)} className={btn.whatsapp}>
              <WhatsAppIcon className="size-4" /> WhatsApp
            </a>
            <a href={`tel:+${lead.telefone}`} onClick={() => registrarContato(lead.id, false)} className={btn.outline}>
              <Phone className="size-4" /> {formatPhone(lead.telefone)}
            </a>
          </div>

          {/* Etapa */}
          <div>
            <p className="mb-2.5 text-xs font-semibold text-muted">Etapa</p>
            <div className="flex flex-wrap gap-2">
              {ETAPAS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => updateLead(lead.id, { etapa: e.id })}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    lead.etapa === e.id ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink/40"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${ETAPA_DOT[e.id]}`} />
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dados */}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-canvas p-3.5">
              <dt className="text-xs text-muted">Origem</dt>
              <dd className="mt-0.5 font-semibold">{lead.origem}</dd>
            </div>
            <div className="rounded-2xl bg-canvas p-3.5">
              <dt className="text-xs text-muted">Cadastrado</dt>
              <dd className="mt-0.5 font-semibold">{relTime(lead.criadoEm)}</dd>
            </div>
            <div className={`col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3.5 ${atrasado(lead) ? "bg-rose-50" : "bg-canvas"}`}>
              <div>
                <dt className="text-xs text-muted">Último contato</dt>
                <dd className="mt-0.5 text-xs">
                  <SemContato lead={lead} longo />
                </dd>
              </div>
              {emAberto(lead) && (
                <button onClick={() => registrarContato(lead.id)} className={`${btn.outline} h-9 px-3 text-xs`}>
                  <MessageCircleMore className="size-3.5" /> Registrei um contato
                </button>
              )}
            </div>
            {isAdmin && !solo && (
              <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-canvas p-3.5">
                <Avatar user={pessoa(lead.corretorId)} className="size-8 text-[0.625rem]" />
                <div>
                  <dt className="text-xs text-muted">Corretor responsável</dt>
                  <dd className="font-semibold">{userById(lead.corretorId)?.nome}</dd>
                </div>
              </div>
            )}
          </dl>

          {lead.etapa === "visita" && (
            <Field label="Data da visita" hint={lead.visitaEm ? dateTime(lead.visitaEm) : "Defina quando será a visita."}>
              <div className="grid grid-cols-[1fr_7rem] gap-2">
                <DateInput
                  value={toLocalInput(lead.visitaEm).slice(0, 10)}
                  onChange={(d) => {
                    const hora = toLocalInput(lead.visitaEm).slice(11, 16) || "10:00";
                    updateLead(lead.id, { visitaEm: d ? new Date(`${d}T${hora}`).toISOString() : undefined });
                  }}
                />
                <TimeInput
                  value={toLocalInput(lead.visitaEm).slice(11, 16)}
                  onChange={(h) => {
                    const dia = toLocalInput(lead.visitaEm).slice(0, 10);
                    if (dia) updateLead(lead.id, { visitaEm: new Date(`${dia}T${h}`).toISOString() });
                  }}
                />
              </div>
            </Field>
          )}

          {/* Checklist */}
          <div>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="font-display text-lg font-semibold">Checklist de atendimento</p>
                <p className="text-xs text-muted">O lead conta como atendido a partir do primeiro passo marcado.</p>
              </div>
              <span className="text-sm font-semibold text-accent">
                {passos}/{CHECKLIST_LEAD.length}
              </span>
            </div>
            <ProgressBar value={passos / CHECKLIST_LEAD.length} className="mb-3" />
            <div className="space-y-2">
              {CHECKLIST_LEAD.map((label, i) => (
                <CheckItem key={label} index={i} label={label} checked={lead.checklist[i]} onToggle={() => toggleLeadStep(lead.id, i)} />
              ))}
            </div>
          </div>

          <Field label="Observações">
            <textarea
              key={lead.id}
              ref={obs}
              defaultValue={lead.observacoes}
              onBlur={(e) => updateLead(lead.id, { observacoes: e.target.value })}
              rows={4}
              placeholder="Anotações sobre o cliente, preferências, próximos passos..."
              className={`${inputCls} h-auto resize-none py-3`}
            />
          </Field>
        </div>
      )}
    </Drawer>
  );
}

export default function Leads() {
  useStore();
  const { scope, isAdmin, solo } = useScope();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<"quadro" | "lista">("quadro");
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState("90");
  const [corretor, setCorretor] = useState("");
  const soAtrasados = params.get("atrasados") === "1";

  const openId = params.get("lead");
  const novo = params.get("novo") === "1";
  const importar = params.get("importar") === "1";
  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const all = leadsOf(isAdmin && corretor ? { corretorId: corretor } : scope);
  const qtdAtrasados = all.filter(atrasado).length;
  const list = useMemo(() => {
    // "Atrasados" vale para qualquer período: um lead antigo esquecido é justamente o que precisa aparecer
    const limite = periodo === "all" || soAtrasados ? 0 : Date.now() - Number(periodo) * 864e5;
    const q = busca.trim().toLowerCase();
    return all.filter(
      (l) =>
        new Date(l.criadoEm).getTime() >= limite &&
        (!soAtrasados || atrasado(l)) &&
        (!q || `${l.nome} ${l.interesse} ${l.origem}`.toLowerCase().includes(q)),
    );
  }, [all, periodo, busca, soAtrasados]);

  const atendidos = list.filter(atendido).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar lead..." />
          <Select label="Período" value={periodo} onChange={setPeriodo} options={PERIODOS} />
          {(qtdAtrasados > 0 || soAtrasados) && (
            <button
              onClick={() => setParam("atrasados", soAtrasados ? null : "1")}
              title={`Leads em aberto há mais de ${DIAS_ATRASO} dias sem contato`}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                soAtrasados ? "bg-rose-600 text-white" : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <AlarmClock className="size-4" /> Atrasados · {qtdAtrasados}
            </button>
          )}
          {isAdmin && corretoresAtivos().length > 0 && (
            <Select
              label="Corretor"
              icon={<Users className="size-4" />}
              value={corretor}
              onChange={setCorretor}
              options={[{ value: "", label: "Toda a equipe" }, ...corretoresAtivos().map((c) => ({ value: c.id, label: c.nome }))]}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            id="leads-view"
            value={view}
            onChange={setView}
            options={[
              { value: "quadro", label: "Quadro" },
              { value: "lista", label: "Lista" },
            ]}
          />
          <button onClick={() => setParam("importar", "1")} className={btn.outline} title="Importar leads de uma planilha">
            <FileSpreadsheet className="size-4" /> <span className="hidden sm:inline">Importar</span>
          </button>
          <button onClick={() => setParam("novo", "1")} className={btn.accent}>
            <Plus className="size-4" /> Novo lead
          </button>
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm text-muted">
        {view === "quadro" ? <Columns3 className="size-4" /> : <List className="size-4" />}
        <span>
          <span className="font-semibold text-ink">{list.length}</span> leads ·{" "}
          <span className="font-semibold text-ink">{atendidos}</span> atendidos
          {soAtrasados && <> · só os atrasados (mais de {DIAS_ATRASO} dias sem contato)</>}
          {view === "quadro" && <span className="hidden sm:inline"> · arraste os cartões para mudar a etapa</span>}
        </span>
      </p>

      <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {list.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Users className="size-6" />}
                title="Nenhum lead encontrado"
                text="Ajuste a busca ou os filtros, ou cadastre um novo lead."
                action={
                  <button onClick={() => setParam("novo", "1")} className={btn.accent}>
                    <Plus className="size-4" /> Novo lead
                  </button>
                }
              />
            </Card>
          ) : view === "quadro" ? (
            <Board leads={list} showCorretor={isAdmin && !solo} onOpen={(id) => setParam("lead", id)} />
          ) : (
            <ListView leads={list} showCorretor={isAdmin && !solo} onOpen={(id) => setParam("lead", id)} />
          )}
        </motion.div>

      <LeadDrawer id={openId} onClose={() => setParam("lead", null)} />
      <LeadFormModal open={novo} onClose={() => setParam("novo", null)} />
      <ImportarLeadsModal open={importar} onClose={() => setParam("importar", null)} />
    </div>
  );
}
