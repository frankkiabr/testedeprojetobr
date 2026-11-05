import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, ChevronRight, HandCoins, KeyRound, Sparkles, Trash2 } from "lucide-react";
import { imoveis } from "@/data/demo";
import { captacaoById, captacaoBairro, captacaoCategoria, captacaoTitulo, captacoesOf, leadsOf } from "@/data/queries";
import { useStore } from "@/data/store";
import type { Captacao, Lead } from "@/data/types";
import {
  devolverChave,
  excluirProposta,
  historicoPreco,
  listarChaves,
  listarPropostas,
  registrarProposta,
  retirarChave,
  ROTULO_PROPOSTA,
  type Chave,
  type MudancaPreco,
  type Proposta,
  type TipoProposta,
} from "@/data/negociacao";
import { brl, dataHora } from "@/lib/format";
import { useScope } from "../../session";
import { AvatarNome } from "../../kit";
import { BotaoSalvar, btn, DateInput, Field, inputCls, mascaraMoeda, SelectField } from "../../forms";
import { valorLabel } from "./shared";

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;
const COR: Record<TipoProposta, string> = {
  proposta: "bg-accent-soft text-accent-deep",
  contraproposta: "bg-amber-50 text-amber-800",
  aceita: "bg-verified-soft text-verified",
  recusada: "bg-rose-50 text-rose-700",
};

// ---------- Propostas e contrapropostas (janela do lead) ----------

export function PropostasLead({ lead }: { lead: Lead }) {
  const { scope } = useScope();
  const { toast } = useStore();
  const [lista, setLista] = useState<Proposta[]>([]);
  const caps = captacoesOf(scope).filter((c) => c.status === "ativa");
  const vazio = () => ({ tipo: "proposta" as TipoProposta, valor: "", condicoes: "", captacaoId: lead.interesseCaptacaoId ?? "" });
  const [f, setF] = useState(vazio);

  const carregar = useCallback(() => {
    listarPropostas(lead.id).then(setLista).catch(() => setLista([]));
  }, [lead.id]);
  useEffect(() => {
    carregar();
    setF(vazio());
  }, [lead.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const precisaValor = f.tipo === "proposta" || f.tipo === "contraproposta";
  const ok = !!f.captacaoId && (!precisaValor || num(f.valor) > 0);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <HandCoins className="size-5 text-accent" />
        <p className="font-display text-lg font-semibold">Propostas</p>
      </div>
      {lista.length > 0 && (
        <ol className="mb-4 space-y-2">
          {lista.map((p) => {
            const c = p.captacaoId ? captacaoById(p.captacaoId) : undefined;
            return (
              <li key={p.id} className="group flex items-start gap-3 rounded-2xl border border-line p-3">
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${COR[p.tipo]}`}>{ROTULO_PROPOSTA[p.tipo]}</span>
                <div className="min-w-0 flex-1 text-sm">
                  {p.valor !== undefined && <p className="font-semibold">{brl(p.valor)}</p>}
                  {p.condicoes && <p className="whitespace-pre-line text-muted">{p.condicoes}</p>}
                  <p className="mt-0.5 text-xs text-subtle">
                    {c ? `${captacaoTitulo(c)} · ` : ""}
                    {dataHora(p.criadoEm)}
                  </p>
                </div>
                <button
                  title="Excluir"
                  onClick={async () => {
                    try {
                      await excluirProposta(p.id);
                      carregar();
                    } catch (e) {
                      toast(e instanceof Error ? e.message : "Não foi possível excluir.");
                    }
                  }}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-subtle opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <div className="space-y-3 rounded-2xl bg-canvas p-4">
        <p className="text-sm font-semibold">{lista.length ? "Registrar o próximo passo" : "Registrar uma proposta"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="O que aconteceu">
            <SelectField value={f.tipo} onChange={(v) => setF({ ...f, tipo: v as TipoProposta })} options={(Object.keys(ROTULO_PROPOSTA) as TipoProposta[]).map((k) => ({ value: k, label: ROTULO_PROPOSTA[k] }))} />
          </Field>
          <Field label="Imóvel">
            <SelectField
              value={f.captacaoId}
              onChange={(v) => setF({ ...f, captacaoId: v })}
              placeholder="Escolha o imóvel"
              options={caps.map((c) => ({ value: c.id, label: `${captacaoTitulo(c)} · ${valorLabel(c.finalidade, c.valor)}` }))}
            />
          </Field>
          {precisaValor && (
            <Field label="Valor">
              <input className={inputCls} inputMode="numeric" value={f.valor} placeholder="0,00" onChange={(e) => setF({ ...f, valor: mascaraMoeda(e.target.value) })} />
            </Field>
          )}
          <Field label="Condições (opcional)" className={precisaValor ? "" : "sm:col-span-2"}>
            <input
              className={inputCls}
              value={f.condicoes}
              maxLength={500}
              placeholder="Ex.: 30% de entrada, saldo financiado"
              onChange={(e) => setF({ ...f, condicoes: e.target.value })}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <BotaoSalvar
            disabled={!ok}
            className={btn.outline}
            onSalvar={async () => {
              try {
                await registrarProposta({
                  leadId: lead.id,
                  captacaoId: f.captacaoId || undefined,
                  tipo: f.tipo,
                  valor: precisaValor ? num(f.valor) : undefined,
                  condicoes: f.condicoes.trim() || undefined,
                });
                if (f.tipo === "aceita") toast("Proposta aceita! Mude a etapa do lead para Fechado e registre o negócio.");
                setF(vazio());
                carregar();
              } catch (e) {
                toast(e instanceof Error ? e.message : "Não foi possível registrar.");
                return false;
              }
            }}
          >
            Registrar
          </BotaoSalvar>
        </div>
      </div>
    </div>
  );
}

// ---------- Controle de chaves (janela do imóvel) ----------

export function ChavesImovel({ captacao }: { captacao: Captacao }) {
  const { toast } = useStore();
  const [lista, setLista] = useState<Chave[]>([]);
  const [f, setF] = useState({ comQuem: "", motivo: "", devolverAte: "" });
  const [abrir, setAbrir] = useState(false);
  const carregar = useCallback(() => {
    listarChaves(captacao.id).then(setLista).catch(() => setLista([]));
  }, [captacao.id]);
  useEffect(() => {
    carregar();
    setAbrir(false);
  }, [carregar]);
  const fora = lista.find((c) => !c.devolvidaEm);
  const atrasada = fora?.devolverAte && new Date(fora.devolverAte).getTime() < Date.now();

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <KeyRound className="size-5 text-accent" />
        <p className="font-display text-lg font-semibold">Chaves</p>
      </div>
      {fora ? (
        <div className={`flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm ${atrasada ? "bg-rose-50" : "bg-amber-50"}`}>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Com {fora.comQuem}</p>
            <p className="text-xs text-muted">
              Retirada em {dataHora(fora.retiradaEm)}
              {fora.motivo ? ` · ${fora.motivo}` : ""}
              {fora.devolverAte ? ` · devolver até ${new Date(fora.devolverAte).toLocaleDateString("pt-BR")}` : ""}
              {atrasada ? " · atrasada" : ""}
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                await devolverChave(fora.id);
                toast("Devolução registrada.");
                carregar();
              } catch (e) {
                toast(e instanceof Error ? e.message : "Não foi possível registrar.");
              }
            }}
            className={btn.outline}
          >
            Registrar devolução
          </button>
        </div>
      ) : abrir ? (
        <div className="space-y-3 rounded-2xl bg-canvas p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Com quem ficou" className="sm:col-span-1">
              <input className={inputCls} value={f.comQuem} maxLength={120} placeholder="Ex.: Marina (corretora)" onChange={(e) => setF({ ...f, comQuem: e.target.value })} />
            </Field>
            <Field label="Motivo (opcional)">
              <input className={inputCls} value={f.motivo} maxLength={300} placeholder="Ex.: visita com cliente" onChange={(e) => setF({ ...f, motivo: e.target.value })} />
            </Field>
            <Field label="Devolver até (opcional)">
              <DateInput value={f.devolverAte} onChange={(v) => setF({ ...f, devolverAte: v })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAbrir(false)} className="h-11 rounded-full px-4 text-sm font-semibold text-muted hover:bg-bg">
              Cancelar
            </button>
            <BotaoSalvar
              disabled={!f.comQuem.trim()}
              className={btn.outline}
              onSalvar={async () => {
                try {
                  await retirarChave({
                    captacaoId: captacao.id,
                    comQuem: f.comQuem.trim(),
                    motivo: f.motivo.trim() || undefined,
                    devolverAte: f.devolverAte ? new Date(`${f.devolverAte}T18:00:00`).toISOString() : undefined,
                  });
                  setF({ comQuem: "", motivo: "", devolverAte: "" });
                  setAbrir(false);
                  carregar();
                } catch (e) {
                  toast(e instanceof Error ? e.message : "Não foi possível registrar.");
                  return false;
                }
              }}
            >
              Registrar retirada
            </BotaoSalvar>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4 text-sm">
          <span className="text-muted">As chaves estão na imobiliária.</span>
          <button onClick={() => setAbrir(true)} className={btn.outline}>
            <KeyRound className="size-4" /> Registrar retirada
          </button>
        </div>
      )}
      {lista.filter((c) => c.devolvidaEm).length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-muted">Histórico das chaves</summary>
          <ul className="mt-2 space-y-1.5">
            {lista
              .filter((c) => c.devolvidaEm)
              .map((c) => (
                <li key={c.id} className="text-xs text-muted">
                  {c.comQuem}: {dataHora(c.retiradaEm)} → {dataHora(c.devolvidaEm!)}
                  {c.motivo ? ` · ${c.motivo}` : ""}
                </li>
              ))}
          </ul>
        </details>
      )}
    </div>
  );
}

// ---------- Histórico de preço (janela do imóvel) ----------

export function HistoricoPreco({ captacao }: { captacao: Captacao }) {
  const [lista, setLista] = useState<MudancaPreco[]>([]);
  useEffect(() => {
    historicoPreco(captacao.id).then(setLista).catch(() => setLista([]));
  }, [captacao.id, captacao.valor]);
  if (!lista.length) return null;
  return (
    <div className="rounded-2xl border border-line p-4">
      <p className="mb-2 text-sm font-semibold">Histórico de preço</p>
      <ul className="space-y-1.5">
        {lista.map((m) => {
          const baixou = m.valorDepois < m.valorAntes;
          const pct = m.valorAntes ? Math.abs(((m.valorDepois - m.valorAntes) / m.valorAntes) * 100) : 0;
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-x-2 text-sm">
              {baixou ? <ArrowDownRight className="size-4 text-verified" /> : <ArrowUpRight className="size-4 text-amber-600" />}
              <span className="text-muted line-through">{brl(m.valorAntes)}</span>→<span className="font-semibold">{brl(m.valorDepois)}</span>
              <span className={`text-xs font-semibold ${baixou ? "text-verified" : "text-amber-700"}`}>
                {baixou ? "-" : "+"}
                {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
              </span>
              <span className="text-xs text-subtle">em {dataHora(m.alteradoEm)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------- Combinações entre leads e imóveis ----------

type Perfil = { categoria: string; bairro: string; valor?: number; finalidade?: string };
const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** O que o lead procura, a partir do "Interessado em". */
function perfilDoLead(l: Lead): Perfil | null {
  if (l.interesseCaptacaoId) {
    const c = captacaoById(l.interesseCaptacaoId);
    if (c) return { categoria: captacaoCategoria(c), bairro: captacaoBairro(c), valor: c.valor, finalidade: c.finalidade };
  }
  if (l.interesseImovelId) {
    const im = imoveis.find((i) => i.id === l.interesseImovelId);
    if (im) return { categoria: im.categoria, bairro: im.endereco.bairro };
  }
  return null;
}
/** Mesmo tipo e (mesmo bairro ou valor até 20% de diferença). Quanto mais bate, mais alto na lista. */
function nota(p: Perfil, c: Captacao) {
  if (captacaoCategoria(c) !== p.categoria) return 0;
  if (p.finalidade && c.finalidade !== p.finalidade) return 0;
  const bairro = p.bairro && sem(captacaoBairro(c)) === sem(p.bairro);
  const valor = p.valor && Math.abs(c.valor - p.valor) / p.valor <= 0.2;
  return (bairro ? 2 : 0) + (valor ? 2 : 0);
}

/** Na janela do lead: imóveis captados que combinam com o que ele procura. */
export function ImoveisQueCombinam({ lead, onAbrir }: { lead: Lead; onAbrir?: () => void }) {
  const { scope } = useScope();
  const p = perfilDoLead(lead);
  if (!p) return null;
  const lista = captacoesOf(scope)
    .filter((c) => c.status === "ativa" && c.id !== lead.interesseCaptacaoId)
    .map((c) => ({ c, n: nota(p, c) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-5 text-accent" />
        <p className="font-display text-lg font-semibold">Imóveis que combinam</p>
      </div>
      {lista.length ? (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {lista.map(({ c }) => (
            <li key={c.id}>
              <Link to={`/app/negocios/captacoes?captacao=${c.id}`} onClick={onAbrir} className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-canvas">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{captacaoTitulo(c)}</span>
                  <span className="text-xs text-muted">
                    {valorLabel(c.finalidade, c.valor)} · {captacaoBairro(c)}
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Nenhum outro imóvel do mesmo tipo no bairro ou na faixa de valor.</p>
      )}
    </div>
  );
}

/** Na janela do imóvel: leads cujo interesse combina com ele. */
export function LeadsQueCombinam({ captacao }: { captacao: Captacao }) {
  const { scope } = useScope();
  const lista = leadsOf(scope)
    .filter((l) => l.etapa !== "fechado" && l.etapa !== "perdido")
    .map((l) => {
      const p = perfilDoLead(l);
      const ja = l.interesseCaptacaoId === captacao.id;
      return { l, n: ja ? 5 : p ? nota(p, captacao) : 0, ja };
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  if (!lista.length) return null;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-5 text-accent" />
        <p className="font-display text-lg font-semibold">Leads que combinam</p>
      </div>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {lista.map(({ l, ja }) => (
          <li key={l.id}>
            <Link to={`/app/negocios/leads?lead=${l.id}`} className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-canvas">
              <AvatarNome id={l.id} nome={l.nome} className="size-8 text-[0.625rem]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{l.nome}</span>
                <span className="text-xs text-muted">{ja ? "Já interessado neste imóvel" : l.interesse}</span>
              </span>
              <ChevronRight className="size-4 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
