import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ChevronRight, Lock, Mail, Pause, Play, Plus, RotateCcw, ShieldCheck } from "lucide-react";
import { clienteById, diasSemAcesso, listaClientes, mrrDe, PLANOS, STATUS_CLIENTE, statusDe } from "@/data/platform";
import { useStore } from "@/data/store";
import type { ClienteStatus, PlanoNome } from "@/data/types";
import { brl, int, relTime } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Avatar, Badge, Card, PageHeader, ProgressBar, Select, stagger } from "../kit";
import { btn, Drawer, EmptyState, Field, inputCls, Modal, SearchInput, SelectField } from "../forms";
import { useSession } from "../session";
import { enviarConvitePorEmail, mensagemErro, supabase } from "@/integrations/supabase/client";

const PLANO_OPTS = (Object.keys(PLANOS) as PlanoNome[]).map((p) => ({ value: p, label: `${p} · ${brl(PLANOS[p].preco)}/mês` }));
const iniciais = (s: string) =>
  s
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** "Termina em 26/10 (faltam 3 dias)", "Terminou em 12/10" ou "7 dias, começam no 1º acesso". */
function textoTeste(c: { status: ClienteStatus; testeAte?: string; testeDias?: number }) {
  if (c.status === "aguardando" || !c.testeAte) return `${c.testeDias ?? 7} dias, começam no 1º acesso do administrador`;
  const fim = new Date(c.testeAte);
  const dias = Math.ceil((fim.getTime() - Date.now()) / 864e5);
  const data = fim.toLocaleDateString("pt-BR");
  return dias > 0 ? `Termina em ${data} (${dias === 1 ? "falta 1 dia" : `faltam ${dias} dias`})` : `Terminou em ${data}: acesso bloqueado`;
}

function ClienteDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const store = useStore();
  const c = id ? clienteById(id) : undefined;
  const [plano, setPlano] = useState<PlanoNome>("Equipe 15");
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (c) setPlano(c.plano);
  }, [c?.id, c?.plano]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!c)
    return (
      <Drawer open={false} onClose={onClose} title="">
        {null}
      </Drawer>
    );

  const limite = PLANOS[c.plano].limite;
  const dias = diasSemAcesso(c);
  const uso = [
    { nome: "Negócios", v: c.uso.negocios },
    { nome: "Performance", v: c.uso.performance },
    { nome: "Academy", v: c.uso.academy },
    { nome: "Marketing", v: c.uso.marketing },
  ];
  const maxUso = Math.max(...uso.map((u) => u.v), 1);
  const suspensa = c.status === "suspensa";

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={c.nome}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {c.cidade} · CNPJ {c.cnpj}
            <Badge tone={statusDe(c).tone}>{statusDe(c).label}</Badge>
          </span>
        }
        footer={
          <button onClick={() => setConfirm(true)} className={suspensa ? btn.accent : `${btn.outline} text-rose-600`}>
            {suspensa ? (
              <>
                <Play className="size-4" /> Reativar acesso
              </>
            ) : (
              <>
                <Pause className="size-4" /> Suspender acesso
              </>
            )}
          </button>
        }
      >
        <div className="space-y-7">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-canvas p-3.5">
              <p className="text-xs text-muted">Receita mensal</p>
              <p className="mt-0.5 font-display text-lg font-semibold">{mrrDe(c) ? brl(mrrDe(c)) : "—"}</p>
            </div>
            <div className="rounded-2xl bg-canvas p-3.5">
              <p className="text-xs text-muted">Cliente desde</p>
              <p className="mt-0.5 font-display text-lg font-semibold">{new Date(c.clienteDesde).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="col-span-2 rounded-2xl bg-canvas p-3.5">
              <div className="mb-2 flex justify-between">
                <p className="text-xs text-muted">Vagas em uso · {c.plano}</p>
                <p className="text-xs font-semibold">
                  {c.corretores} de {limite}
                </p>
              </div>
              <ProgressBar value={c.corretores / limite} />
            </div>
            {(c.status === "teste" || (c.status === "aguardando" && c.testeDias)) && (
              <div className="col-span-2 flex flex-wrap items-center gap-3 rounded-2xl bg-accent-soft p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-accent-deep">Teste grátis</p>
                  <p className="mt-0.5 font-semibold">{textoTeste(c)}</p>
                </div>
                <button onClick={() => store.estenderTeste(c.id, 7)} className={`${btn.outline} h-9 bg-bg px-3 text-xs`}>
                  +7 dias
                </button>
                {c.status === "teste" && (
                  <button onClick={() => store.setClienteStatus(c.id, "ativa")} className={`${btn.primary} h-9 px-3 text-xs`}>
                    Virar cliente pagante
                  </button>
                )}
              </div>
            )}
            <div className="col-span-2 rounded-2xl bg-canvas p-3.5">
              <p className="text-xs text-muted">Último acesso</p>
              <p className="mt-0.5 font-semibold">
                {c.ultimoAcesso ? relTime(c.ultimoAcesso) : "Ainda não acessou"}
                {dias !== null && dias >= 14 && <span className="ml-2 text-xs font-semibold text-rose-600">sem uso recente</span>}
              </p>
            </div>
          </div>

          {/* Administrador */}
          <div className="flex items-center gap-3 rounded-2xl border border-line p-4">
            <Avatar user={{ id: c.adminEmail, iniciais: iniciais(c.adminNome) }} className="size-10 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <ShieldCheck className="size-3.5" /> Administrador
              </p>
              <p className="truncate font-semibold">{c.adminNome}</p>
              <p className="truncate text-xs text-muted">{c.adminEmail}</p>
            </div>
            <button onClick={() => store.resendAcesso(c.id)} className={`${btn.outline} h-9 px-3 text-xs`}>
              <RotateCcw className="size-3.5" /> Reenviar acesso
            </button>
          </div>

          {/* Plano */}
          <div>
            <p className="mb-2.5 font-display text-lg font-semibold">Plano</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <SelectField value={plano} onChange={(v) => setPlano(v as PlanoNome)} options={PLANO_OPTS} />
              </div>
              <button disabled={plano === c.plano} onClick={() => store.setClientePlano(c.id, plano)} className={`${btn.primary} h-11`}>
                Aplicar
              </button>
            </div>
            {plano !== c.plano && c.corretores > PLANOS[plano].limite && (
              <p className="mt-2 text-sm text-amber-700">
                Atenção: a imobiliária usa {c.corretores} vagas, mais do que o limite de {PLANOS[plano].limite} deste plano.
              </p>
            )}
          </div>

          {/* Uso */}
          <div>
            <p className="font-display text-lg font-semibold">Uso nos últimos 30 dias</p>
            <p className="mb-4 flex items-start gap-1.5 text-xs text-muted">
              <Lock className="mt-0.5 size-3 shrink-0" /> Somente volumes de uso. Leads, imóveis, vendas e demais dados internos da imobiliária não ficam visíveis para a Frankkia.
            </p>
            <ul className="space-y-3">
              {uso.map((u) => (
                <li key={u.nome}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{u.nome}</span>
                    <span className="text-muted">{int(u.v)} ações</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas-deep">
                    <motion.div className="h-full rounded-full bg-ink" initial={{ width: 0 }} animate={{ width: `${(u.v / maxUso) * 100}%` }} transition={{ duration: 0.8, ease: EASE_OUT_EXPO }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Drawer>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={suspensa ? "Reativar acesso?" : "Suspender acesso?"}
        footer={
          <>
            <button onClick={() => setConfirm(false)} className={btn.outline}>
              Cancelar
            </button>
            <button
              onClick={() => {
                store.setClienteStatus(c.id, (suspensa ? "ativa" : "suspensa") as ClienteStatus);
                setConfirm(false);
              }}
              className={suspensa ? btn.accent : `${btn.primary} bg-rose-600 hover:bg-rose-700`}
            >
              {suspensa ? "Reativar" : "Suspender"}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">
          {suspensa ? (
            <>
              O administrador e os corretores da <span className="font-semibold text-ink">{c.nome}</span> voltam a acessar a plataforma normalmente.
            </>
          ) : (
            <>
              Ninguém da <span className="font-semibold text-ink">{c.nome}</span> vai conseguir usar a plataforma até você reativar. Os dados continuam guardados.
            </>
          )}
        </p>
      </Modal>
    </>
  );
}

function NovaImobiliariaModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { addCliente } = useStore();
  const { modo } = useSession();
  const empty = { nome: "", cidade: "", cnpj: "", plano: "Equipe 15" as PlanoNome, adminNome: "", adminEmail: "", teste: true, testeDias: "7" };
  const [f, setF] = useState(empty);
  const [criada, setCriada] = useState<{ id: string; link: string; enviado: boolean } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  useEffect(() => {
    if (open) {
      setF(empty);
      setCriada(null);
      setErro(null);
      setCopiado(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.adminEmail.trim());
  const ok = f.nome.trim() && f.cidade.trim() && f.adminNome.trim() && emailOk;
  // Mostra o que falta (os campos do administrador ficam no fim da janela, às vezes fora da tela)
  const faltando = [
    !f.nome.trim() && "nome da imobiliária",
    !f.cidade.trim() && "cidade",
    !f.adminNome.trim() && "nome do administrador",
    !emailOk && (f.adminEmail.trim() ? "e-mail válido do administrador" : "e-mail do administrador"),
  ].filter(Boolean) as string[];

  const diasTeste = f.teste ? Math.min(90, Math.max(1, Number(f.testeDias) || 7)) : undefined;
  const criar = async () => {
    const { teste: _t, testeDias: _d, ...resto } = f;
    void _t;
    void _d;
    const dados = { ...resto, nome: f.nome.trim(), cidade: f.cidade.trim(), adminNome: f.adminNome.trim(), adminEmail: f.adminEmail.trim().toLowerCase(), testeDias: diasTeste };
    if (modo !== "real") {
      const c = addCliente(dados);
      onClose();
      onCreated(c.id);
      return;
    }
    // Login real: cria no banco (com ou sem teste grátis) e gera o convite do administrador
    setErro(null);
    setEnviando(true);
    const { data, error } = await supabase.rpc("criar_imobiliaria", {
      p_nome: dados.nome,
      p_cidade: dados.cidade,
      p_cnpj: dados.cnpj,
      p_plano: dados.plano,
      p_admin_email: dados.adminEmail,
      ...(diasTeste ? { p_teste_dias: diasTeste } : {}),
    });
    setEnviando(false);
    const r = data?.[0];
    if (error || !r) {
      setErro(mensagemErro(error));
      return;
    }
    const c = addCliente({ ...dados, id: r.imobiliaria_id });
    const enviado = await enviarConvitePorEmail(r.token);
    setCriada({ id: c.id, link: `${window.location.origin}/convite/${r.token}`, enviado });
  };

  if (criada)
    return (
      <Modal
        open={open}
        onClose={() => {
          onClose();
          onCreated(criada.id);
        }}
        title="Imobiliária criada"
        subtitle={
          criada.enviado
            ? `Enviamos o link de primeiro acesso para ${f.adminEmail.trim().toLowerCase()}. Se quiser, mande também por WhatsApp.`
            : `Envie este link para ${f.adminEmail.trim().toLowerCase()}: é o primeiro acesso do administrador.`
        }
        footer={
          <button
            className={btn.accent}
            onClick={() => {
              onClose();
              onCreated(criada.id);
            }}
          >
            Concluir
          </button>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <input readOnly className={inputCls} value={criada.link} onFocus={(e) => e.target.select()} />
            <button
              className={btn.outline}
              onClick={() => {
                navigator.clipboard?.writeText(criada.link).then(() => setCopiado(true));
              }}
            >
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-muted">O link vale até o convite ser usado.</p>
        </div>
      </Modal>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova imobiliária"
      subtitle="Depois do pagamento, cadastre a imobiliária e envie o acesso do administrador."
      footer={
        <>
          {erro ? (
            <p className="mr-auto self-center text-sm text-rose-700">{erro}</p>
          ) : (
            faltando.length > 0 && <p className="mr-auto self-center text-xs text-muted">Falta preencher: {faltando.join(", ")}.</p>
          )}
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <button disabled={!ok || enviando} className={btn.accent} onClick={criar}>
            <Mail className="size-4" /> {enviando ? "Criando..." : "Criar e enviar acesso"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da imobiliária" className="sm:col-span-2">
          <input autoFocus className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Horizonte Imóveis" />
        </Field>
        <Field label="Cidade">
          <input className={inputCls} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} placeholder="Ex.: Curitiba, PR" />
        </Field>
        <Field label="CNPJ (opcional)">
          <input className={inputCls} value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
        </Field>
        <Field label={f.teste ? "Plano do teste (vagas liberadas)" : "Plano contratado"} className="sm:col-span-2">
          <SelectField value={f.plano} onChange={(v) => setF({ ...f, plano: v as PlanoNome })} options={PLANO_OPTS} />
        </Field>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-canvas p-4 sm:col-span-2">
          <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="size-4 accent-accent" checked={f.teste} onChange={(e) => setF({ ...f, teste: e.target.checked })} /> Teste grátis
          </label>
          {f.teste && (
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                className={`${inputCls} h-9 w-16 text-center`}
                inputMode="numeric"
                value={f.testeDias}
                onChange={(e) => setF({ ...f, testeDias: e.target.value.replace(/\D/g, "").slice(0, 2) })}
              />
              dias, a partir do 1º acesso
            </label>
          )}
          <p className="w-full text-xs text-muted">
            {f.teste
              ? "Quando o prazo acabar, o acesso é bloqueado até a imobiliária contratar um plano (os dados ficam guardados)."
              : "Sem teste: a imobiliária já entra como cliente pagante."}
          </p>
        </div>
        <div className="sm:col-span-2 mt-1 border-t border-line pt-4">
          <p className="text-sm font-semibold">Administrador da imobiliária</p>
          <p className="text-xs text-muted">Recebe o acesso por e-mail e depois convida os corretores.</p>
        </div>
        <Field label="Nome">
          <input className={inputCls} value={f.adminNome} onChange={(e) => setF({ ...f, adminNome: e.target.value })} />
        </Field>
        <Field label="E-mail">
          <input type="email" className={inputCls} value={f.adminEmail} onChange={(e) => setF({ ...f, adminEmail: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

export default function Imobiliarias() {
  useStore();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [plano, setPlano] = useState("");
  const [nova, setNova] = useState(false);

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const all = listaClientes();
  const list = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return all
      .filter((c) => (!status || c.status === status) && (!plano || c.plano === plano) && (!q || `${c.nome} ${c.cidade} ${c.adminNome} ${c.adminEmail}`.toLowerCase().includes(q)))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [all, busca, status, plano, all.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <motion.div {...stagger(0)}>
        <PageHeader
          title="Imobiliárias"
          subtitle={`${all.length} imobiliárias no ecossistema Frankkia.`}
          actions={
            <button onClick={() => setNova(true)} className={btn.accent}>
              <Plus className="size-4" /> Nova imobiliária
            </button>
          }
        />
      </motion.div>

      <motion.div {...stagger(1)} className="flex flex-wrap items-center gap-2">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome, cidade ou administrador..." />
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ value: "", label: "Todos os status" }, ...(Object.keys(STATUS_CLIENTE) as ClienteStatus[]).map((s) => ({ value: s, label: STATUS_CLIENTE[s].label }))]}
        />
        <Select label="Plano" value={plano} onChange={setPlano} options={[{ value: "", label: "Todos os planos" }, ...(Object.keys(PLANOS) as PlanoNome[]).map((p) => ({ value: p, label: p }))]} />
      </motion.div>

      <motion.div {...stagger(2)}>
        <Card className="overflow-hidden">
          {list.length === 0 ? (
            <EmptyState icon={<Building2 className="size-6" />} title="Nenhuma imobiliária encontrada" text="Ajuste a busca ou os filtros." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="px-5 py-3 font-semibold">Imobiliária</th>
                    <th className="px-3 py-3 font-semibold">Plano</th>
                    <th className="px-3 py-3 font-semibold">Vagas</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Último acesso</th>
                    <th className="px-3 py-3 text-right font-semibold">Receita</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((c, i) => {
                    const limite = PLANOS[c.plano].limite;
                    const dias = diasSemAcesso(c);
                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: Math.min(i, 15) * 0.02, ease: EASE_OUT_EXPO }}
                        onClick={() => setParam("id", c.id)}
                        className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas/70"
                      >
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-xs font-bold text-bg">{iniciais(c.nome)}</span>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">{c.nome}</span>
                              <span className="block truncate text-xs text-muted">{c.cidade}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted">{c.plano}</td>
                        <td className="px-3 py-3">
                          <div className="flex w-32 items-center gap-2">
                            <ProgressBar value={c.corretores / limite} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted">
                              {c.corretores}/{limite}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={statusDe(c).tone}>{statusDe(c).label}</Badge>
                        </td>
                        <td className={`px-3 py-3 ${dias !== null && dias >= 14 ? "font-semibold text-rose-600" : "text-muted"}`}>{c.ultimoAcesso ? relTime(c.ultimoAcesso) : "—"}</td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums">{mrrDe(c) ? brl(mrrDe(c)) : "—"}</td>
                        <td className="px-5 py-3 text-right">
                          <ChevronRight className="ml-auto size-4 text-muted" />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      <ClienteDrawer id={params.get("id")} onClose={() => setParam("id", null)} />
      <NovaImobiliariaModal open={nova} onClose={() => setNova(false)} onCreated={(id) => setParam("id", id)} />
    </div>
  );
}
