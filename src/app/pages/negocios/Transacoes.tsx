import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeDollarSign, Building, Calendar, Coins, Handshake, Home, KeyRound, Lock, Plus, Users, X } from "lucide-react";
import {
  captacaoById,
  captacaoTitulo,
  corretoresAtivos,
  creditoDe,
  fechamentosPendentes,
  honorarios,
  lastMonths,
  parteDe,
  parteImobiliaria,
  participanteNome,
  participanteAvatar,
  transacoesOf,
  pessoa,
} from "@/data/queries";
import { useStore } from "@/data/store";
import type { FechamentoInformado, Finalidade } from "@/data/types";
import { brl, brlCompact, relTime } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useScope } from "../../session";
import { AnimatedNumber, Avatar, Badge, Card, CardHeader, Select } from "../../kit";
import { btn, EmptyState } from "../../forms";
import { InformarFechamentoModal, TransacaoFormModal, valorLabel } from "./shared";
import { CaptacaoDrawer } from "./Captacoes";

function Stat({ label, icon: Icon, value, format, lock }: { label: string; icon: typeof Coins; value: number; format: (n: number) => string; lock?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="flex items-center gap-1.5">
          {label}
          {lock && (
            <span title="Visível só para o próprio corretor e o administrador">
              <Lock className="size-3.5 text-subtle" />
            </span>
          )}
        </span>
        <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-[1.75rem] font-semibold leading-none tracking-tight">
        <AnimatedNumber value={value} format={format} />
      </p>
    </Card>
  );
}

export default function Transacoes() {
  const store = useStore();
  const { scope, isAdmin, solo } = useScope();
  const [params, setParams] = useSearchParams();
  const months = lastMonths(6);
  const [month, setMonth] = useState("");
  const [corretor, setCorretor] = useState("");
  const [tipo, setTipo] = useState<"" | Finalidade>("");
  const [registrar, setRegistrar] = useState<FechamentoInformado | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const sc = isAdmin && corretor ? { corretorId: corretor } : scope;
  const list = transacoesOf(sc, month || undefined).filter((t) => !tipo || t.tipo === tipo);
  const credito = (t: (typeof list)[number]) => (sc.corretorId ? creditoDe(t, sc.corretorId) : null);
  const vgv = list.filter((t) => t.tipo === "venda").reduce((s, t) => s + (credito(t)?.valor ?? t.valor), 0);
  const loc = list.filter((t) => t.tipo === "locacao").reduce((s, t) => s + (credito(t)?.valor ?? t.valor), 0);
  const vgc = list.reduce(
    (s, t) => s + (credito(t)?.comissao ?? t.participantes.filter((p) => p.tipo === "corretor").reduce((a, p) => a + parteDe(t, p), 0)),
    0,
  );
  const receitaImob = list.reduce((s, t) => s + parteImobiliaria(t), 0);
  // Solo: os honorários são todos do dono da conta, menos o que foi para parceiros externos
  const suaReceita = (t: (typeof list)[number]) =>
    honorarios(t) - t.participantes.filter((p) => p.tipo === "parceiro").reduce((a, p) => a + parteDe(t, p), 0);
  const pendentes = fechamentosPendentes(isAdmin ? {} : scope);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            label="Mês"
            icon={<Calendar className="size-4" />}
            value={month}
            onChange={setMonth}
            options={[{ value: "", label: "Todo o período" }, ...[...months].reverse().map((m) => ({ value: m.key, label: m.long }))]}
          />
          <Select
            label="Tipo"
            value={tipo}
            onChange={(v) => setTipo(v as "" | Finalidade)}
            options={[
              { value: "", label: "Vendas e locações" },
              { value: "venda", label: "Só vendas" },
              { value: "locacao", label: "Só locações" },
            ]}
          />
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
        {isAdmin ? (
          <button onClick={() => setParam("nova", "1")} className={btn.accent}>
            <Plus className="size-4" /> Registrar venda ou locação
          </button>
        ) : (
          <button onClick={() => setParam("informar", "1")} className={btn.accent}>
            <Handshake className="size-4" /> Informar fechamento
          </button>
        )}
      </div>

      {/* Fechamentos informados pelos corretores */}
      {pendentes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Handshake className="size-4 text-amber-700" />
                {isAdmin ? "Fechamentos informados pelos corretores" : "Seus fechamentos aguardando registro"}
                <Badge tone="warn">{pendentes.length}</Badge>
              </span>
            }
            subtitle={isAdmin ? "Confira, defina a divisão dos honorários e registre." : "O administrador vai conferir e registrar."}
          />
          <ul className="mt-3 space-y-2 px-4 pb-4">
            {pendentes.map((f) => {
              const c = captacaoById(f.captacaoId);
              const u = pessoa(f.corretorId);
              return (
                <li key={f.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-bg p-3 sm:flex-nowrap">
                  <Avatar user={u} className="size-9 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {c ? captacaoTitulo(c) : "—"} · {f.tipo === "venda" ? "Venda" : "Locação"} por {valorLabel(f.tipo, f.valor)}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {u.nome} · informado {relTime(f.criadoEm)}
                      {f.observacao && ` · “${f.observacao}”`}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => store.descartarFechamento(f.id)} title="Descartar" className="grid size-9 place-items-center rounded-full text-muted hover:bg-rose-50 hover:text-rose-600">
                        <X className="size-4" />
                      </button>
                      <button onClick={() => setRegistrar(f)} className={`${btn.primary} h-9`}>
                        Registrar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <div className={`grid grid-cols-2 gap-4 ${isAdmin && !corretor && !solo ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        <Stat label="VGV (vendas)" icon={BadgeDollarSign} value={vgv} format={brlCompact} />
        <Stat label="Volume de locação" icon={KeyRound} value={loc} format={(n) => `${brlCompact(n)}/mês`} />
        {solo ? (
          <Stat label="Sua receita (honorários)" icon={Coins} value={list.reduce((s, t) => s + suaReceita(t), 0)} format={brlCompact} lock />
        ) : (
          <Stat label={isAdmin && !corretor ? "VGC (comissões da equipe)" : "VGC (comissão)"} icon={Coins} value={vgc} format={brlCompact} lock />
        )}
        {isAdmin && !corretor && !solo && <Stat label="Receita da imobiliária" icon={Building} value={receitaImob} format={brlCompact} lock />}
      </div>

      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={<BadgeDollarSign className="size-6" />} title="Nenhuma transação no período" text={solo ? "As vendas e locações que você registrar aparecem aqui." : "Vendas e locações registradas pelo administrador aparecem aqui."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-3 py-3 font-semibold">Captação</th>
                  <th className="px-3 py-3 font-semibold">Participantes</th>
                  <th className="px-3 py-3 text-right font-semibold">Valor</th>
                  {isAdmin && !corretor && <th className="px-3 py-3 text-right font-semibold">Honorários</th>}
                  <th className="px-5 py-3 text-right font-semibold">{solo ? "Sua receita" : sc.corretorId ? (isAdmin ? "Comissão do corretor" : "Sua comissão") : "Imobiliária"}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t, i) => {
                  const c = captacaoById(t.captacaoId);
                  const cred = credito(t);
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(i, 15) * 0.025, ease: EASE_OUT_EXPO }}
                      onClick={() => c && setAberta(c.id)}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas/70"
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-muted">{new Date(t.data).toLocaleDateString("pt-BR")}</td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2">
                          <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${t.tipo === "venda" ? "bg-accent-soft text-accent" : "bg-violet-100 text-violet-700"}`}>
                            {t.tipo === "venda" ? <Home className="size-3.5" /> : <KeyRound className="size-3.5" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{c ? captacaoTitulo(c) : "—"}</span>
                            <span className="block text-xs text-muted">
                              {t.tipo === "venda" ? "Venda" : "Locação"}
                              {t.cliente && ` · ${t.cliente}`}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-0.5 text-xs">
                          {t.participantes.map((p, k) => (
                            <span key={k} className={`flex items-center gap-1.5 ${p.tipo === "parceiro" ? "text-violet-700" : ""}`}>
                              <Avatar user={participanteAvatar(p)} className="size-5 text-[0.5rem]" />
                              <span className="min-w-0">
                                {participanteNome(p)} <span className="text-muted">({p.pct}%{p.tipo === "parceiro" ? ", externo" : ""})</span>
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{valorLabel(t.tipo, t.valor)}</td>
                      {isAdmin && !corretor && <td className="px-3 py-3 text-right tabular-nums text-muted">{brl(honorarios(t))}</td>}
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-verified">{brl(solo ? suaReceita(t) : cred ? cred.comissao : parteImobiliaria(t))}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CaptacaoDrawer id={aberta} onClose={() => setAberta(null)} />
      <TransacaoFormModal open={params.get("nova") === "1" && isAdmin} onClose={() => setParam("nova", null)} />
      <TransacaoFormModal open={!!registrar} onClose={() => setRegistrar(null)} fechamento={registrar ?? undefined} />
      <InformarFechamentoModal open={params.get("informar") === "1" && !isAdmin} onClose={() => setParam("informar", null)} />
    </div>
  );
}
